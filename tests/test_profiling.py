import io
import pytest
import pandas as pd
from app.profiling.profiler import profile_dataset_dataframe, load_dataset_dataframe

def test_nonexistent_dataset_404(client):
    response = client.get("/api/v1/profile/ds_nonexistent999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_profiling_normal_dataset(client):
    csv_data = (
        "id,email,age,score,city\n"
        "1,john@example.com,25,90.5,NY\n"
        "2,jane@example.com,30,85.0,LA\n"
        "3,bob@domain.org,35,92.0,NY\n"
        "4,alice@example.com,28,88.5,SF\n"
    )
    upload_resp = client.post(
        "/api/v1/upload",
        files={"file": ("profile_test.csv", csv_data.encode("utf-8"), "text/csv")}
    )
    dataset_id = upload_resp.json()["id"]

    prof_resp = client.get(f"/api/v1/profile/{dataset_id}")
    assert prof_resp.status_code == 200
    profile = prof_resp.json()

    assert profile["dataset_id"] == dataset_id
    assert profile["row_count"] == 4
    assert profile["column_count"] == 5
    assert profile["duplicate_row_count"] == 0

    # Column inspection
    col_map = {c["column_name"]: c for c in profile["columns"]}
    assert "email" in col_map
    assert col_map["email"]["semantic_hints"]["likely_email"] is True
    assert col_map["age"]["semantic_hints"]["likely_numeric"] is True
    assert col_map["score"]["min_val"] == 85.0
    assert col_map["score"]["max_val"] == 92.0

def test_missing_values_and_duplicate_rows(client):
    csv_data = (
        "name,val\n"
        "A,10\n"
        "A,10\n"
        "B,\n"
        ",20\n"
    )
    upload_resp = client.post(
        "/api/v1/upload",
        files={"file": ("missing_dup.csv", csv_data.encode("utf-8"), "text/csv")}
    )
    dataset_id = upload_resp.json()["id"]

    prof_resp = client.get(f"/api/v1/profile/{dataset_id}")
    assert prof_resp.status_code == 200
    profile = prof_resp.json()

    assert profile["row_count"] == 4
    assert profile["duplicate_row_count"] == 1
    assert profile["duplicate_row_percentage"] == 25.0

    col_map = {c["column_name"]: c for c in profile["columns"]}
    assert col_map["name"]["null_count"] == 1
    assert col_map["name"]["null_percentage"] == 25.0
    assert col_map["val"]["null_count"] == 1

def test_numeric_statistics_calculation():
    df = pd.DataFrame({
        "num": [10.0, 20.0, 30.0, 40.0, 50.0, None]
    })
    prof = profile_dataset_dataframe(df, "ds_test_num")
    col = prof.columns[0]
    assert col.min_val == 10.0
    assert col.max_val == 50.0
    assert col.mean_val == 30.0
    assert col.median_val == 30.0

def test_mixed_type_columns_safe_profiling():
    df = pd.DataFrame({
        "mixed": [100, "N/A", 200, "Unknown", 300, None]
    })
    prof = profile_dataset_dataframe(df, "ds_test_mixed")
    col = prof.columns[0]
    assert col.null_count == 1
    assert col.inferred_type in ("string", "categorical")
    assert len(col.sample_values) > 0

def test_malformed_csv_profiling(client):
    # CSV with extra unescaped quotes or uneven row counts
    bad_csv = (
        "header1,header2\n"
        "val1,val2,extra_val\n"
        "row2_val1\n"
        "row3_val1,row3_val2\n"
    )
    upload_resp = client.post(
        "/api/v1/upload",
        files={"file": ("malformed.csv", bad_csv.encode("utf-8"), "text/csv")}
    )
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    prof_resp = client.get(f"/api/v1/profile/{dataset_id}")
    assert prof_resp.status_code == 200
    profile = prof_resp.json()
    assert profile["row_count"] > 0
