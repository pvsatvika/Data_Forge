import re
from datetime import datetime
from typing import List, Dict, Any, Tuple
import pandas as pd

from app.models.schemas import (
    DatasetProfile,
    CleaningPlanResponse,
    PlanPreviewResponse,
    ValidationReportResponse
)

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

class ValidationCheckItem(Dict[str, Any]):
    check_name: str
    status: str # PASS, WARN, FAIL
    severity: str # info, warning, critical
    expected: str
    actual: str
    message: str

def run_validation_suite(
    df_original: pd.DataFrame,
    df_cleaned: pd.DataFrame,
    profile: DatasetProfile,
    plan: CleaningPlanResponse,
    preview: PlanPreviewResponse
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Run deterministic validation checks on transformed dataset before committing.
    Returns (overall_status, list of check item dicts).
    Status rules:
    - PASS: All checks passed.
    - WARN: Non-critical warnings detected.
    - FAIL: Critical validation failure (MUST block version commit).
    """
    checks: List[Dict[str, Any]] = []
    has_fail = False
    has_warn = False

    # 1. SCHEMA PRESERVATION
    orig_cols = set(df_original.columns)
    clean_cols = set(df_cleaned.columns)
    missing_cols = orig_cols - clean_cols

    if missing_cols:
        has_fail = True
        checks.append({
            "check_name": "SCHEMA_PRESERVATION",
            "status": "FAIL",
            "severity": "critical",
            "expected": f"All original columns preserved ({len(orig_cols)})",
            "actual": f"Missing columns: {list(missing_cols)}",
            "message": "Critical error: Transformed dataset lost original columns!"
        })
    else:
        checks.append({
            "check_name": "SCHEMA_PRESERVATION",
            "status": "PASS",
            "severity": "info",
            "expected": f"All original columns preserved ({len(orig_cols)})",
            "actual": f"Columns intact ({len(clean_cols)})",
            "message": "Schema preservation check passed successfully."
        })

    # 2. DATA LOSS & ROW COUNT CHECK
    actual_rows_removed = len(df_original) - len(df_cleaned)
    expected_rows_removed = preview.loss_summary.rows_removed

    if actual_rows_removed > expected_rows_removed * 2 and actual_rows_removed > 5:
        has_fail = True
        checks.append({
            "check_name": "DATA_LOSS_CHECK",
            "status": "FAIL",
            "severity": "critical",
            "expected": f"Rows removed ~ {expected_rows_removed}",
            "actual": f"Actual rows removed = {actual_rows_removed}",
            "message": "Critical: Actual row loss significantly exceeded dry run estimate!"
        })
    else:
        checks.append({
            "check_name": "DATA_LOSS_CHECK",
            "status": "PASS",
            "severity": "info",
            "expected": f"Expected row loss: {expected_rows_removed}",
            "actual": f"Actual row loss: {actual_rows_removed}",
            "message": "Data loss check passed within expected parameters."
        })

    # 3. UNIQUENESS CHECK
    for col_profile in profile.columns:
        if col_profile.semantic_hints.likely_identifier and col_profile.column_name in df_cleaned.columns:
            cleaned_col = df_cleaned[col_profile.column_name].dropna()
            if len(cleaned_col) > 0:
                is_unique = cleaned_col.is_unique
                if not is_unique:
                    has_warn = True
                    checks.append({
                        "check_name": "UNIQUENESS",
                        "status": "WARN",
                        "severity": "warning",
                        "expected": f"Column '{col_profile.column_name}' identifier values should be unique",
                        "actual": f"Duplicates remain in '{col_profile.column_name}'",
                        "message": f"Identifier column '{col_profile.column_name}' contains remaining duplicate values."
                    })
                else:
                    checks.append({
                        "check_name": "UNIQUENESS",
                        "status": "PASS",
                        "severity": "info",
                        "expected": f"Column '{col_profile.column_name}' unique",
                        "actual": "100% unique values",
                        "message": f"Uniqueness check passed for identifier column '{col_profile.column_name}'."
                    })

    # 4. FORMAT CHECK (Emails)
    for col_profile in profile.columns:
        if col_profile.semantic_hints.likely_email and col_profile.column_name in df_cleaned.columns:
            emails = df_cleaned[col_profile.column_name].dropna().astype(str)
            if len(emails) > 0:
                valid_count = emails.apply(lambda x: bool(EMAIL_REGEX.match(x))).sum()
                match_ratio = valid_count / len(emails)
                if match_ratio < 0.5:
                    has_warn = True
                    checks.append({
                        "check_name": "FORMAT_CHECK",
                        "status": "WARN",
                        "severity": "warning",
                        "expected": f"Email column '{col_profile.column_name}' format match > 50%",
                        "actual": f"Match ratio = {match_ratio * 100:.1f}%",
                        "message": f"Email formatting check flagged low match ratio on column '{col_profile.column_name}'."
                    })
                else:
                    checks.append({
                        "check_name": "FORMAT_CHECK",
                        "status": "PASS",
                        "severity": "info",
                        "expected": "Email format match > 50%",
                        "actual": f"Match ratio = {match_ratio * 100:.1f}%",
                        "message": f"Email format check passed for '{col_profile.column_name}'."
                    })

    # 5. TRANSFORMATION CONSISTENCY
    for item in plan.transformations:
        if item.column in df_cleaned.columns:
            s_clean = df_cleaned[item.column].dropna().astype(str)
            if item.operation == "trim_whitespace" and len(s_clean) > 0:
                trimmed = s_clean.str.strip()
                if not (s_clean == trimmed).all():
                    has_fail = True
                    checks.append({
                        "check_name": "TRANSFORMATION_CONSISTENCY",
                        "status": "FAIL",
                        "severity": "critical",
                        "expected": f"Column '{item.column}' fully trimmed",
                        "actual": "Untrimmed whitespace remains",
                        "message": f"Transformation consistency check failed for {item.operation} on {item.column}."
                    })

    overall_status = "FAIL" if has_fail else ("WARN" if has_warn else "PASS")
    return overall_status, checks
