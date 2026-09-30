import pandas as pd
from app.models.schemas import (
    DatasetProfile,
    ColumnProfile,
    SemanticHints,
    CleaningPlanResponse,
    TransformationPlanItem,
    RiskSummary,
    PlanPreviewResponse,
    InformationLossSummary
)
from app.validation.engine import run_validation_suite

def test_validation_schema_preservation_pass():
    df_orig = pd.DataFrame({"id": [1, 2], "email": ["a@b.com", "c@d.com"]})
    df_clean = df_orig.copy()

    profile = DatasetProfile(
        dataset_id="ds_val", row_count=2, column_count=2, duplicate_row_count=0, duplicate_row_percentage=0.0,
        columns=[
            ColumnProfile(column_name="id", inferred_type="integer", null_count=0, null_percentage=0.0, unique_count=2, unique_percentage=100.0, duplicate_count=0, sample_values=[1, 2], semantic_hints=SemanticHints(likely_identifier=True)),
            ColumnProfile(column_name="email", inferred_type="string", null_count=0, null_percentage=0.0, unique_count=2, unique_percentage=100.0, duplicate_count=0, sample_values=["a@b.com"], semantic_hints=SemanticHints(likely_email=True))
        ]
    )

    plan = CleaningPlanResponse(
        plan_id="p1", dataset_id="ds_val", status="approved",
        transformations=[TransformationPlanItem(column="email", operation="trim_whitespace", reason="r", confidence=0.9, risk="low")],
        risk_summary=RiskSummary(low_count=1)
    )

    preview = PlanPreviewResponse(
        plan_id="p1", dataset_id="ds_val", status="simulated",
        risk_summary=RiskSummary(low_count=1),
        loss_summary=InformationLossSummary(original_row_count=2, simulated_row_count=2, rows_affected=0, rows_removed=0, cells_changed=0, values_nullified=0, columns_affected=[], estimated_loss_score=0.0),
        transformation_stats=[], cell_diffs=[]
    )

    status, checks = run_validation_suite(df_orig, df_clean, profile, plan, preview)
    assert status == "PASS"
    assert any(c["check_name"] == "SCHEMA_PRESERVATION" and c["status"] == "PASS" for c in checks)

def test_validation_schema_loss_fails_commit():
    df_orig = pd.DataFrame({"id": [1, 2], "email": ["a@b.com", "c@d.com"]})
    df_clean = pd.DataFrame({"id": [1, 2]})  # Column email missing!

    profile = DatasetProfile(
        dataset_id="ds_val", row_count=2, column_count=2, duplicate_row_count=0, duplicate_row_percentage=0.0,
        columns=[ColumnProfile(column_name="id", inferred_type="integer", null_count=0, null_percentage=0.0, unique_count=2, unique_percentage=100.0, duplicate_count=0, sample_values=[1], semantic_hints=SemanticHints())]
    )

    plan = CleaningPlanResponse(
        plan_id="p1", dataset_id="ds_val", status="approved",
        transformations=[], risk_summary=RiskSummary()
    )

    preview = PlanPreviewResponse(
        plan_id="p1", dataset_id="ds_val", status="simulated",
        risk_summary=RiskSummary(),
        loss_summary=InformationLossSummary(original_row_count=2, simulated_row_count=2, rows_affected=0, rows_removed=0, cells_changed=0, values_nullified=0, columns_affected=[], estimated_loss_score=0.0),
        transformation_stats=[], cell_diffs=[]
    )

    status, checks = run_validation_suite(df_orig, df_clean, profile, plan, preview)
    assert status == "FAIL"
    assert any(c["check_name"] == "SCHEMA_PRESERVATION" and c["status"] == "FAIL" for c in checks)
