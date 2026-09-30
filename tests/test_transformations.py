import pytest
import pandas as pd
from app.transformations import (
    ALLOW_LISTED_OPERATIONS,
    get_transformation_function,
    validate_transformation_parameters
)
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

def test_trim_whitespace():
    df = pd.DataFrame({"col": ["  hello ", "world  ", "test"]})
    df_out, stats = op_trim_whitespace(df, "col", {})
    assert df_out["col"].tolist() == ["hello", "world", "test"]
    assert stats["changed_cells"] == 2
    assert df["col"].tolist() == ["  hello ", "world  ", "test"]  # Original untouched

def test_lowercase():
    df = pd.DataFrame({"col": ["HELLO", "World"]})
    df_out, stats = op_lowercase(df, "col", {})
    assert df_out["col"].tolist() == ["hello", "world"]
    assert stats["changed_cells"] == 2

def test_uppercase():
    df = pd.DataFrame({"col": ["hello", "World"]})
    df_out, stats = op_uppercase(df, "col", {})
    assert df_out["col"].tolist() == ["HELLO", "WORLD"]
    assert stats["changed_cells"] == 2

def test_normalize_email():
    df = pd.DataFrame({"email": ["  Alice@Example.COM ", "bob@domain.org"]})
    df_out, stats = op_normalize_email(df, "email", {})
    assert df_out["email"].tolist() == ["alice@example.com", "bob@domain.org"]
    assert stats["changed_cells"] == 1

def test_normalize_phone():
    df = pd.DataFrame({"phone": ["5550192834", "555-019-2835"]})
    df_out, stats = op_normalize_phone(df, "phone", {})
    assert df_out["phone"].iloc[0] == "(555) 019-2834"
    assert stats["changed_cells"] == 2

def test_fill_missing():
    df = pd.DataFrame({"val": [10.0, None, 30.0]})
    # Test strategy='constant'
    df_out, stats = op_fill_missing(df, "val", {"strategy": "constant", "value": 0.0})
    assert df_out["val"].tolist() == [10.0, 0.0, 30.0]
    assert stats["affected_rows"] == 1

    # Test strategy='mean'
    df_out_mean, _ = op_fill_missing(df, "val", {"strategy": "mean"})
    assert df_out_mean["val"].iloc[1] == 20.0

def test_replace_values():
    df = pd.DataFrame({"status": ["active", "pending", "active"]})
    df_out, stats = op_replace_values(df, "status", {"mapping": {"pending": "inactive"}})
    assert df_out["status"].tolist() == ["active", "inactive", "active"]
    assert stats["changed_cells"] == 1

def test_convert_type():
    df = pd.DataFrame({"age": ["25", "30", "invalid"]})
    df_out, stats = op_convert_type(df, "age", {"target_type": "integer"})
    assert stats["nulls_created"] == 1

def test_normalize_dates():
    df = pd.DataFrame({"date": ["01/15/2023", "2023-01-16", "17-Jan-2023"]})
    df_out, stats = op_normalize_dates(df, "date", {})
    assert df_out["date"].iloc[0] == "2023-01-15"
    assert df_out["date"].iloc[2] == "2023-01-17"

def test_remove_duplicates():
    df = pd.DataFrame({"id": [1, 2, 2, 3], "val": ["a", "b", "b", "c"]})
    df_out, stats = op_remove_duplicates(df, "id", {})
    assert len(df_out) == 3
    assert stats["rows_removed"] == 1

def test_unsupported_operation_rejected():
    with pytest.raises(ValueError):
        get_transformation_function("eval_python_script")

def test_unsupported_parameter_rejected():
    with pytest.raises(ValueError):
        validate_transformation_parameters("fill_missing", {"strategy": "invalid_strategy"})
