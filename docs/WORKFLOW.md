# Data Forge Complete Agentic Workflow

The complete end-to-end platform workflow follows a 10-stage lifecycle:

```
 OBSERVE ──> REASON ──> PLAN ──> SIMULATE ──> APPROVE ──> EXECUTE ──> TEST ──> COMMIT ──> VERSION ──> ROLLBACK
```

## Complete Stage Descriptions

1. **OBSERVE (PROFILE)**
   - Profile uploaded CSV/XLSX datasets, extracting statistical distributions, null ratios, unique percentages, duplicate row ratios, and pattern heuristics.

2. **REASON (AI ANALYSIS)**
   - Pass compact profile summary to Groq AI (`llama-3.3-70b-versatile`). Infer semantic meanings, hidden constraints, and allow-listed cleaning recommendations under strict Prompt Injection Defense.

3. **PLAN (CLEANING PLAN)**
   - Convert AI recommendations into a validated `CleaningPlan`. Calculate plan-level Risk Summary (LOW, MEDIUM, HIGH counts).

4. **SIMULATE (DRY RUN & LOSS ESTIMATION)**
   - Execute in-memory dry-run transformation against isolated DataFrame copy. Calculate per-operation stats, cell diff records, and project-defined Information Loss Index (0.0 to 1.0).
   - Original dataset file remains byte-for-byte unchanged on disk.

5. **APPROVE (APPROVAL GATE)**
   - Require explicit user confirmation for simulated cleaning plans before execution is unlocked.

6. **EXECUTE (DETERMINISTIC ENGINE)**
   - Execute confirmed transformations via standard allow-listed Python functions without `eval()` or `exec()`.

7. **TEST (AUTOMATED VALIDATION SUITE)**
   - Run post-transformation validation suite (schema preservation, uniqueness, format patterns, data loss limits).
   - A `FAIL` status aborts version commit and preserves existing dataset state.

8. **COMMIT & VERSION (PARQUET STATE STORE)**
   - Write new immutable Parquet version file to `data/storage/{dataset_id}/versions/v{n}.parquet`.
   - Calculate SHA-256 hash, record Change Log cell diffs, and update active `current_version`.

9. **DOWNLOAD (SAFE STREAMING)**
   - Download active or specific historical dataset version as CSV.

10. **ROLLBACK (REVERSIBILITY ENGINE)**
    - Revert active dataset pointer to any historic version after verifying SHA-256 integrity hash.
    - Historical versions are preserved immutably and never deleted.
