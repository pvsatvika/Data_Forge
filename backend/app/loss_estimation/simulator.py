from typing import List, Tuple, Dict, Any
import pandas as pd
import numpy as np

from app.models.schemas import (
    TransformationPlanItem,
    TransformationStats,
    CellDiffRecord,
    InformationLossSummary
)
from app.transformations import get_transformation_function, validate_transformation_parameters
from app.loss_estimation.calculator import compute_information_loss_score

MAX_PREVIEW_DIFFS = 50

def run_dry_run_simulation(
    df_original: pd.DataFrame,
    transformations: List[TransformationPlanItem]
) -> Tuple[InformationLossSummary, List[TransformationStats], List[CellDiffRecord], bool]:
    """
    Run in-memory dry run simulation against a copy of the original dataset.
    Does NOT modify original uploaded file or original DataFrame object.
    Calculates transformation statistics, cell diffs, and Information Loss Index.
    """
    df_sim = df_original.copy()
    original_row_count = len(df_original)
    col_count = len(df_original.columns)

    transformation_stats: List[TransformationStats] = []
    all_cell_diffs: List[CellDiffRecord] = []
    affected_columns_set = set()

    total_rows_removed = 0
    total_cells_changed = 0
    total_values_nullified = 0

    for item in transformations:
        op_func = get_transformation_function(item.operation)
        validated_params = validate_transformation_parameters(item.operation, item.parameters)

        df_before_op = df_sim.copy()

        # Execute transformation on copy
        df_sim, stats = op_func(df_sim, item.column, validated_params)

        affected_rows = stats.get("affected_rows", 0)
        changed_cells = stats.get("changed_cells", 0)
        nulls_created = stats.get("nulls_created", 0)
        rows_removed = stats.get("rows_removed", 0)

        total_rows_removed += rows_removed
        total_cells_changed += changed_cells
        total_values_nullified += nulls_created

        if item.column in df_original.columns:
            affected_columns_set.add(item.column)

        transformation_stats.append(
            TransformationStats(
                operation=item.operation,
                column=item.column,
                affected_rows=affected_rows,
                changed_cells=changed_cells,
                nulls_created=nulls_created,
                rows_removed=rows_removed
            )
        )

        # Generate cell diff records if column exists and not row removal
        if item.column in df_before_op.columns and len(df_before_op) == len(df_sim):
            s_before = df_before_op[item.column]
            s_after = df_sim[item.column]

            diff_mask = (s_before.astype(str) != s_after.astype(str)) & (s_before.notna() | s_after.notna())
            diff_indices = df_sim.index[diff_mask].tolist()

            for idx in diff_indices:
                old_val = str(s_before.loc[idx]) if pd.notna(s_before.loc[idx]) else None
                new_val = str(s_after.loc[idx]) if pd.notna(s_after.loc[idx]) else None
                all_cell_diffs.append(
                    CellDiffRecord(
                        row_index=int(idx),
                        column_name=item.column,
                        old_value=old_val,
                        new_value=new_val,
                        operation=item.operation
                    )
                )

    simulated_row_count = len(df_sim)
    total_rows_affected = max(total_rows_removed, len(set(d.row_index for d in all_cell_diffs)))

    loss_score = compute_information_loss_score(
        original_row_count=original_row_count,
        col_count=col_count,
        rows_removed=total_rows_removed,
        values_nullified=total_values_nullified,
        cells_changed=total_cells_changed
    )

    diff_truncated = len(all_cell_diffs) > MAX_PREVIEW_DIFFS
    truncated_diffs = all_cell_diffs[:MAX_PREVIEW_DIFFS]

    loss_summary = InformationLossSummary(
        original_row_count=original_row_count,
        simulated_row_count=simulated_row_count,
        rows_affected=total_rows_affected,
        rows_removed=total_rows_removed,
        cells_changed=total_cells_changed,
        values_nullified=total_values_nullified,
        columns_affected=sorted(list(affected_columns_set)),
        estimated_loss_score=loss_score
    )

    return loss_summary, transformation_stats, truncated_diffs, diff_truncated
