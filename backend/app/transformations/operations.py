import re
from typing import Tuple, Dict, Any
import pandas as pd
import numpy as np

def op_trim_whitespace(df: pd.DataFrame, column: str, parameters: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Trim leading/trailing whitespace from a string column."""
    df_out = df.copy()
    if column not in df_out.columns:
        return df_out, {"affected_rows": 0, "changed_cells": 0, "nulls_created": 0, "rows_removed": 0}

    s = df_out[column]
    non_nulls = s.dropna()
    str_vals = non_nulls.astype(str)
    trimmed = str_vals.str.strip()

    changed_mask = str_vals != trimmed
    changed_cells = int(changed_mask.sum())
    affected_rows = changed_cells

    df_out.loc[non_nulls.index, column] = trimmed
    return df_out, {"affected_rows": affected_rows, "changed_cells": changed_cells, "nulls_created": 0, "rows_removed": 0}

def op_lowercase(df: pd.DataFrame, column: str, parameters: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Convert string column values to lowercase."""
    df_out = df.copy()
    if column not in df_out.columns:
        return df_out, {"affected_rows": 0, "changed_cells": 0, "nulls_created": 0, "rows_removed": 0}

    s = df_out[column]
    non_nulls = s.dropna()
    str_vals = non_nulls.astype(str)
    lowercased = str_vals.str.lower()

    changed_mask = str_vals != lowercased
    changed_cells = int(changed_mask.sum())
    affected_rows = changed_cells

    df_out.loc[non_nulls.index, column] = lowercased
    return df_out, {"affected_rows": affected_rows, "changed_cells": changed_cells, "nulls_created": 0, "rows_removed": 0}

def op_uppercase(df: pd.DataFrame, column: str, parameters: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Convert string column values to uppercase."""
    df_out = df.copy()
    if column not in df_out.columns:
        return df_out, {"affected_rows": 0, "changed_cells": 0, "nulls_created": 0, "rows_removed": 0}

    s = df_out[column]
    non_nulls = s.dropna()
    str_vals = non_nulls.astype(str)
    uppercased = str_vals.str.upper()

    changed_mask = str_vals != uppercased
    changed_cells = int(changed_mask.sum())
    affected_rows = changed_cells

    df_out.loc[non_nulls.index, column] = uppercased
    return df_out, {"affected_rows": affected_rows, "changed_cells": changed_cells, "nulls_created": 0, "rows_removed": 0}

def op_normalize_email(df: pd.DataFrame, column: str, parameters: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Normalize email addresses by stripping whitespace and lowercasing."""
    df_out = df.copy()
    if column not in df_out.columns:
        return df_out, {"affected_rows": 0, "changed_cells": 0, "nulls_created": 0, "rows_removed": 0}

    s = df_out[column]
    non_nulls = s.dropna()
    str_vals = non_nulls.astype(str)
    normalized = str_vals.str.strip().str.lower()

    changed_mask = str_vals != normalized
    changed_cells = int(changed_mask.sum())
    affected_rows = changed_cells

    df_out.loc[non_nulls.index, column] = normalized
    return df_out, {"affected_rows": affected_rows, "changed_cells": changed_cells, "nulls_created": 0, "rows_removed": 0}

def op_normalize_phone(df: pd.DataFrame, column: str, parameters: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Clean phone numbers by removing unusual spaces/dashes and standardizing format."""
    df_out = df.copy()
    if column not in df_out.columns:
        return df_out, {"affected_rows": 0, "changed_cells": 0, "nulls_created": 0, "rows_removed": 0}

    s = df_out[column]
    non_nulls = s.dropna()
    str_vals = non_nulls.astype(str)

    def clean_phone(p: str) -> str:
        # Extract digits
        digits = re.sub(r'\D', '', p)
        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        elif len(digits) == 11 and digits.startswith('1'):
            return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
        elif len(digits) > 0:
            return digits
        return p.strip()

    cleaned = str_vals.apply(clean_phone)
    changed_mask = str_vals != cleaned
    changed_cells = int(changed_mask.sum())
    affected_rows = changed_cells

    df_out.loc[non_nulls.index, column] = cleaned
    return df_out, {"affected_rows": affected_rows, "changed_cells": changed_cells, "nulls_created": 0, "rows_removed": 0}

def op_fill_missing(df: pd.DataFrame, column: str, parameters: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """
    Fill missing (null) values in column.
    Supported strategies: 'constant', 'mean', 'median', 'mode'.
    """
    df_out = df.copy()
    if column not in df_out.columns:
        return df_out, {"affected_rows": 0, "changed_cells": 0, "nulls_created": 0, "rows_removed": 0}

    strategy = parameters.get("strategy", "constant")
    value = parameters.get("value")

    null_mask = df_out[column].isna() | (df_out[column] == "") | (df_out[column].astype(str).str.strip() == "")
    null_count = int(null_mask.sum())
    if null_count == 0:
        return df_out, {"affected_rows": 0, "changed_cells": 0, "nulls_created": 0, "rows_removed": 0}

    fill_val = None
    if strategy == "constant":
        if value is None:
            raise ValueError("Parameter 'value' is required for strategy 'constant'.")
        fill_val = value
    elif strategy == "mean":
        num_s = pd.to_numeric(df_out[column], errors='coerce').dropna()
        if len(num_s) == 0:
            raise ValueError(f"Cannot compute mean for non-numeric column '{column}'.")
        fill_val = round(float(num_s.mean()), 4)
    elif strategy == "median":
        num_s = pd.to_numeric(df_out[column], errors='coerce').dropna()
        if len(num_s) == 0:
            raise ValueError(f"Cannot compute median for non-numeric column '{column}'.")
        fill_val = round(float(num_s.median()), 4)
    elif strategy == "mode":
        mode_s = df_out[column].dropna().mode()
        if len(mode_s) == 0:
            raise ValueError(f"Cannot compute mode for column '{column}'.")
        fill_val = mode_s.iloc[0]
    else:
        raise ValueError(f"Unsupported fill_missing strategy '{strategy}'. Allowed: constant, mean, median, mode.")

    df_out.loc[null_mask, column] = fill_val
    return df_out, {"affected_rows": null_count, "changed_cells": null_count, "nulls_created": 0, "rows_removed": 0}

def op_replace_values(df: pd.DataFrame, column: str, parameters: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Replace values in column according to a validated mapping dict."""
    df_out = df.copy()
    if column not in df_out.columns:
        return df_out, {"affected_rows": 0, "changed_cells": 0, "nulls_created": 0, "rows_removed": 0}

    mapping = parameters.get("mapping")
    if not isinstance(mapping, dict) or not mapping:
        raise ValueError("Parameter 'mapping' must be a non-empty dictionary.")

    s = df_out[column]
    changed_cells = 0
    affected_rows = 0

    for old_val, new_val in mapping.items():
        mask = (s == old_val) | (s.astype(str) == str(old_val))
        match_count = int(mask.sum())
        if match_count > 0:
            df_out.loc[mask, column] = new_val
            changed_cells += match_count
            affected_rows += match_count

    return df_out, {"affected_rows": affected_rows, "changed_cells": changed_cells, "nulls_created": 0, "rows_removed": 0}

def op_convert_type(df: pd.DataFrame, column: str, parameters: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Convert column to target type (string, integer, float, boolean, date)."""
    df_out = df.copy()
    if column not in df_out.columns:
        return df_out, {"affected_rows": 0, "changed_cells": 0, "nulls_created": 0, "rows_removed": 0}

    target_type = parameters.get("target_type", "").lower()
    allowed_types = {"string", "integer", "float", "boolean", "date"}
    if target_type not in allowed_types:
        raise ValueError(f"Unsupported target_type '{target_type}'. Allowed: {allowed_types}")

    s_orig = df_out[column]
    initial_nulls = int(s_orig.isna().sum())

    if target_type == "string":
        df_out[column] = s_orig.astype(str)
    elif target_type in ("integer", "float"):
        converted = pd.to_numeric(s_orig, errors='coerce')
        if target_type == "integer":
            converted = converted.astype("Int64") # Nullable integer dtype
        df_out[column] = converted
    elif target_type == "boolean":
        df_out[column] = s_orig.astype(bool)
    elif target_type == "date":
        df_out[column] = pd.to_datetime(s_orig, errors='coerce').dt.strftime('%Y-%m-%d')

    new_nulls = int(df_out[column].isna().sum())
    nulls_created = max(0, new_nulls - initial_nulls)
    changed_cells = int((s_orig.astype(str) != df_out[column].astype(str)).sum())

    return df_out, {"affected_rows": changed_cells, "changed_cells": changed_cells, "nulls_created": nulls_created, "rows_removed": 0}

def op_normalize_dates(df: pd.DataFrame, column: str, parameters: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Standardize date representations in column to YYYY-MM-DD ISO format."""
    df_out = df.copy()
    if column not in df_out.columns:
        return df_out, {"affected_rows": 0, "changed_cells": 0, "nulls_created": 0, "rows_removed": 0}

    s = df_out[column]
    non_nulls = s.dropna()
    str_vals = non_nulls.astype(str)

    parsed_dates = pd.to_datetime(str_vals, format='mixed', errors='coerce').dt.strftime('%Y-%m-%d')
    changed_mask = (str_vals != parsed_dates) & parsed_dates.notna()
    changed_cells = int(changed_mask.sum())
    nulls_created = int((parsed_dates.isna() & str_vals.notna()).sum())

    df_out.loc[non_nulls.index, column] = parsed_dates
    return df_out, {"affected_rows": changed_cells, "changed_cells": changed_cells, "nulls_created": nulls_created, "rows_removed": 0}

def op_remove_duplicates(df: pd.DataFrame, column: str, parameters: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Remove duplicate rows from dataset based on target column or all columns."""
    df_out = df.copy()
    initial_rows = len(df_out)

    subset = [column] if column and column in df_out.columns else None
    df_clean = df_out.drop_duplicates(subset=subset, keep='first')
    rows_removed = initial_rows - len(df_clean)

    return df_clean, {"affected_rows": rows_removed, "changed_cells": 0, "nulls_created": 0, "rows_removed": rows_removed}
