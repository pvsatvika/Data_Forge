import hashlib
import os
import re
from pathlib import Path
from fastapi import HTTPException, status
from app.config.settings import settings

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks and unwanted control characters.
    Extracts only the basename and strips dangerous characters.
    """
    if not filename:
        return "unnamed_dataset"
    
    # Strip path components (handles both POSIX and Windows separators)
    clean_name = Path(filename).name
    # Remove control characters and null bytes
    clean_name = re.sub(r'[\x00-\x1f\x7f]', '', clean_name)
    # Remove relative path tokens if present
    clean_name = clean_name.replace("..", "").replace("/", "").replace("\\", "")
    
    if not clean_name:
        return "unnamed_dataset"
    return clean_name

def validate_uploaded_file_header(filename: str, file_size: int) -> str:
    """
    Validate extension, file size, and non-emptiness.
    Returns normalized extension (.csv or .xlsx).
    Raises HTTPException on validation failure.
    """
    clean_name = sanitize_filename(filename)
    ext = Path(clean_name).suffix.lower()

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Only CSV (.csv) and Excel (.xlsx) files are supported."
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    return ext

def calculate_sha256(content: bytes) -> str:
    """Calculate SHA-256 hash string for file content bytes."""
    return hashlib.sha256(content).hexdigest()
