import hashlib
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Tuple, List, Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.db.models import DatasetModel, VersionModel, ChangeLogModel, RollbackEventModel
from app.models.schemas import CellDiffRecord

def get_dataset_versions_dir(dataset_id: str) -> Path:
    """Get path to versions storage directory for dataset."""
    versions_dir = settings.STORAGE_DIR / dataset_id / "versions"
    versions_dir.mkdir(parents=True, exist_ok=True)
    return versions_dir

def calculate_file_sha256(file_path: Path) -> str:
    """Calculate SHA-256 hash of a file on disk."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def prepare_dataframe_for_parquet(df: pd.DataFrame) -> pd.DataFrame:
    """
    Safely prepare a Pandas DataFrame for Parquet serialization.
    Detects object columns with mixed or incompatible Python value types
    (e.g., integers mixed with strings) and converts them to string representation.
    Preserves native data types (int, float, bool, datetime, pure strings) without altering source values.
    Works strictly on an in-memory copy of the DataFrame.
    """
    import pyarrow as pa

    df_out = df.copy()

    for col in df_out.columns:
        if pd.api.types.is_object_dtype(df_out[col]):
            try:
                pa.Array.from_pandas(df_out[col])
            except (pa.ArrowInvalid, pa.ArrowTypeError, TypeError, ValueError):
                df_out[col] = df_out[col].apply(lambda x: None if pd.isna(x) else str(x))

    # Comprehensive fallback verification for table serialization
    try:
        pa.Table.from_pandas(df_out)
    except (pa.ArrowInvalid, pa.ArrowTypeError, TypeError, ValueError):
        for col in df_out.columns:
            if pd.api.types.is_object_dtype(df_out[col]):
                df_out[col] = df_out[col].apply(lambda x: None if pd.isna(x) else str(x))

    return df_out

def ensure_version_zero(db: Session, dataset: DatasetModel, df_orig: pd.DataFrame) -> VersionModel:
    """
    Ensure Version 0 (Original version) is created and stored as Parquet.
    """
    v0_record = (
        db.query(VersionModel)
        .filter(VersionModel.dataset_id == dataset.id, VersionModel.version_number == 0)
        .first()
    )
    if v0_record:
        return v0_record

    versions_dir = get_dataset_versions_dir(dataset.id)
    v0_path = versions_dir / "v0.parquet"

    # Safely prepare dataframe copy for Parquet serialization
    df_v0 = prepare_dataframe_for_parquet(df_orig)

    try:
        df_v0.to_parquet(v0_path, index=False)
        sha256_hash = calculate_file_sha256(v0_path)
    except Exception as e:
        if v0_path.exists():
            v0_path.unlink()
        raise ValueError(f"Failed to write Version 0 Parquet file: {str(e)}")

    v0 = VersionModel(
        id=f"ver_{uuid.uuid4().hex[:12]}",
        dataset_id=dataset.id,
        version_number=0,
        parent_version_id=None,
        file_path=str(v0_path),
        sha256=sha256_hash,
        row_count=len(df_orig),
        column_count=len(df_orig.columns),
        created_at=dataset.upload_timestamp or datetime.utcnow(),
        pipeline_id="original_ingestion",
        status="active"
    )

    try:
        db.add(v0)
        db.commit()
        db.refresh(v0)
    except Exception as e:
        db.rollback()
        if v0_path.exists():
            v0_path.unlink()
        raise ValueError(f"Database error committing Version 0 record: {str(e)}")

    return v0

def commit_new_version(
    db: Session,
    dataset: DatasetModel,
    df_cleaned: pd.DataFrame,
    plan_id: str,
    cell_diffs: List[CellDiffRecord]
) -> VersionModel:
    """
    Commit transformed DataFrame as a new immutable Parquet dataset version.
    Updates DatasetModel.current_version and records ChangeLog entries.
    """
    new_version_num = dataset.current_version + 1
    versions_dir = get_dataset_versions_dir(dataset.id)
    version_file_path = versions_dir / f"v{new_version_num}.parquet"

    # Safely prepare dataframe copy for Parquet serialization
    df_to_save = prepare_dataframe_for_parquet(df_cleaned)

    try:
        df_to_save.to_parquet(version_file_path, index=False)
        sha256_hash = calculate_file_sha256(version_file_path)
    except Exception as e:
        if version_file_path.exists():
            version_file_path.unlink()
        raise ValueError(f"Failed to write Version {new_version_num} Parquet file: {str(e)}")

    # Find parent version record
    parent_v = (
        db.query(VersionModel)
        .filter(VersionModel.dataset_id == dataset.id, VersionModel.version_number == dataset.current_version)
        .first()
    )

    new_version = VersionModel(
        id=f"ver_{uuid.uuid4().hex[:12]}",
        dataset_id=dataset.id,
        version_number=new_version_num,
        parent_version_id=parent_v.id if parent_v else None,
        file_path=str(version_file_path),
        sha256=sha256_hash,
        row_count=len(df_cleaned),
        column_count=len(df_cleaned.columns),
        created_at=datetime.utcnow(),
        pipeline_id=plan_id,
        status="active"
    )

    db.add(new_version)

    # Persist Change Log entries for cell diffs (up to safe max 100)
    for diff in cell_diffs[:100]:
        cl = ChangeLogModel(
            id=f"cl_{uuid.uuid4().hex[:12]}",
            dataset_id=dataset.id,
            version_id=new_version.id,
            plan_id=plan_id,
            row_identifier=diff.row_index,
            column_name=diff.column_name,
            old_value=diff.old_value,
            new_value=diff.new_value,
            operation=diff.operation,
            timestamp=datetime.utcnow()
        )
        db.add(cl)

    # Update dataset current version
    dataset.current_version = new_version_num
    dataset.status = f"version_{new_version_num}"
    dataset.row_count = len(df_cleaned)
    dataset.column_count = len(df_cleaned.columns)

    db.commit()
    db.refresh(new_version)
    return new_version

def perform_rollback(
    db: Session,
    dataset: DatasetModel,
    target_version: int,
    reason: Optional[str] = None
) -> Tuple[DatasetModel, VersionModel]:
    """
    Safely rollback active dataset version to target_version.
    Verifies file existence and SHA-256 integrity before changing active version.
    Does NOT delete newer versions or files on disk.
    """
    target_ver_record = (
        db.query(VersionModel)
        .filter(VersionModel.dataset_id == dataset.id, VersionModel.version_number == target_version)
        .first()
    )

    if not target_ver_record:
        raise ValueError(f"Version {target_version} does not exist for dataset '{dataset.id}'.")

    target_path = Path(target_ver_record.file_path)
    if not target_path.exists():
        raise ValueError(f"Parquet storage file for Version {target_version} is missing on disk.")

    # Integrity verification via SHA-256
    current_hash = calculate_file_sha256(target_path)
    if current_hash != target_ver_record.sha256:
        raise ValueError(f"Integrity check failed: SHA-256 hash mismatch for Version {target_version}.")

    from_ver = dataset.current_version

    # Update active version
    dataset.current_version = target_version
    dataset.status = f"version_{target_version}" if target_version > 0 else "original"
    dataset.row_count = target_ver_record.row_count
    dataset.column_count = target_ver_record.column_count

    # Record Rollback Event
    event = RollbackEventModel(
        id=f"rb_{uuid.uuid4().hex[:12]}",
        dataset_id=dataset.id,
        from_version=from_ver,
        to_version=target_version,
        timestamp=datetime.utcnow(),
        reason=reason
    )
    db.add(event)

    db.commit()
    db.refresh(dataset)
    return dataset, target_ver_record
