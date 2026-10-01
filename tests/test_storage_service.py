import os
import pytest
import httpx
from pathlib import Path
from app.storage.service import StorageService, StorageServiceError

def test_storage_service_local_sync(tmp_path):
    storage = StorageService(storage_mode="local")
    storage.local_dir = tmp_path

    # Test path generation
    orig_path = storage.get_original_object_path("ds_123", "test_file.csv")
    assert orig_path == "datasets/ds_123/original/test_file.csv"

    ver_path = storage.get_version_object_path("ds_123", 1)
    assert ver_path == "datasets/ds_123/versions/v1.parquet"

    # Test Upload Sync
    sample_data = b"col1,col2\nval1,val2\n"
    stored_key = storage.upload_bytes_sync(orig_path, sample_data, content_type="text/csv")
    assert stored_key == orig_path

    # Test Download Sync
    downloaded_data = storage.download_bytes_sync(orig_path)
    assert downloaded_data == sample_data

    # Test Delete Sync
    deleted = storage.delete_object_sync(orig_path)
    assert deleted is True

    # Confirm deleted
    with pytest.raises(StorageServiceError):
        storage.download_bytes_sync(orig_path)

@pytest.mark.asyncio
async def test_storage_service_local_async(tmp_path):
    storage = StorageService(storage_mode="local")
    storage.local_dir = tmp_path

    path_key = "datasets/ds_async/original/data.csv"
    sample_data = b"a,b,c\n1,2,3\n"

    uploaded_key = await storage.upload_bytes(path_key, sample_data)
    assert uploaded_key == path_key

    fetched_bytes = await storage.download_bytes(path_key)
    assert fetched_bytes == sample_data

    deleted = await storage.delete_object(path_key)
    assert deleted is True

def test_storage_service_supabase_mock(monkeypatch):
    storage = StorageService(
        storage_mode="supabase",
        supabase_url="https://testproject.supabase.co",
        service_role_key="test-service-role-key",
        bucket_name="data-forge-storage"
    )
    assert storage.is_supabase_mode() is True

    # Mock httpx.Client post/get/delete
    sample_bytes = b"supabase_content"

    class MockResponse:
        def __init__(self, status_code, content=b""):
            self.status_code = status_code
            self.content = content
        def json(self):
            return [{"name": "original/file.csv"}]

    class MockClient:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

        def post(self, url, headers=None, content=None, json=None):
            return MockResponse(200, content=content or b"")
        def get(self, url, headers=None):
            if "missing" in url:
                return MockResponse(404)
            return MockResponse(200, content=sample_bytes)
        def delete(self, url, headers=None, json=None):
            return MockResponse(200)

    monkeypatch.setattr(httpx, "Client", MockClient)

    key = storage.upload_bytes_sync("datasets/ds_sb/file.csv", sample_bytes)
    assert key == "datasets/ds_sb/file.csv"

    downloaded = storage.download_bytes_sync("datasets/ds_sb/file.csv")
    assert downloaded == sample_bytes

    with pytest.raises(StorageServiceError):
        storage.download_bytes_sync("datasets/ds_sb/missing.csv")

    deleted = storage.delete_object_sync("datasets/ds_sb/file.csv")
    assert deleted is True

    ns_deleted = storage.delete_dataset_namespace_sync("ds_sb")
    assert ns_deleted is True
