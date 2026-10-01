import os
import io
import hashlib
from pathlib import Path
from typing import Optional
import httpx
from app.config.settings import settings

class StorageServiceError(Exception):
    """Base exception for storage operations."""
    pass

class StorageService:
    def __init__(
        self,
        storage_mode: Optional[str] = None,
        supabase_url: Optional[str] = None,
        service_role_key: Optional[str] = None,
        bucket_name: Optional[str] = None
    ):
        self.mode = (storage_mode or settings.STORAGE_MODE).lower()
        self.supabase_url = (supabase_url or settings.SUPABASE_URL).rstrip("/")
        self.service_role_key = service_role_key or settings.SUPABASE_SERVICE_ROLE_KEY
        self.bucket_name = bucket_name or settings.SUPABASE_STORAGE_BUCKET
        self.local_dir = settings.STORAGE_DIR

        # If service role key is set and mode is auto/supabase, set mode to supabase
        if self.service_role_key and self.mode in ("auto", "supabase"):
            self.mode = "supabase"
        elif self.mode != "supabase":
            self.mode = "local"

    def is_supabase_mode(self) -> bool:
        return self.mode == "supabase" and bool(self.service_role_key)

    def get_original_object_path(self, dataset_id: str, filename: str) -> str:
        """Deterministic object key for original dataset upload file."""
        safe_filename = os.path.basename(filename)
        return f"datasets/{dataset_id}/original/{safe_filename}"

    def get_version_object_path(self, dataset_id: str, version_number: int) -> str:
        """Deterministic object key for versioned Parquet dataset file."""
        return f"datasets/{dataset_id}/versions/v{version_number}.parquet"

    # --- Synchronous Storage Operations ---

    def upload_bytes_sync(self, object_path: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Synchronously upload raw byte buffer to persistent storage (Supabase Bucket or Local Disk)."""
        clean_path = object_path.lstrip('/')

        if self.is_supabase_mode():
            headers = {
                "Authorization": f"Bearer {self.service_role_key}",
                "apiKey": self.service_role_key,
                "Content-Type": content_type,
                "x-upsert": "true"
            }
            url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{clean_path}"
            try:
                with httpx.Client(timeout=30.0) as client:
                    resp = client.post(url, headers=headers, content=data)
                    if resp.status_code not in (200, 201):
                        raise StorageServiceError(f"Supabase Storage upload failed with status {resp.status_code}.")
                return clean_path
            except httpx.RequestError as e:
                raise StorageServiceError(f"Network error connecting to Supabase Storage: {type(e).__name__}")
        else:
            local_path = Path(clean_path) if os.path.isabs(clean_path) else self.local_dir / clean_path
            local_path.parent.mkdir(parents=True, exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(data)
            return clean_path


    def download_bytes_sync(self, object_path: str) -> bytes:
        """Synchronously download raw byte buffer from persistent storage."""
        clean_path = object_path.lstrip('/')

        if self.is_supabase_mode():
            headers = {
                "Authorization": f"Bearer {self.service_role_key}",
                "apiKey": self.service_role_key
            }
            url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{clean_path}"
            try:
                with httpx.Client(timeout=30.0) as client:
                    resp = client.get(url, headers=headers)
                    if resp.status_code != 200:
                        raise StorageServiceError(f"File not found in Supabase Storage or access error (HTTP {resp.status_code}).")
                    return resp.content
            except httpx.RequestError as e:
                raise StorageServiceError(f"Network error connecting to Supabase Storage: {type(e).__name__}")
        else:
            path = Path(object_path) if os.path.isabs(object_path) else self.local_dir / clean_path
            if not path.exists():
                raise StorageServiceError(f"Local dataset file not found on disk at path: {object_path}")
            with open(path, "rb") as f:
                return f.read()

    def delete_object_sync(self, object_path: str) -> bool:
        """Synchronously delete an object from persistent storage."""
        clean_path = object_path.lstrip('/')

        if self.is_supabase_mode():
            headers = {
                "Authorization": f"Bearer {self.service_role_key}",
                "apiKey": self.service_role_key,
                "Content-Type": "application/json"
            }
            url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}"
            payload = {"prefixes": [clean_path]}
            try:
                with httpx.Client(timeout=30.0) as client:
                    resp = client.delete(url, headers=headers, json=payload)
                    return resp.status_code in (200, 204)
            except Exception:
                return False
        else:
            path = Path(object_path) if os.path.isabs(object_path) else self.local_dir / clean_path
            if path.exists():
                try:
                    path.unlink()
                    return True
                except Exception:
                    return False
            return False

    def delete_dataset_namespace_sync(self, dataset_id: str) -> bool:
        """Synchronously delete all storage objects within a dataset namespace."""
        if self.is_supabase_mode():
            prefix = f"datasets/{dataset_id}"
            headers = {
                "Authorization": f"Bearer {self.service_role_key}",
                "apiKey": self.service_role_key,
                "Content-Type": "application/json"
            }
            list_url = f"{self.supabase_url}/storage/v1/object/list/{self.bucket_name}"
            try:
                with httpx.Client(timeout=30.0) as client:
                    res = client.post(list_url, headers=headers, json={"prefix": prefix, "limit": 100})
                    if res.status_code == 200:
                        files = res.json()
                        prefixes_to_delete = [f"{prefix}/{f['name']}" for f in files if "name" in f]
                        if prefixes_to_delete:
                            del_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}"
                            client.delete(del_url, headers=headers, json={"prefixes": prefixes_to_delete})
                return True
            except Exception:
                return False
        else:
            dataset_dir = self.local_dir / dataset_id
            if dataset_dir.exists():
                import shutil
                shutil.rmtree(dataset_dir, ignore_errors=True)
            return True

    # --- Asynchronous Storage Operations ---

    async def upload_bytes(self, object_path: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        clean_path = object_path.lstrip('/')
        if self.is_supabase_mode():
            headers = {
                "Authorization": f"Bearer {self.service_role_key}",
                "apiKey": self.service_role_key,
                "Content-Type": content_type,
                "x-upsert": "true"
            }
            url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{clean_path}"
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, headers=headers, content=data)
                    if resp.status_code not in (200, 201):
                        raise StorageServiceError(f"Supabase Storage upload failed with status {resp.status_code}.")
                return clean_path
            except httpx.RequestError as e:
                raise StorageServiceError(f"Network error connecting to Supabase Storage: {type(e).__name__}")
        else:
            return self.upload_bytes_sync(object_path, data, content_type)

    async def download_bytes(self, object_path: str) -> bytes:
        clean_path = object_path.lstrip('/')
        if self.is_supabase_mode():
            headers = {
                "Authorization": f"Bearer {self.service_role_key}",
                "apiKey": self.service_role_key
            }
            url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{clean_path}"
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code != 200:
                        raise StorageServiceError(f"File not found in Supabase Storage or access error (HTTP {resp.status_code}).")
                    return resp.content
            except httpx.RequestError as e:
                raise StorageServiceError(f"Network error connecting to Supabase Storage: {type(e).__name__}")
        else:
            return self.download_bytes_sync(object_path)

    async def delete_object(self, object_path: str) -> bool:
        return self.delete_object_sync(object_path)

    async def delete_dataset_namespace(self, dataset_id: str) -> bool:
        return self.delete_dataset_namespace_sync(dataset_id)

storage_service = StorageService()
