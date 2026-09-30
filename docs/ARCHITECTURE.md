# Data Forge System Architecture

## Overview
Data Forge is an AI-powered agentic enterprise data profiling, cleaning, validation, information-loss estimation, and rollback platform.

## Key Architecture Principle: LLM DECIDES — CODE EXECUTES
The AI engine (powered by Groq API / `llama-3.3-70b-versatile`) NEVER directly modifies datasets, executes dynamic Python scripts, or runs uncontrolled code. The AI functions purely as a **declarative constraint engine**. It receives compact dataset profile metrics, infers semantic types & business constraints, and outputs a strictly structured JSON cleaning declaration.

All actual transformations are strictly executed by deterministic, allow-listed Python functions.

```
+-----------------------------------------------------------------------------------+
|                                 DATA FORGE COMPLETE MVP                           |
+-----------------------------------------------------------------------------------+
|  [ Frontend (React + Vite + Tailwind + Axios) ]                                   |
|        │                                                                          |
|        ▼ REST API                                                                 |
|  [ FastAPI Backend (Python 3.11+) ]                                                |
|     ├── Ingestion & Profiling (Pandas / DuckDB)                                   |
|     ├── Groq AI Semantic Intelligence                                             |
|     ├── Validated Cleaning Plan Builder & Risk Classifier                         |
|     ├── Deterministic Allow-Listed Transformation Registry                        |
|     ├── In-Memory Dry Run Simulator & Cell Diff Engine                            |
|     ├── Information Loss Index Calculator (Project-Defined Metric)                |
|     ├── Approval Gate Authorization Manager                                       |
|     ├── Automated Validation Suite (Blocks Commit on FAIL Status)                 |
|     ├── Immutable Parquet Versioning Engine & Change Log Logger                   |
|     ├── SHA-256 Integrity Rollback Engine                                         |
|     └── Metadata & Version Storage (SQLite Database)                              |
+-----------------------------------------------------------------------------------+
```

## Deterministic Transformation Registry
All data manipulations are performed strictly by standard, pre-compiled Python functions. Dynamic execution constructs (`eval()`, `exec()`) are explicitly forbidden.

Allow-listed operation functions:
- `trim_whitespace`
- `lowercase`
- `uppercase`
- `normalize_email`
- `normalize_phone`
- `fill_missing` (validated strategy: `constant`, `mean`, `median`, `mode`)
- `replace_values` (validated mapping dictionary)
- `convert_type` (validated target type: `string`, `integer`, `float`, `boolean`, `date`)
- `normalize_dates` (ISO `YYYY-MM-DD` format)
- `remove_duplicates`

## Information Loss Index (Project-Defined Metric)
The Information Loss Index is a project-defined engineering metric (ranging from 0.0 to 1.0) calculated transparently via a weighted component formula:

$$\text{Loss Index} = \min\left(1.0, 0.50 \times \frac{\text{Rows Removed}}{\text{Original Rows}} + 0.35 \times \frac{\text{Values Nullified}}{\text{Total Cells}} + 0.15 \times \frac{\text{Cells Changed}}{\text{Total Cells}}\right)$$

## Validation-Before-Commit Architecture
Transformed datasets undergo an automated suite of deterministic validation tests before commit:
1. `SCHEMA_PRESERVATION`
2. `TYPE_CONSISTENCY`
3. `ROW_COUNT`
4. `NULL_CHECK`
5. `UNIQUENESS`
6. `FORMAT_CHECK`
7. `TRANSFORMATION_CONSISTENCY`
8. `DATA_LOSS_CHECK`

If the validation suite reports a `FAIL` status, the commit is aborted, execution is marked as failed, and the active version remains unchanged.

## Immutable Versioning & SHA-256 Rollback Engine
- Original uploaded dataset files (`data/uploads/`) and historical Parquet version files (`data/storage/{dataset_id}/versions/v{n}.parquet`) are **NEVER overwritten or deleted**.
- Active dataset state is tracked via `DatasetModel.current_version`.
- Rollback updates the active version pointer after verifying file existence and SHA-256 hash integrity. Historical version files are preserved.
