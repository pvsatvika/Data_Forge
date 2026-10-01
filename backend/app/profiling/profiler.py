import io
import re
import math
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Union
import pandas as pd
import numpy as np

from app.models.schemas import DatasetProfile, ColumnProfile, SemanticHints

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
PHONE_REGEX = re.compile(r'^\+?[\d\s\-\(\)\.]{7,20}$')
DATE_NAME_REGEX = re.compile(r'(date|time|created|updated|dob|signup|timestamp)', re.IGNORECASE)
ID_NAME_REGEX = re.compile(r'(id|uuid|key|pk|code|guid)', re.IGNORECASE)
BOOLEAN_VALUES = {'true', 'false', 'yes', 'no', '0', '1', 't', 'f', 'y', 'n'}

def load_dataset_dataframe(file_input: Union[str, Path, bytes, io.BytesIO], file_type: str) -> pd.DataFrame:
    """
    Safely load a dataset into a Pandas DataFrame from a file path, bytes, or BytesIO buffer.
    Supports CSV, XLSX, and Parquet formats.
    """
    ext = file_type.lower()
    if not ext.startswith("."):
        ext = f".{ext}"

    if isinstance(file_input, bytes):
        buffer: Union[io.BytesIO, str, Path] = io.BytesIO(file_input)
    elif isinstance(file_input, io.BytesIO):
        buffer = file_input
    elif isinstance(file_input, (str, Path)):
        path = Path(file_input)
        if not path.exists():
            raise FileNotFoundError(f"Dataset file not found at path: {file_input}")
        buffer = str(path)
    else:
        buffer = io.BytesIO(file_input)

    if ext == ".csv":
        try:
            df = pd.read_csv(buffer, on_bad_lines='skip', low_memory=False)
        except Exception:
            if hasattr(buffer, "seek"):
                buffer.seek(0)
            df = pd.read_csv(buffer, encoding='latin1', on_bad_lines='skip', low_memory=False)
    elif ext == ".xlsx":
        df = pd.read_excel(buffer, engine='openpyxl')
    elif ext == ".parquet":
        df = pd.read_parquet(buffer)
    else:
        raise ValueError(f"Unsupported file format: {file_type}")

    return df


def clean_json_value(val: Any) -> Any:
    """Ensure value is JSON serializable and safe from NaN/Infinity."""
    if val is None or pd.isna(val):
        return None
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.floating, float)):
        if math.isnan(val) or math.isinf(val):
            return None
        return round(float(val), 4)
    if isinstance(val, (pd.Timestamp, np.datetime64)):
        return str(val)
    return str(val)

def infer_column_type(series: pd.Series, col_name: str) -> Tuple[str, SemanticHints]:
    """
    Deterministically infer semantic data type and heuristic semantic hints.
    Returns (inferred_type_string, SemanticHints object).
    """
    non_nulls = series.dropna()
    total_count = len(series)
    non_null_count = len(non_nulls)
    unique_count = series.nunique(dropna=True)
    unique_percentage = (unique_count / total_count * 100.0) if total_count > 0 else 0.0

    hints = SemanticHints()

    if non_null_count == 0:
        hints.likely_categorical = True
        return "string", hints

    # Convert non-null items to string representation for pattern matching
    str_values = non_nulls.astype(str).str.strip()

    # Check Email pattern
    email_matches = str_values.apply(lambda x: bool(EMAIL_REGEX.match(x))).sum()
    if non_null_count > 0 and (email_matches / non_null_count) >= 0.5:
        hints.likely_email = True

    # Check Phone pattern
    phone_matches = str_values.apply(lambda x: bool(PHONE_REGEX.match(x))).sum()
    if non_null_count > 0 and (phone_matches / non_null_count) >= 0.5 and not ID_NAME_REGEX.search(col_name):
        hints.likely_phone = True

    # Check Boolean
    unique_str_set = set(str_values.str.lower().unique())
    is_bool_set = unique_str_set.issubset(BOOLEAN_VALUES) and len(unique_str_set) <= 2
    if is_bool_set or pd.api.types.is_bool_dtype(series):
        hints.likely_boolean = True

    # Check Date / Datetime
    is_date_col = False
    if pd.api.types.is_datetime64_any_dtype(series):
        is_date_col = True
    elif DATE_NAME_REGEX.search(col_name):
        is_date_col = True
    else:
        # Attempt sample date parsing safely
        sample_str = str_values.head(10)
        parsed_dates = 0
        for s in sample_str:
            if len(s) >= 6:
                try:
                    pd.to_datetime(s, format='mixed', errors='raise')
                    parsed_dates += 1
                except Exception:
                    pass
        if len(sample_str) > 0 and (parsed_dates / len(sample_str)) >= 0.7:
            is_date_col = True

    if is_date_col:
        hints.likely_date = True

    # Check Numeric (Integer vs Float)
    is_numeric = False
    is_integer = False
    is_float = False

    if pd.api.types.is_numeric_dtype(series) and not is_bool_set:
        is_numeric = True
        # Check if all numbers are whole integers
        numeric_series = pd.to_numeric(series, errors='coerce').dropna()
        if len(numeric_series) > 0:
            if (numeric_series % 1 == 0).all():
                is_integer = True
            else:
                is_float = True
    else:
        # Check numeric conversion safely
        converted = pd.to_numeric(str_values, errors='coerce')
        valid_num_count = converted.notna().sum()
        if non_null_count > 0 and (valid_num_count / non_null_count) >= 0.8:
            is_numeric = True
            valid_nums = converted.dropna()
            if (valid_nums % 1 == 0).all():
                is_integer = True
            else:
                is_float = True

    if is_numeric:
        hints.likely_numeric = True

    # Check Categorical
    if unique_count <= 20 and unique_count < total_count:
        hints.likely_categorical = True
    elif unique_percentage < 20.0 and unique_count < 100:
        hints.likely_categorical = True

    # Check Identifier
    if ID_NAME_REGEX.search(col_name) or (unique_percentage >= 95.0 and total_count >= 5 and not hints.likely_email):
        hints.likely_identifier = True

    # Determine final type string
    if hints.likely_boolean:
        inferred_type = "boolean"
    elif is_date_col:
        inferred_type = "date" if "time" not in col_name.lower() else "datetime"
    elif is_integer:
        inferred_type = "integer"
    elif is_float:
        inferred_type = "float"
    elif hints.likely_categorical:
        inferred_type = "categorical"
    else:
        inferred_type = "string"

    return inferred_type, hints

def profile_dataset_dataframe(df: pd.DataFrame, dataset_id: str) -> DatasetProfile:
    """
    Profile a Pandas DataFrame and produce a strongly typed DatasetProfile object.
    Immutable: does not mutate original dataset.
    """
    row_count = len(df)
    column_count = len(df.columns)

    # Compute duplicate rows count
    duplicate_row_count = int(df.duplicated().sum()) if row_count > 0 else 0
    duplicate_row_percentage = round((duplicate_row_count / row_count * 100.0), 2) if row_count > 0 else 0.0

    column_profiles: List[ColumnProfile] = []

    for col in df.columns:
        col_name = str(col)
        series = df[col]

        null_count = int(series.isna().sum())
        null_percentage = round((null_count / row_count * 100.0), 2) if row_count > 0 else 0.0

        unique_count = int(series.nunique(dropna=True))
        unique_percentage = round((unique_count / row_count * 100.0), 2) if row_count > 0 else 0.0

        non_null_series = series.dropna()
        non_null_count = len(non_null_series)
        duplicate_count = max(0, non_null_count - unique_count)

        # Sample values (up to 5 distinct non-null representative values)
        raw_samples = non_null_series.drop_duplicates().head(5).tolist()
        sample_values = [clean_json_value(v) for v in raw_samples if clean_json_value(v) is not None]

        # Infer type and semantic hints
        inferred_type, semantic_hints = infer_column_type(series, col_name)

        # Numeric statistics
        min_val = None
        max_val = None
        mean_val = None
        median_val = None

        if semantic_hints.likely_numeric or inferred_type in ("integer", "float"):
            num_series = pd.to_numeric(series, errors='coerce').dropna()
            if len(num_series) > 0:
                min_val = clean_json_value(num_series.min())
                max_val = clean_json_value(num_series.max())
                mean_val = round(float(num_series.mean()), 4)
                median_val = round(float(num_series.median()), 4)
        elif semantic_hints.likely_date or inferred_type in ("date", "datetime"):
            try:
                date_series = pd.to_datetime(series, errors='coerce').dropna()
                if len(date_series) > 0:
                    min_val = str(date_series.min())
                    max_val = str(date_series.max())
            except Exception:
                pass

        col_profile = ColumnProfile(
            column_name=col_name,
            inferred_type=inferred_type,
            null_count=null_count,
            null_percentage=null_percentage,
            unique_count=unique_count,
            unique_percentage=unique_percentage,
            duplicate_count=duplicate_count,
            sample_values=sample_values,
            min_val=min_val,
            max_val=max_val,
            mean_val=mean_val,
            median_val=median_val,
            semantic_hints=semantic_hints
        )
        column_profiles.append(col_profile)

    return DatasetProfile(
        dataset_id=dataset_id,
        row_count=row_count,
        column_count=column_count,
        duplicate_row_count=duplicate_row_count,
        duplicate_row_percentage=duplicate_row_percentage,
        columns=column_profiles
    )
