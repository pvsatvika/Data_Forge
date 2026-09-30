from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from app.db.session import Base

class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String(64), primary_key=True, index=True)
    owner_id = Column(String(255), nullable=True, index=True)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)
    file_size = Column(Integer, nullable=False)
    sha256 = Column(String(64), nullable=False)
    storage_path = Column(String(512), nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="uploaded", nullable=False)
    profile_status = Column(String(50), default="pending", nullable=False)
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    duplicate_row_count = Column(Integer, nullable=True)
    duplicate_row_percentage = Column(Float, nullable=True)
    current_version = Column(Integer, default=0, nullable=False)
    profile_json = Column(Text, nullable=True)

class AnalysisModel(Base):
    __tablename__ = "analyses"

    id = Column(String(64), primary_key=True, index=True)
    dataset_id = Column(String(64), index=True, nullable=False)
    model_used = Column(String(100), nullable=False)
    analyzed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    result_json = Column(Text, nullable=False)

class PlanModel(Base):
    __tablename__ = "plans"

    id = Column(String(64), primary_key=True, index=True)
    dataset_id = Column(String(64), index=True, nullable=False)
    analysis_id = Column(String(64), index=True, nullable=True)
    status = Column(String(50), default="draft", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    approved_at = Column(DateTime, nullable=True)
    executed_at = Column(DateTime, nullable=True)
    estimated_loss_score = Column(Float, nullable=True)
    rows_affected = Column(Integer, nullable=True)
    cells_changed = Column(Integer, nullable=True)
    rows_removed = Column(Integer, nullable=True)
    values_nullified = Column(Integer, nullable=True)
    plan_json = Column(Text, nullable=False)
    preview_json = Column(Text, nullable=True)

class VersionModel(Base):
    __tablename__ = "versions"

    id = Column(String(64), primary_key=True, index=True)
    dataset_id = Column(String(64), index=True, nullable=False)
    version_number = Column(Integer, nullable=False)
    parent_version_id = Column(String(64), nullable=True)
    file_path = Column(String(512), nullable=False)
    sha256 = Column(String(64), nullable=False)
    row_count = Column(Integer, nullable=False)
    column_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    pipeline_id = Column(String(64), nullable=True)
    status = Column(String(50), default="active", nullable=False)

class ChangeLogModel(Base):
    __tablename__ = "change_logs"

    id = Column(String(64), primary_key=True, index=True)
    dataset_id = Column(String(64), index=True, nullable=False)
    version_id = Column(String(64), index=True, nullable=False)
    plan_id = Column(String(64), index=True, nullable=False)
    row_identifier = Column(Integer, nullable=False)
    column_name = Column(String(255), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    operation = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

class ValidationModel(Base):
    __tablename__ = "validations"

    id = Column(String(64), primary_key=True, index=True)
    dataset_id = Column(String(64), index=True, nullable=False)
    version_id = Column(String(64), index=True, nullable=True)
    plan_id = Column(String(64), index=True, nullable=False)
    overall_status = Column(String(20), nullable=False) # PASS, WARN, FAIL
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    result_json = Column(Text, nullable=False)

class RollbackEventModel(Base):
    __tablename__ = "rollback_events"

    id = Column(String(64), primary_key=True, index=True)
    dataset_id = Column(String(64), index=True, nullable=False)
    from_version = Column(Integer, nullable=False)
    to_version = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    reason = Column(Text, nullable=True)
