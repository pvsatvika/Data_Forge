from typing import Dict, Callable, Tuple, Any
import pandas as pd

from app.transformations.operations import (
    op_trim_whitespace,
    op_lowercase,
    op_uppercase,
    op_normalize_email,
    op_normalize_phone,
    op_fill_missing,
    op_replace_values,
    op_convert_type,
    op_normalize_dates,
    op_remove_duplicates
)

TransformationFunc = Callable[[pd.DataFrame, str, Dict[str, Any]], Tuple[pd.DataFrame, Dict[str, int]]]

TRANSFORMATION_REGISTRY: Dict[str, TransformationFunc] = {
    "trim_whitespace": op_trim_whitespace,
    "lowercase": op_lowercase,
    "uppercase": op_uppercase,
    "normalize_email": op_normalize_email,
    "normalize_phone": op_normalize_phone,
    "fill_missing": op_fill_missing,
    "replace_values": op_replace_values,
    "convert_type": op_convert_type,
    "normalize_dates": op_normalize_dates,
    "remove_duplicates": op_remove_duplicates,
}

ALLOW_LISTED_OPERATIONS = list(TRANSFORMATION_REGISTRY.keys())

def get_transformation_function(operation: str) -> TransformationFunc:
    """
    Lookup transformation function from strict allow-list registry.
    Raises ValueError if operation is not allowed.
    """
    op = operation.strip().lower()
    if op not in TRANSFORMATION_REGISTRY:
        raise ValueError(f"Operation '{operation}' is not in the deterministic allow-list registry.")
    return TRANSFORMATION_REGISTRY[op]

def validate_transformation_parameters(operation: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strict server-side validation for operation parameters.
    Rejects malicious or unsupported parameters.
    """
    op = operation.strip().lower()
    params = parameters or {}

    if op == "fill_missing":
        strategy = str(params.get("strategy", "constant")).lower()
        if strategy not in ("constant", "mean", "median", "mode"):
            raise ValueError(f"Invalid strategy '{strategy}' for fill_missing. Allowed: constant, mean, median, mode.")
        if strategy == "constant" and "value" not in params:
            raise ValueError("Parameter 'value' is required when fill_missing strategy is 'constant'.")
        return {"strategy": strategy, "value": params.get("value")}

    elif op == "replace_values":
        mapping = params.get("mapping")
        if not isinstance(mapping, dict) or not mapping:
            raise ValueError("Parameter 'mapping' must be a non-empty dictionary for replace_values.")
        return {"mapping": mapping}

    elif op == "convert_type":
        target_type = str(params.get("target_type", "")).lower()
        if target_type not in ("string", "integer", "float", "boolean", "date"):
            raise ValueError(f"Invalid target_type '{target_type}' for convert_type. Allowed: string, integer, float, boolean, date.")
        return {"target_type": target_type}

    return params
