import json
import hashlib
from unittest.mock import patch, AsyncMock
import pytest
import pandas as pd

def test_missing_ai_analysis_returns_400(client):
    csv_bytes = b"id,val\n1,a\n"
    upload_resp = client.post("/api/v1/upload", files={"file": ("test.csv", csv_bytes, "text/csv")})
    dataset_id = upload_resp.json()["id"]

    # Plan creation without AI analysis returns 400
    resp = client.post(f"/api/v1/plan/{dataset_id}")
    assert resp.status_code == 400
    assert "AI semantic analysis" in resp.json()["detail"]

@pytest.mark.asyncio
async def test_create_plan_preview_and_approval_workflow(client):
    # 1. Ingest dataset
    csv_bytes = b"customer_id,email,phone,age\nCUST_1, ALICE@EXAMPLE.COM ,5550192834,25\nCUST_2,bob@example.com,555-019-2835,30\nCUST_1, ALICE@EXAMPLE.COM ,5550192834,25\n"
    orig_sha256 = hashlib.sha256(csv_bytes).hexdigest()

    upload_resp = client.post("/api/v1/upload", files={"file": ("workflow.csv", csv_bytes, "text/csv")})
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    # 2. Mock AI analysis
    mock_ai_json = json.dumps({
        "dataset_summary": "Test dataset",
        "inferred_constraints": [],
        "recommendations": [
            {
                "column": "email",
                "operation": "normalize_email",
                "reason": "Email formatting",
                "confidence": 0.95,
                "risk": "low"
            },
            {
                "column": "customer_id",
                "operation": "remove_duplicates",
                "reason": "Duplicate records",
                "confidence": 0.90,
                "risk": "high"
            }
        ],
        "warnings": []
    })

    with patch("app.api.routes.dataset.GroqClient.is_configured", return_value=True):
        with patch("app.api.routes.dataset.GroqClient.analyze_profile", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = mock_ai_json
            client.post(f"/api/v1/analyze/{dataset_id}")

    # 3. Create cleaning plan
    plan_resp = client.post(f"/api/v1/plan/{dataset_id}")
    assert plan_resp.status_code == 201
    plan_data = plan_resp.json()
    plan_id = plan_data["plan_id"]
    assert plan_data["status"] == "draft"
    assert len(plan_data["transformations"]) == 2
    assert plan_data["risk_summary"]["low_count"] == 1
    assert plan_data["risk_summary"]["high_count"] == 1
    assert plan_data["risk_summary"]["requires_approval"] is True

    # 4. Attempt approval before preview MUST fail (400 Bad Request)
    approve_fail_resp = client.post(f"/api/v1/plan/{plan_id}/approve")
    assert approve_fail_resp.status_code == 400
    assert "must be previewed/simulated" in approve_fail_resp.json()["detail"]

    # 5. Run Dry Run Preview Simulation
    preview_resp = client.post(f"/api/v1/preview/{dataset_id}")
    assert preview_resp.status_code == 200
    prev_data = preview_resp.json()
    assert prev_data["status"] == "awaiting_approval"
    assert prev_data["loss_summary"]["original_row_count"] == 3
    assert prev_data["loss_summary"]["simulated_row_count"] == 2
    assert prev_data["loss_summary"]["rows_removed"] == 1
    assert prev_data["loss_summary"]["estimated_loss_score"] > 0.0
    assert len(prev_data["cell_diffs"]) > 0

    # Verify original file byte-for-byte unchanged!
    meta_resp = client.get(f"/api/v1/datasets/{dataset_id}")
    assert meta_resp.json()["sha256"] == orig_sha256

    # 6. Approve Plan
    approve_resp = client.post(f"/api/v1/plan/{plan_id}/approve")
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "approved"
    assert approve_resp.json()["approved_at"] is not None

def test_plan_rejection(client):
    csv_bytes = b"id,val\n1,a\n"
    upload_resp = client.post("/api/v1/upload", files={"file": ("reject.csv", csv_bytes, "text/csv")})
    dataset_id = upload_resp.json()["id"]

    mock_ai_json = json.dumps({
        "dataset_summary": "Summary",
        "recommendations": [{"column": "val", "operation": "trim_whitespace", "reason": "Trim", "confidence": 0.9, "risk": "low"}]
    })

    with patch("app.api.routes.dataset.GroqClient.is_configured", return_value=True):
        with patch("app.api.routes.dataset.GroqClient.analyze_profile", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = mock_ai_json
            client.post(f"/api/v1/analyze/{dataset_id}")

    plan_resp = client.post(f"/api/v1/plan/{dataset_id}")
    plan_id = plan_resp.json()["plan_id"]

    reject_resp = client.post(f"/api/v1/plan/{plan_id}/reject")
    assert reject_resp.status_code == 200
    assert reject_resp.json()["status"] == "rejected"
