import json
import hashlib
from unittest.mock import patch, AsyncMock
import pytest
import pandas as pd
from pathlib import Path

from app.versioning.manager import prepare_dataframe_for_parquet, calculate_file_sha256

def test_prepare_dataframe_for_parquet_preserves_native_types_and_handles_mixed():
    """
    Verify that prepare_dataframe_for_parquet:
    1. Safely converts mixed-type object columns (e.g. [1001, 1002, "CustomerID"]) to strings.
    2. Preserves native types (int, float, bool, datetime, pure strings) without converting them blindly.
    """
    df = pd.DataFrame({
        "mixed_id": [1001, 1002, "CustomerID", 1004],
        "int_col": [10, 20, 30, 40],
        "float_col": [1.5, 2.5, 3.5, 4.5],
        "bool_col": [True, False, True, False],
        "str_col": ["alpha", "beta", "gamma", "delta"],
        "date_col": pd.to_datetime(["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"])
    })

    # Prepare for parquet
    df_prep = prepare_dataframe_for_parquet(df)

    # Native types preserved
    assert pd.api.types.is_integer_dtype(df_prep["int_col"])
    assert pd.api.types.is_float_dtype(df_prep["float_col"])
    assert pd.api.types.is_bool_dtype(df_prep["bool_col"])
    assert pd.api.types.is_datetime64_any_dtype(df_prep["date_col"])

    # Mixed column converted to strings
    assert list(df_prep["mixed_id"]) == ["1001", "1002", "CustomerID", "1004"]

    # Original dataframe untouched
    assert df["mixed_id"].iloc[0] == 1001
    assert type(df["mixed_id"].iloc[0]) is int

    # Verify PyArrow can serialize df_prep to Parquet without ArrowInvalid
    import pyarrow as pa
    import pyarrow.parquet as pq
    table = pa.Table.from_pandas(df_prep)
    assert table.num_rows == 4


@pytest.mark.asyncio
async def test_mixed_type_dataset_execution_pipeline(client):
    """
    End-to-end regression test:
    Ingest a realistic dataset containing mixed-type object column CustomerID ([1001, 1002, "CustomerID"]).
    Run Analysis -> Plan -> Preview -> Approve -> Execute.
    Verify:
    1. Version 0 and Version 1 Parquet snapshots are successfully created without ArrowInvalid.
    2. Original raw CSV on disk remains byte-for-byte unchanged.
    3. Rollback to Version 0 succeeds.
    """
    csv_bytes = b"CustomerID,email,amount\n1001, ALICE@EXAMPLE.COM ,100.50\n1002,bob@example.com,200.00\nCustomerID, invalid_email ,300.75\n"
    orig_sha256 = hashlib.sha256(csv_bytes).hexdigest()

    # 1. Ingest dataset
    upload_resp = client.post("/api/v1/upload", files={"file": ("mixed_cust.csv", csv_bytes, "text/csv")})
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    # 2. Mock AI analysis
    mock_ai_json = json.dumps({
        "dataset_summary": "Mixed type dataset test",
        "inferred_constraints": [],
        "recommendations": [
            {
                "column": "email",
                "operation": "normalize_email",
                "reason": "Trim whitespace and lowercase email",
                "confidence": 0.95,
                "risk": "low",
                "parameters": {}
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
    plan_id = plan_resp.json()["plan_id"]

    # 4. Preview dry-run simulation
    prev_resp = client.post(f"/api/v1/preview/{dataset_id}")
    assert prev_resp.status_code == 200

    # 5. Approve plan
    app_resp = client.post(f"/api/v1/plan/{plan_id}/approve")
    assert app_resp.status_code == 200
    assert app_resp.json()["status"] == "approved"

    # 6. Execute plan (MUST NOT fail with 500 ArrowInvalid!)
    exec_resp = client.post(f"/api/v1/execute/{dataset_id}")
    assert exec_resp.status_code == 200
    exec_data = exec_resp.json()

    assert exec_data["status"] == "executed"
    assert exec_data["version_number"] == 1
    assert exec_data["row_count"] == 3

    # 7. Verify original file byte-for-byte unchanged
    meta_resp = client.get(f"/api/v1/datasets/{dataset_id}")
    assert meta_resp.json()["sha256"] == orig_sha256

    # 8. Check Version History
    hist_resp = client.get(f"/api/v1/history/{dataset_id}")
    assert hist_resp.status_code == 200
    versions = hist_resp.json()["versions"]
    assert len(versions) == 2  # Version 0 and Version 1

    # 9. Perform Rollback to Version 0
    rb_resp = client.post(
        f"/api/v1/rollback/{dataset_id}",
        json={"target_version": 0, "reason": "Test rollback to v0"}
    )
    assert rb_resp.status_code == 200
    assert rb_resp.json()["active_version"] == 0
