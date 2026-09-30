import json
import hashlib
from unittest.mock import patch, AsyncMock
import pytest

@pytest.mark.asyncio
async def test_version_history_and_rollback(client):
    csv_bytes = b"id,email\n1, ALICE@EXAMPLE.COM \n2, BOB@EXAMPLE.COM \n"
    upload_resp = client.post("/api/v1/upload", files={"file": ("history.csv", csv_bytes, "text/csv")})
    dataset_id = upload_resp.json()["id"]

    mock_ai_json = json.dumps({
        "dataset_summary": "Summary",
        "recommendations": [{"column": "email", "operation": "normalize_email", "reason": "Trim", "confidence": 0.95, "risk": "low"}]
    })

    with patch("app.api.routes.dataset.GroqClient.is_configured", return_value=True):
        with patch("app.api.routes.dataset.GroqClient.analyze_profile", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = mock_ai_json
            client.post(f"/api/v1/analyze/{dataset_id}")

    # Execute Version 1
    plan_resp = client.post(f"/api/v1/plan/{dataset_id}")
    plan_id = plan_resp.json()["plan_id"]
    client.post(f"/api/v1/preview/{dataset_id}")
    client.post(f"/api/v1/plan/{plan_id}/approve")
    exec_resp = client.post(f"/api/v1/execute/{dataset_id}")
    assert exec_resp.status_code == 200
    assert exec_resp.json()["version_number"] == 1

    # Check History API
    hist_resp = client.get(f"/api/v1/history/{dataset_id}")
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert hist_data["current_version"] == 1
    assert len(hist_data["versions"]) >= 2  # Version 1 and Version 0

    # Test Rollback to Version 0
    rb_resp = client.post(f"/api/v1/rollback/{dataset_id}", json={"target_version": 0, "reason": "Test rollback to 0"})
    assert rb_resp.status_code == 200
    assert rb_resp.json()["active_version"] == 0

    # Verify history still contains Version 1 (Parquet file NOT deleted!)
    hist_after = client.get(f"/api/v1/history/{dataset_id}")
    assert len(hist_after.json()["versions"]) >= 2
    assert hist_after.json()["current_version"] == 0

    # Rollback back to Version 1
    rb1_resp = client.post(f"/api/v1/rollback/{dataset_id}", json={"target_version": 1})
    assert rb1_resp.status_code == 200
    assert rb1_resp.json()["active_version"] == 1

def test_rollback_invalid_version_rejected(client):
    csv_bytes = b"id,val\n1,a\n"
    upload_resp = client.post("/api/v1/upload", files={"file": ("invalid_ver.csv", csv_bytes, "text/csv")})
    dataset_id = upload_resp.json()["id"]

    rb_resp = client.post(f"/api/v1/rollback/{dataset_id}", json={"target_version": 999})
    assert rb_resp.status_code == 400
    assert "does not exist" in rb_resp.json()["detail"]

def test_download_active_and_version_endpoints(client):
    csv_bytes = b"id,val\n1,a\n"
    upload_resp = client.post("/api/v1/upload", files={"file": ("download.csv", csv_bytes, "text/csv")})
    dataset_id = upload_resp.json()["id"]

    # Download active (Version 0)
    dl_resp = client.get(f"/api/v1/download/{dataset_id}")
    assert dl_resp.status_code == 200
    assert dl_resp.content == csv_bytes

    # Invalid version download -> 404
    dl_bad = client.get(f"/api/v1/download/{dataset_id}?version=99")
    assert dl_bad.status_code == 404

def test_clear_dataset_history(client):
    csv_bytes = b"id,val\n1,a\n"
    upload_resp = client.post("/api/v1/upload", files={"file": ("clear.csv", csv_bytes, "text/csv")})
    dataset_id = upload_resp.json()["id"]

    clear_resp = client.post(f"/api/v1/history/{dataset_id}/clear")
    assert clear_resp.status_code == 200
    assert clear_resp.json()["dataset_id"] == dataset_id
    assert "successfully cleared" in clear_resp.json()["message"]

