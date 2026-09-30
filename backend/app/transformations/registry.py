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

def _is_numeric_value(val: Any) -> bool:
    if isinstance(val, (int, float)) and not isinstance(val, bool):
        return True
    if isinstance(val, str) and val.strip() != "":
        try:
            float(val.strip())
            return True
        except ValueError:
            return False
    return False

def validate_transformation_parameters(
    operation: str,
    parameters: Dict[str, Any],
    reason: str = "",
    column_type: str = ""
) -> Dict[str, Any]:
    """
    Strict server-side validation for operation parameters.
    Rejects malicious or unsupported parameters while supplying safe defaults and enforcing type compatibility.
    """
    op = operation.strip().lower()
    params = dict(parameters or {})
    reason_lower = (reason or "").lower()
    col_type_lower = (column_type or "").lower().strip()
    is_numeric_col = col_type_lower in ("float", "integer", "int", "numeric", "number", "double")

    if op == "fill_missing":
        raw_strategy = params.get("strategy")
        if raw_strategy is not None and str(raw_strategy).strip() != "":
            strategy = str(raw_strategy).strip().lower()
            if strategy not in ("constant", "mean", "median", "mode"):
                raise ValueError(f"Invalid strategy '{strategy}' for fill_missing. Allowed: constant, mean, median, mode.")
        else:
            if "mean" in reason_lower:
                strategy = "mean"
            elif "median" in reason_lower:
                strategy = "median"
            elif "mode" in reason_lower:
                strategy = "mode"
            else:
                strategy = "median" if is_numeric_col else "constant"

        if strategy == "constant":
            val = params.get("value")
            if is_numeric_col:
                if val is None or not _is_numeric_value(val):
                    raise ValueError(f"Numeric column of type '{column_type}' cannot receive non-numeric constant value '{val}'.")
                try:
                    params["value"] = float(val) if col_type_lower in ("float", "double", "numeric") else int(float(val))
                except (ValueError, TypeError):
                    raise ValueError(f"Constant value '{val}' is incompatible with numeric column type '{column_type}'.")
            else:
                if "value" not in params:
                    params["value"] = ""

        return {"strategy": strategy, "value": params.get("value")}

    elif op == "replace_values":
        mapping = params.get("mapping")
        if not isinstance(mapping, dict) or not mapping:
            raise ValueError("Parameter 'mapping' must be a non-empty dictionary for replace_values.")
        return {"mapping": mapping}

    elif op == "convert_type":
        raw_type = params.get("target_type")
        if raw_type is not None and str(raw_type).strip() != "":
            target_type = str(raw_type).strip().lower()
            if target_type not in ("string", "integer", "float", "boolean", "date"):
                raise ValueError(f"Invalid target_type '{target_type}' for convert_type. Allowed: string, integer, float, boolean, date.")
        else:
            if "int" in reason_lower or "integer" in reason_lower:
                target_type = "integer"
            elif "float" in reason_lower or "decimal" in reason_lower or "numeric" in reason_lower:
                target_type = "float"
            elif "bool" in reason_lower:
                target_type = "boolean"
            elif "date" in reason_lower:
                target_type = "date"
            else:
                target_type = "string"
        return {"target_type": target_type}

    return params
