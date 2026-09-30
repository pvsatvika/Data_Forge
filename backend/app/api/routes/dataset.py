import json
import uuid
import tempfile
from pathlib import Path
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import pandas as pd

from app.config.settings import settings
from app.db.session import get_db
from app.db.models import (
    DatasetModel,
    AnalysisModel,
    PlanModel,
    VersionModel,
    ValidationModel,
    RollbackEventModel
)
from app.models.schemas import (
    DatasetMetadata,
    DatasetProfile,
    SemanticAnalysisResponse,
    CleaningPlanResponse,
    CreatePlanRequest,
    PlanPreviewResponse,
    ExecutionResponse,
    ValidationReportResponse,
    DatasetHistoryResponse,
    VersionItem,
    RollbackRequest,
    RollbackResponse
)
from app.security.file_validation import (
    sanitize_filename,
    validate_uploaded_file_header,
    calculate_sha256
)
from app.profiling.profiler import load_dataset_dataframe, profile_dataset_dataframe
from app.ai import SemanticAnalyzer, GroqClient, GroqClientError, ResponseValidationError
from app.planning import CleaningPlanBuilder
from app.loss_estimation import run_dry_run_simulation
from app.validation import run_validation_suite
from app.versioning import (
    ensure_version_zero,
    commit_new_version,
    perform_rollback,
    calculate_file_sha256
)

router = APIRouter(tags=["Datasets"])

@router.post("/upload", response_model=DatasetMetadata, status_code=status.HTTP_201_CREATED)
@router.post("/datasets/upload", response_model=DatasetMetadata, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Ingest a CSV or XLSX dataset file.
    Calculates SHA-256, stores original file immutably under data/uploads/,
    and records metadata in SQLite database.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing from upload request."
        )

    clean_orig_filename = sanitize_filename(file.filename)
    
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file contents: {str(e)}"
        )

    file_size = len(content)
    file_ext = validate_uploaded_file_header(clean_orig_filename, file_size)

    dataset_id = f"ds_{uuid.uuid4().hex[:12]}"
    saved_filename = f"{dataset_id}{file_ext}"
    storage_path = settings.UPLOAD_DIR / saved_filename

    try:
        with open(storage_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist dataset file on server storage: {str(e)}"
        )

    sha256_hash = calculate_sha256(content)

    db_dataset = DatasetModel(
        id=dataset_id,
        original_filename=clean_orig_filename,
        file_type=file_ext,
        file_size=file_size,
        sha256=sha256_hash,
        storage_path=str(storage_path),
        upload_timestamp=datetime.utcnow(),
        status="uploaded",
        profile_status="pending",
        current_version=0
    )

    try:
        db.add(db_dataset)
        db.commit()
        db.refresh(db_dataset)
    except Exception as e:
        db.rollback()
        if storage_path.exists():
            storage_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record dataset metadata in database."
        )

    return DatasetMetadata.model_validate(db_dataset)

@router.get("/datasets", response_model=List[DatasetMetadata])
async def list_datasets(
    db: Session = Depends(get_db)
):
    """Retrieve all uploaded datasets ordered by upload timestamp descending."""
    datasets = db.query(DatasetModel).order_by(DatasetModel.upload_timestamp.desc()).all()
    return [DatasetMetadata.model_validate(ds) for ds in datasets]

@router.get("/datasets/{dataset_id}", response_model=DatasetMetadata)
async def get_dataset(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Fetch dataset metadata by unique dataset ID."""
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )
    return DatasetMetadata.model_validate(db_dataset)

@router.get("/profile/{dataset_id}", response_model=DatasetProfile)
@router.get("/datasets/{dataset_id}/profile", response_model=DatasetProfile)
async def get_or_generate_profile(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve or generate statistical profile for a dataset."""
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    if db_dataset.profile_status == "completed" and db_dataset.profile_json:
        try:
            profile_dict = json.loads(db_dataset.profile_json)
            return DatasetProfile.model_validate(profile_dict)
        except Exception:
            pass

    storage_path = Path(db_dataset.storage_path)
    if not storage_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset file is missing from server storage."
        )

    try:
        df = load_dataset_dataframe(str(storage_path), db_dataset.file_type)
        profile = profile_dataset_dataframe(df, dataset_id)
    except Exception as e:
        db_dataset.profile_status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to profile dataset: {str(e)}"
        )

    profile_json_str = json.dumps(profile.model_dump())
    db_dataset.row_count = profile.row_count
    db_dataset.column_count = profile.column_count
    db_dataset.duplicate_row_count = profile.duplicate_row_count
    db_dataset.duplicate_row_percentage = profile.duplicate_row_percentage
    db_dataset.profile_status = "completed"
    db_dataset.status = "profiled"
    db_dataset.profile_json = profile_json_str

    db.commit()

    return profile

@router.post("/analyze/{dataset_id}", response_model=SemanticAnalysisResponse)
@router.post("/datasets/{dataset_id}/analyze", response_model=SemanticAnalysisResponse)
async def analyze_dataset_with_ai(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Trigger Groq AI semantic analysis on dataset profile."""
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    groq_client = GroqClient()
    if not groq_client.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Groq API key is not configured. Please set GROQ_API_KEY environment variable to enable AI semantic analysis."
        )

    storage_path = Path(db_dataset.storage_path)
    if not storage_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset storage file not found."
        )

    try:
        df = load_dataset_dataframe(str(storage_path), db_dataset.file_type)
        profile = profile_dataset_dataframe(df, dataset_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract dataset profile for AI analysis: {str(e)}"
        )

    analyzer = SemanticAnalyzer(client=groq_client)
    try:
        analysis_result = await analyzer.analyze_dataset_profile(profile)
    except GroqClientError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq AI service error: {str(e)}"
        )
    except ResponseValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"AI output validation failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error during AI analysis: {str(e)}"
        )

    db_analysis = AnalysisModel(
        id=analysis_result.analysis_id,
        dataset_id=dataset_id,
        model_used=analysis_result.model_used,
        analyzed_at=datetime.utcnow(),
        result_json=json.dumps(analysis_result.model_dump(mode="json"))
    )

    try:
        db.add(db_analysis)
        db.commit()
    except Exception:
        db.rollback()

    return analysis_result

@router.get("/analyze/{dataset_id}", response_model=SemanticAnalysisResponse)
@router.get("/datasets/{dataset_id}/analyze", response_model=SemanticAnalysisResponse)
async def get_latest_analysis(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve latest stored AI semantic analysis."""
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    db_analysis = (
        db.query(AnalysisModel)
        .filter(AnalysisModel.dataset_id == dataset_id)
        .order_by(AnalysisModel.analyzed_at.desc())
        .first()
    )

    if not db_analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No AI semantic analysis found for dataset '{dataset_id}'. Trigger POST /api/v1/analyze/{dataset_id} first."
        )

    try:
        data = json.loads(db_analysis.result_json)
        return SemanticAnalysisResponse.model_validate(data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse stored AI analysis record: {str(e)}"
        )

@router.post("/plan/{dataset_id}", response_model=CleaningPlanResponse, status_code=status.HTTP_201_CREATED)
@router.post("/datasets/{dataset_id}/plan", response_model=CleaningPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_cleaning_plan(
    dataset_id: str,
    request_data: Optional[CreatePlanRequest] = None,
    db: Session = Depends(get_db)
):
    """Construct a validated CleaningPlan from Groq AI analysis or user-selected transformations."""
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    db_analysis = (
        db.query(AnalysisModel)
        .filter(AnalysisModel.dataset_id == dataset_id)
        .order_by(AnalysisModel.analyzed_at.desc())
        .first()
    )

    if not db_analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No AI semantic analysis found for dataset '{dataset_id}'. Run AI analysis first."
        )

    selected_items = request_data.selected_transformations if request_data else None

    if selected_items is not None and len(selected_items) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Select at least one transformation to continue."
        )

    column_types = {}
    if db_dataset.profile_json:
        try:
            profile_data = json.loads(db_dataset.profile_json)
            column_types = {col["column_name"]: col.get("inferred_type", "") for col in profile_data.get("columns", [])}
        except Exception:
            pass

    analysis_response = SemanticAnalysisResponse.model_validate(json.loads(db_analysis.result_json))
    plan_id = f"plan_{uuid.uuid4().hex[:12]}"

    plan_response = CleaningPlanBuilder.build_plan_from_analysis(
        analysis_response,
        plan_id,
        column_types=column_types,
        selected_transformations=selected_items
    )

    if len(plan_response.transformations) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Select at least one transformation to continue."
        )

    db_plan = PlanModel(
        id=plan_response.plan_id,
        dataset_id=dataset_id,
        analysis_id=analysis_response.analysis_id,
        status="draft",
        created_at=datetime.utcnow(),
        plan_json=json.dumps(plan_response.model_dump(mode="json"))
    )

    try:
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist cleaning plan: {str(e)}"
        )

    return plan_response

@router.get("/plan/{dataset_id}", response_model=CleaningPlanResponse)
@router.get("/datasets/{dataset_id}/plan", response_model=CleaningPlanResponse)
async def get_latest_cleaning_plan(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve the latest cleaning plan for a dataset."""
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    db_plan = (
        db.query(PlanModel)
        .filter(PlanModel.dataset_id == dataset_id)
        .order_by(PlanModel.created_at.desc())
        .first()
    )

    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No cleaning plan found for dataset '{dataset_id}'."
        )

    return CleaningPlanResponse.model_validate(json.loads(db_plan.plan_json))

@router.post("/preview/{dataset_id}", response_model=PlanPreviewResponse)
@router.post("/datasets/{dataset_id}/preview", response_model=PlanPreviewResponse)
async def preview_cleaning_plan_dry_run(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """
    Run in-memory dry-run simulation against an isolated copy of the dataset.
    Calculates cell diffs, transformation stats, and Information Loss Index.
    Original uploaded dataset file remains 100% untouched on disk.
    """
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    db_plan = (
        db.query(PlanModel)
        .filter(PlanModel.dataset_id == dataset_id)
        .order_by(PlanModel.created_at.desc())
        .first()
    )

    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No cleaning plan found for dataset '{dataset_id}'. Create a cleaning plan first."
        )

    plan_obj = CleaningPlanResponse.model_validate(json.loads(db_plan.plan_json))
    storage_path = Path(db_dataset.storage_path)
    if not storage_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset storage file not found."
        )

    df_orig = load_dataset_dataframe(str(storage_path), db_dataset.file_type)

    loss_summary, stats_list, cell_diffs, truncated = run_dry_run_simulation(
        df_original=df_orig,
        transformations=plan_obj.transformations
    )

    new_status = "awaiting_approval" if plan_obj.risk_summary.requires_approval else "simulated"
    plan_obj.status = new_status

    preview_response = PlanPreviewResponse(
        plan_id=plan_obj.plan_id,
        dataset_id=dataset_id,
        status=new_status,
        risk_summary=plan_obj.risk_summary,
        loss_summary=loss_summary,
        transformation_stats=stats_list,
        cell_diffs=cell_diffs,
        diff_truncated=truncated
    )

    db_plan.status = new_status
    db_plan.estimated_loss_score = loss_summary.estimated_loss_score
    db_plan.rows_affected = loss_summary.rows_affected
    db_plan.cells_changed = loss_summary.cells_changed
    db_plan.rows_removed = loss_summary.rows_removed
    db_plan.values_nullified = loss_summary.values_nullified
    db_plan.plan_json = json.dumps(plan_obj.model_dump(mode="json"))
    db_plan.preview_json = json.dumps(preview_response.model_dump(mode="json"))

    db.commit()

    return preview_response

@router.post("/plan/{plan_id}/approve", response_model=CleaningPlanResponse)
async def approve_cleaning_plan(
    plan_id: str,
    db: Session = Depends(get_db)
):
    """
    Approval Gate Endpoint.
    Validates plan simulation status before approving.
    Does NOT execute transformations on dataset files.
    """
    db_plan = db.query(PlanModel).filter(PlanModel.id == plan_id).first()
    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cleaning plan with ID '{plan_id}' not found."
        )

    if db_plan.status == "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cleaning plan must be previewed/simulated before approval."
        )

    if db_plan.status == "executed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cleaning plan has already been executed."
        )

    plan_obj = CleaningPlanResponse.model_validate(json.loads(db_plan.plan_json))
    plan_obj.status = "approved"
    plan_obj.approved_at = datetime.utcnow()

    db_plan.status = "approved"
    db_plan.approved_at = plan_obj.approved_at
    db_plan.plan_json = json.dumps(plan_obj.model_dump(mode="json"))

    db.commit()

    return plan_obj

@router.post("/plan/{plan_id}/reject", response_model=CleaningPlanResponse)
async def reject_cleaning_plan(
    plan_id: str,
    db: Session = Depends(get_db)
):
    """Reject a cleaning plan."""
    db_plan = db.query(PlanModel).filter(PlanModel.id == plan_id).first()
    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cleaning plan with ID '{plan_id}' not found."
        )

    plan_obj = CleaningPlanResponse.model_validate(json.loads(db_plan.plan_json))
    plan_obj.status = "rejected"

    db_plan.status = "rejected"
    db_plan.plan_json = json.dumps(plan_obj.model_dump(mode="json"))

    db.commit()

    return plan_obj

# --- PHASE 5 EXECUTION, VALIDATION, VERSIONING & ROLLBACK ENDPOINTS ---

@router.post("/execute/{dataset_id}", response_model=ExecutionResponse)
@router.post("/datasets/{dataset_id}/execute", response_model=ExecutionResponse)
async def execute_approved_plan(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """
    Phase 5 Execution Engine.
    Requires an APPROVED cleaning plan that completed dry-run simulation.
    Runs validation suite. If validation passes, commits new immutable Parquet version and updates version state.
    If validation fails, aborts commit and leaves current active version untouched.
    """
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    db_plan = (
        db.query(PlanModel)
        .filter(PlanModel.dataset_id == dataset_id)
        .order_by(PlanModel.created_at.desc())
        .first()
    )

    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No cleaning plan found for dataset '{dataset_id}'."
        )

    plan_obj = CleaningPlanResponse.model_validate(json.loads(db_plan.plan_json))
    if plan_obj.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cleaning plan status is '{plan_obj.status}'. Only APPROVED plans can be executed."
        )

    if not db_plan.preview_json:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cleaning plan must complete a dry-run preview simulation before execution."
        )

    preview_obj = PlanPreviewResponse.model_validate(json.loads(db_plan.preview_json))

    # Load original dataset as working DataFrame
    storage_path = Path(db_dataset.storage_path)
    df_orig = load_dataset_dataframe(str(storage_path), db_dataset.file_type)

    # Ensure Version 0 is recorded in DB safely
    try:
        ensure_version_zero(db, db_dataset, df_orig)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to create Version 0 Parquet snapshot: {str(e)}"
        )

    # Execute simulation to get transformed DataFrame & diffs
    _, _, cell_diffs, _ = run_dry_run_simulation(df_orig, plan_obj.transformations)

    # Work on copy for transformations
    df_cleaned = df_orig.copy()
    for item in plan_obj.transformations:
        from app.transformations import get_transformation_function, validate_transformation_parameters
        func = get_transformation_function(item.operation)
        params = validate_transformation_parameters(item.operation, item.parameters)
        df_cleaned, _ = func(df_cleaned, item.column, params)

    # Get profile for validation
    profile = profile_dataset_dataframe(df_orig, dataset_id)

    # Run Validation Suite
    overall_status, checks = run_validation_suite(df_orig, df_cleaned, profile, plan_obj, preview_obj)

    # Store validation report
    val_id = f"val_{uuid.uuid4().hex[:12]}"
    val_report = ValidationReportResponse(
        validation_id=val_id,
        dataset_id=dataset_id,
        plan_id=plan_obj.plan_id,
        overall_status=overall_status, # PASS, WARN, FAIL
        created_at=datetime.utcnow(),
        checks=checks
    )

    db_val = ValidationModel(
        id=val_id,
        dataset_id=dataset_id,
        plan_id=plan_obj.plan_id,
        overall_status=overall_status,
        created_at=datetime.utcnow(),
        result_json=json.dumps(val_report.model_dump(mode="json"))
    )
    db.add(db_val)

    # FAIL status MUST prevent version commit!
    if overall_status == "FAIL":
        db_plan.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Transformation failed automated validation suite ({len([c for c in checks if c['status']=='FAIL'])} critical failures). Version commit aborted."
        )

    # Commit new Parquet version
    try:
        new_version = commit_new_version(
            db=db,
            dataset=db_dataset,
            df_cleaned=df_cleaned,
            plan_id=plan_obj.plan_id,
            cell_diffs=cell_diffs
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to commit new version: {str(e)}"
        )

    # Update plan status to EXECUTED
    plan_obj.status = "executed"
    db_plan.status = "executed"
    db_plan.executed_at = datetime.utcnow()
    db_plan.plan_json = json.dumps(plan_obj.model_dump(mode="json"))
    db_val.version_id = new_version.id

    db.commit()

    return ExecutionResponse(
        dataset_id=dataset_id,
        version_id=new_version.id,
        version_number=new_version.version_number,
        plan_id=plan_obj.plan_id,
        status="executed",
        sha256=new_version.sha256,
        row_count=new_version.row_count,
        column_count=new_version.column_count,
        validation_status=overall_status,
        executed_at=datetime.utcnow()
    )

@router.get("/validation/{dataset_id}", response_model=ValidationReportResponse)
@router.get("/datasets/{dataset_id}/validation", response_model=ValidationReportResponse)
async def get_latest_validation_report(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve latest automated validation report for dataset."""
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    db_val = (
        db.query(ValidationModel)
        .filter(ValidationModel.dataset_id == dataset_id)
        .order_by(ValidationModel.created_at.desc())
        .first()
    )

    if not db_val:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No validation reports found for dataset '{dataset_id}'."
        )

    return ValidationReportResponse.model_validate(json.loads(db_val.result_json))

@router.get("/history/{dataset_id}", response_model=DatasetHistoryResponse)
@router.get("/datasets/{dataset_id}/history", response_model=DatasetHistoryResponse)
async def get_dataset_version_history(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve complete immutable version history for a dataset."""
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    # Ensure Version 0 exists in DB
    storage_path = Path(db_dataset.storage_path)
    if storage_path.exists():
        df_orig = load_dataset_dataframe(str(storage_path), db_dataset.file_type)
        ensure_version_zero(db, db_dataset, df_orig)

    db_versions = (
        db.query(VersionModel)
        .filter(VersionModel.dataset_id == dataset_id)
        .order_by(VersionModel.version_number.desc())
        .all()
    )

    version_items: List[VersionItem] = []
    for v in db_versions:
        version_items.append(
            VersionItem(
                version_id=v.id,
                dataset_id=v.dataset_id,
                version_number=v.version_number,
                parent_version_id=v.parent_version_id,
                sha256=v.sha256,
                row_count=v.row_count,
                column_count=v.column_count,
                created_at=v.created_at,
                pipeline_id=v.pipeline_id,
                status=v.status,
                is_active=(v.version_number == db_dataset.current_version)
            )
        )

    return DatasetHistoryResponse(
        dataset_id=dataset_id,
        current_version=db_dataset.current_version,
        versions=version_items
    )

@router.post("/rollback/{dataset_id}", response_model=RollbackResponse)
@router.post("/datasets/{dataset_id}/rollback", response_model=RollbackResponse)
async def rollback_dataset_version_endpoint(
    dataset_id: str,
    request: RollbackRequest,
    db: Session = Depends(get_db)
):
    """
    Rollback active dataset version to target_version.
    Verifies target version existence and SHA-256 integrity hash.
    Does NOT delete newer versions or files on disk.
    """
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    try:
        updated_dataset, target_ver = perform_rollback(
            db=db,
            dataset=db_dataset,
            target_version=request.target_version,
            reason=request.reason
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return RollbackResponse(
        dataset_id=dataset_id,
        active_version=updated_dataset.current_version,
        message=f"Successfully rolled back dataset '{dataset_id}' active state to Version {request.target_version}.",
        sha256=target_ver.sha256,
        rolled_back_at=datetime.utcnow()
    )

@router.get("/download/{dataset_id}")
@router.get("/datasets/{dataset_id}/download")
async def download_dataset_version(
    dataset_id: str,
    version: Optional[int] = Query(None, description="Target version number (defaults to active version)"),
    db: Session = Depends(get_db)
):
    """
    Download specified or active dataset version.
    Returns safe file stream as CSV.
    """
    db_dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not db_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' not found."
        )

    target_ver_num = version if version is not None else db_dataset.current_version

    if target_ver_num == 0:
        # Version 0 original file
        file_path = Path(db_dataset.storage_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Original dataset file not found.")
        return FileResponse(
            path=file_path,
            filename=f"{db_dataset.original_filename}",
            media_type="application/octet-stream"
        )
    else:
        # Version Parquet file
        ver_record = (
            db.query(VersionModel)
            .filter(VersionModel.dataset_id == dataset_id, VersionModel.version_number == target_ver_num)
            .first()
        )
        if not ver_record:
            raise HTTPException(status_code=404, detail=f"Version {target_ver_num} not found for dataset.")

        p_path = Path(ver_record.file_path)
        if not p_path.exists():
            raise HTTPException(status_code=404, detail=f"Version file missing on disk.")

        # Convert Parquet to temporary CSV for download
        df_ver = pd.read_parquet(p_path)
        temp_csv = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
        df_ver.to_csv(temp_csv.name, index=False)

        out_name = f"data_forge_{dataset_id}_v{target_ver_num}.csv"
        return FileResponse(
            path=temp_csv.name,
            filename=out_name,
            media_type="text/csv"
        )
