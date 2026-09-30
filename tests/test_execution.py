import json
import hashlib
from unittest.mock import patch, AsyncMock
import pytest

def test_unapproved_plan_cannot_execute(client):
    csv_bytes = b"id,email\n1,ALICE@EXAMPLE.COM \n"
    upload_resp = client.post("/api/v1/upload", files={"file": ("unapproved.csv", csv_bytes, "text/csv")})
    dataset_id = upload_resp.json()["id"]

    mock_ai_json = json.dumps({
        "dataset_summary": "Summary",
        "recommendations": [{"column": "email", "operation": "normalize_email", "reason": "Reason", "confidence": 0.9, "risk": "low"}]
    })

    with patch("app.api.routes.dataset.GroqClient.is_configured", return_value=True):
        with patch("app.api.routes.dataset.GroqClient.analyze_profile", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = mock_ai_json
            client.post(f"/api/v1/analyze/{dataset_id}")

    client.post(f"/api/v1/plan/{dataset_id}")

    # Attempt execute on unapproved plan -> 400 Bad Request
    exec_resp = client.post(f"/api/v1/execute/{dataset_id}")
    assert exec_resp.status_code == 400
    assert "APPROVED" in exec_resp.json()["detail"]

@pytest.mark.asyncio
async def test_successful_execution_pipeline_and_versioning(client):
    csv_bytes = b"id,email,phone\n1, ALICE@EXAMPLE.COM ,5550192834\n2,bob@example.com,555-019-2835\n"
    orig_sha256 = hashlib.sha256(csv_bytes).hexdigest()

    upload_resp = client.post("/api/v1/upload", files={"file": ("test_exec.csv", csv_bytes, "text/csv")})
    dataset_id = upload_resp.json()["id"]

    mock_ai_json = json.dumps({
        "dataset_summary": "Summary",
        "recommendations": [
            {"column": "email", "operation": "normalize_email", "reason": "Trim casing", "confidence": 0.95, "risk": "low"}
        ]
    })

    with patch("app.api.routes.dataset.GroqClient.is_configured", return_value=True):
        with patch("app.api.routes.dataset.GroqClient.analyze_profile", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = mock_ai_json
            client.post(f"/api/v1/analyze/{dataset_id}")

    # Create plan
    plan_resp = client.post(f"/api/v1/plan/{dataset_id}")
    plan_id = plan_resp.json()["plan_id"]

    # Preview dry run
    client.post(f"/api/v1/preview/{dataset_id}")

    # Approve plan
    client.post(f"/api/v1/plan/{plan_id}/approve")

    # Execute plan -> Version 1
    exec_resp = client.post(f"/api/v1/execute/{dataset_id}")
    assert exec_resp.status_code == 200
    exec_data = exec_resp.json()

    assert exec_data["version_number"] == 1
    assert exec_data["status"] == "executed"
    assert exec_data["validation_status"] in ("PASS", "WARN")
    assert exec_data["sha256"] is not None

    # Check Dataset metadata current version updated
    ds_resp = client.get(f"/api/v1/datasets/{dataset_id}")
    assert ds_resp.json()["current_version"] == 1
    assert ds_resp.json()["sha256"] == orig_sha256  # Original file untouched!

    # Check Validation report
    val_resp = client.get(f"/api/v1/validation/{dataset_id}")
    assert val_resp.status_code == 200
    assert val_resp.json()["overall_status"] in ("PASS", "WARN")
