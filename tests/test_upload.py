import hashlib
import io
from pathlib import Path
import pytest
import pandas as pd

def test_valid_csv_upload(client):
    csv_content = b"id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com\n"
    response = client.post(
        "/api/v1/upload",
        files={"file": ("test_dataset.csv", csv_content, "text/csv")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["id"].startswith("ds_")
    assert data["original_filename"] == "test_dataset.csv"
    assert data["file_type"] == ".csv"
    assert data["file_size"] == len(csv_content)
    assert data["sha256"] == hashlib.sha256(csv_content).hexdigest()
    assert data["status"] == "uploaded"
    assert data["profile_status"] == "pending"

def test_valid_xlsx_upload(client):
    df = pd.DataFrame({"id": [1, 2], "name": ["Alice", "Bob"]})
    excel_io = io.BytesIO()
    with pd.ExcelWriter(excel_io, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    excel_bytes = excel_io.getvalue()

    response = client.post(
        "/api/v1/upload",
        files={"file": ("data.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["id"].startswith("ds_")
    assert data["file_type"] == ".xlsx"
    assert data["sha256"] == hashlib.sha256(excel_bytes).hexdigest()

def test_unsupported_extension_rejection(client):
    response = client.post(
        "/api/v1/upload",
        files={"file": ("malicious.py", b"print('hack')", "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]

def test_empty_file_rejection(client):
    response = client.post(
        "/api/v1/upload",
        files={"file": ("empty.csv", b"", "text/csv")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_path_traversal_filename_attempt(client):
    csv_content = b"a,b\n1,2\n"
    response = client.post(
        "/api/v1/upload",
        files={"file": ("../../../../etc/passwd.csv", csv_content, "text/csv")}
    )
    assert response.status_code == 201
    data = response.json()
    assert ".." not in data["original_filename"]
    assert "/" not in data["original_filename"]
    assert "\\" not in data["original_filename"]
    assert data["original_filename"] == "passwd.csv"

def test_sha256_and_original_file_immutability(client):
    csv_content = b"col1,col2\nval1,val2\n"
    expected_hash = hashlib.sha256(csv_content).hexdigest()

    response = client.post(
        "/api/v1/upload",
        files={"file": ("immutable_test.csv", csv_content, "text/csv")}
    )
    assert response.status_code == 201
    dataset_id = response.json()["id"]

    # Retrieve dataset metadata
    get_resp = client.get(f"/api/v1/datasets/{dataset_id}")
    assert get_resp.status_code == 200
    meta = get_resp.json()
    assert meta["sha256"] == expected_hash

    # Profile dataset
    prof_resp = client.get(f"/api/v1/profile/{dataset_id}")
    assert prof_resp.status_code == 200

    # Ensure metadata hash is unchanged
    get_resp_after = client.get(f"/api/v1/datasets/{dataset_id}")
    assert get_resp_after.json()["sha256"] == expected_hash
