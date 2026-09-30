import json
import hashlib
from unittest.mock import patch, AsyncMock
import pytest

@pytest.mark.asyncio
async def test_user_selected_transformations_only_executed(client):
    """
    Test that when AI recommends multiple transformations,
    submitting ONLY selected transformations ensures unselected recommendations
    are NEVER previewed, approved, or executed.
    """
    # 1. Upload dataset with multiple dirty fields
    csv_bytes = b"customer_id,email,phone,age\nCUST_1, ALICE@EXAMPLE.COM ,5550192834,25\nCUST_2,bob@example.com,555-019-2835,30\nCUST_1, ALICE@EXAMPLE.COM ,5550192834,25\n"
    upload_resp = client.post("/api/v1/upload", files={"file": ("selection_test.csv", csv_bytes, "text/csv")})
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    # 2. Mock AI analysis recommending 3 transformations
    mock_ai_json = json.dumps({
        "dataset_summary": "Test dataset for selection",
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
                "column": "phone",
                "operation": "normalize_phone",
                "reason": "Phone formatting",
                "confidence": 0.90,
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

    # 3. Create cleaning plan with ONLY 1 selected transformation (normalize_email)
    selected_items = [
        {
            "column": "email",
            "operation": "normalize_email",
            "reason": "Email formatting",
            "confidence": 0.95,
            "risk": "low",
            "parameters": {}
        }
    ]

    plan_resp = client.post(
        f"/api/v1/plan/{dataset_id}",
        json={"selected_transformations": selected_items}
    )
    assert plan_resp.status_code == 201
    plan_data = plan_resp.json()
    plan_id = plan_data["plan_id"]
    assert plan_data["status"] == "draft"

    # VERIFY ONLY 1 transformation is in the persisted plan!
    assert len(plan_data["transformations"]) == 1
    assert plan_data["transformations"][0]["column"] == "email"
    assert plan_data["transformations"][0]["operation"] == "normalize_email"

    # 4. Dry Run Preview Simulation
    preview_resp = client.post(f"/api/v1/preview/{dataset_id}")
    assert preview_resp.status_code == 200
    prev_data = preview_resp.json()

    # VERIFY preview operates ONLY on selected transformation
    assert len(prev_data["transformation_stats"]) == 1
    assert prev_data["transformation_stats"][0]["column"] == "email"
    assert prev_data["loss_summary"]["simulated_row_count"] == 3
    assert prev_data["loss_summary"]["rows_removed"] == 0

    # 5. Approve Plan
    approve_resp = client.post(f"/api/v1/plan/{plan_id}/approve")
    assert approve_resp.status_code == 200

    # 6. Execute Plan
    exec_resp = client.post(f"/api/v1/execute/{dataset_id}")
    assert exec_resp.status_code == 200
    exec_data = exec_resp.json()
    assert exec_data["status"] == "executed"
    assert exec_data["row_count"] == 3


@pytest.mark.asyncio
async def test_empty_selected_transformations_rejected(client):
    """
    Test that submitting zero selected transformations returns 400 Bad Request.
    """
    csv_bytes = b"id,val\n1,a\n"
    upload_resp = client.post("/api/v1/upload", files={"file": ("empty_sel.csv", csv_bytes, "text/csv")})
    dataset_id = upload_resp.json()["id"]

    mock_ai_json = json.dumps({
        "dataset_summary": "Summary",
        "recommendations": [{"column": "val", "operation": "trim_whitespace", "reason": "Trim", "confidence": 0.9, "risk": "low"}]
    })

    with patch("app.api.routes.dataset.GroqClient.is_configured", return_value=True):
        with patch("app.api.routes.dataset.GroqClient.analyze_profile", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = mock_ai_json
            client.post(f"/api/v1/analyze/{dataset_id}")

    # Submit empty list -> 400 Bad Request
    resp = client.post(
        f"/api/v1/plan/{dataset_id}",
        json={"selected_transformations": []}
    )
    assert resp.status_code == 400
    assert "Select at least one transformation" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_approval_gating_and_selection_invalidation(client):
    """
    Test that:
    1. Execution is unavailable before approval (returns 400).
    2. Preview is required before approval (returns 400).
    3. Modifying selection resets plan to draft, invalidating previous approval/executable state.
    4. Already executed plan cannot be executed or approved again.
    """
    csv_bytes = b"id,email\n1, ALICE@EXAMPLE.COM \n"
    upload_resp = client.post("/api/v1/upload", files={"file": ("gate_test.csv", csv_bytes, "text/csv")})
    dataset_id = upload_resp.json()["id"]

    mock_ai_json = json.dumps({
        "dataset_summary": "Summary",
        "recommendations": [{"column": "email", "operation": "normalize_email", "reason": "Reason", "confidence": 0.9, "risk": "low"}]
    })

    with patch("app.api.routes.dataset.GroqClient.is_configured", return_value=True):
        with patch("app.api.routes.dataset.GroqClient.analyze_profile", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = mock_ai_json
            client.post(f"/api/v1/analyze/{dataset_id}")

    # Step A: Draft plan created
    plan_resp = client.post(f"/api/v1/plan/{dataset_id}")
    plan_id = plan_resp.json()["plan_id"]
    assert plan_resp.json()["status"] == "draft"

    # Rule 1: Attempt execution on draft plan MUST fail (400 Bad Request)
    exec_fail = client.post(f"/api/v1/execute/{dataset_id}")
    assert exec_fail.status_code == 400
    assert "APPROVED" in exec_fail.json()["detail"]

    # Rule 2: Attempt approval before preview MUST fail (400 Bad Request)
    app_fail = client.post(f"/api/v1/plan/{plan_id}/approve")
    assert app_fail.status_code == 400
    assert "must be previewed" in app_fail.json()["detail"]

    # Step B: Run Preview
    prev_resp = client.post(f"/api/v1/preview/{dataset_id}")
    assert prev_resp.status_code == 200

    # Rule 3: Execution on simulated plan (before approval) MUST still fail (400 Bad Request)
    exec_fail_sim = client.post(f"/api/v1/execute/{dataset_id}")
    assert exec_fail_sim.status_code == 400

    # Step C: Changing selection resets plan to draft
    new_selection = [{"column": "email", "operation": "trim_whitespace", "reason": "Trim", "confidence": 0.9, "risk": "low", "parameters": {}}]
    updated_plan_resp = client.post(f"/api/v1/plan/{dataset_id}", json={"selected_transformations": new_selection})
    new_plan_id = updated_plan_resp.json()["plan_id"]
    assert updated_plan_resp.json()["status"] == "draft"

    # Execution on modified draft plan MUST fail
    exec_fail_draft = client.post(f"/api/v1/execute/{dataset_id}")
    assert exec_fail_draft.status_code == 400

    # Step D: Preview & Approve new selection
    client.post(f"/api/v1/preview/{dataset_id}")
    app_ok = client.post(f"/api/v1/plan/{new_plan_id}/approve")
    assert app_ok.status_code == 200
    assert app_ok.json()["status"] == "approved"

    # Step E: Execute approved plan
    exec_ok = client.post(f"/api/v1/execute/{dataset_id}")
    assert exec_ok.status_code == 200
    assert exec_ok.json()["status"] == "executed"

    # Rule 4: Already executed plan cannot be re-executed or re-approved
    re_app = client.post(f"/api/v1/plan/{new_plan_id}/approve")
    assert re_app.status_code == 400
    assert "already been executed" in re_app.json()["detail"]
