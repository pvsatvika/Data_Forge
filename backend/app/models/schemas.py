from datetime import datetime
from typing import Dict, List, Any, Optional, Literal
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "Data Forge API"
    version: str = "0.1.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    environment: str = "development"

class DatasetMetadata(BaseModel):
    id: str
    owner_id: Optional[str] = None
    original_filename: str
    file_type: str
    file_size: int
    sha256: str
    upload_timestamp: datetime
    status: str
    profile_status: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    current_version: int = 0

    class Config:
        from_attributes = True

class SemanticHints(BaseModel):
    likely_identifier: bool = False
    likely_email: bool = False
    likely_phone: bool = False
    likely_date: bool = False
    likely_numeric: bool = False
    likely_categorical: bool = False
    likely_boolean: bool = False

class ColumnProfile(BaseModel):
    column_name: str
    inferred_type: str
    null_count: int
    null_percentage: float
    unique_count: int
    unique_percentage: float
    duplicate_count: int
    sample_values: List[Any]
    min_val: Optional[Any] = None
    max_val: Optional[Any] = None
    mean_val: Optional[float] = None
    median_val: Optional[float] = None
    semantic_hints: SemanticHints

class DatasetProfile(BaseModel):
    dataset_id: str
    row_count: int
    column_count: int
    duplicate_row_count: int
    duplicate_row_percentage: float
    columns: List[ColumnProfile]

# --- AI Semantic Analysis Schemas ---

class InferredConstraint(BaseModel):
    column: str
    constraint_type: str
    description: str
    confidence: float = Field(ge=0.0, le=1.0)

class CleaningRecommendation(BaseModel):
    column: str
    operation: str
    reason: str
    confidence: float = Field(ge=0.0, le=1.0)
    risk: Literal["low", "medium", "high"]
    parameters: Dict[str, Any] = Field(default_factory=dict)

class AnalysisWarning(BaseModel):
    type: str
    message: str
    severity: Literal["info", "warning", "critical"] = "warning"

class SemanticAnalysisResponse(BaseModel):
    analysis_id: str
    dataset_id: str
    model_used: str
    dataset_summary: str
    inferred_constraints: List[InferredConstraint]
    recommendations: List[CleaningRecommendation]
    warnings: List[AnalysisWarning]
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)

# --- Phase 4 & 5 Execution, Versioning & Validation Schemas ---

class TransformationPlanItem(BaseModel):
    column: str
    operation: str
    reason: str
    confidence: float = Field(ge=0.0, le=1.0)
    risk: Literal["low", "medium", "high"]
    parameters: Dict[str, Any] = Field(default_factory=dict)

class RiskSummary(BaseModel):
    low_count: int = 0
    medium_count: int = 0
    high_count: int = 0
    requires_approval: bool = False

class TransformationStats(BaseModel):
    operation: str
    column: str
    affected_rows: int
    changed_cells: int
    nulls_created: int
    rows_removed: int

class CellDiffRecord(BaseModel):
    row_index: int
    column_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    operation: str

class InformationLossSummary(BaseModel):
    original_row_count: int
    simulated_row_count: int
    rows_affected: int
    rows_removed: int
    cells_changed: int
    values_nullified: int
    columns_affected: List[str]
    estimated_loss_score: float = Field(
        description="Project-defined engineering loss index from 0.0 (no loss) to 1.0 (heavy loss)"
    )

class CreatePlanRequest(BaseModel):
    selected_transformations: Optional[List[TransformationPlanItem]] = None

class CleaningPlanResponse(BaseModel):
    plan_id: str
    dataset_id: str
    analysis_id: Optional[str] = None
    status: str
    transformations: List[TransformationPlanItem]
    risk_summary: RiskSummary
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None

class PlanPreviewResponse(BaseModel):
    plan_id: str
    dataset_id: str
    status: str
    risk_summary: RiskSummary
    loss_summary: InformationLossSummary
    transformation_stats: List[TransformationStats]
    cell_diffs: List[CellDiffRecord]
    diff_truncated: bool = False

class ValidationCheckItemResponse(BaseModel):
    check_name: str
    status: Literal["PASS", "WARN", "FAIL"]
    severity: Literal["info", "warning", "critical"]
    expected: str
    actual: str
    message: str

class ValidationReportResponse(BaseModel):
    validation_id: str
    dataset_id: str
    version_id: Optional[str] = None
    plan_id: str
    overall_status: Literal["PASS", "WARN", "FAIL"]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    checks: List[ValidationCheckItemResponse]

class ExecutionResponse(BaseModel):
    dataset_id: str
    version_id: str
    version_number: int
    plan_id: str
    status: str # executed
    sha256: str
    row_count: int
    column_count: int
    validation_status: str # PASS, WARN
    executed_at: datetime = Field(default_factory=datetime.utcnow)

class VersionItem(BaseModel):
    version_id: str
    dataset_id: str
    version_number: int
    parent_version_id: Optional[str] = None
    sha256: str
    row_count: int
    column_count: int
    created_at: datetime
    pipeline_id: Optional[str] = None
    status: str
    is_active: bool = False

class DatasetHistoryResponse(BaseModel):
    dataset_id: str
    current_version: int
    versions: List[VersionItem]

class RollbackRequest(BaseModel):
    target_version: int
    reason: Optional[str] = None

class RollbackResponse(BaseModel):
    dataset_id: str
    active_version: int
    message: str
    sha256: str
    rolled_back_at: datetime = Field(default_factory=datetime.utcnow)
