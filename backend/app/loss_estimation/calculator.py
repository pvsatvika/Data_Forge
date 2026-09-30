def compute_information_loss_score(
    original_row_count: int,
    col_count: int,
    rows_removed: int,
    values_nullified: int,
    cells_changed: int
) -> float:
    """
    Compute project-defined Information Loss Index (0.0 to 1.0).

    Weighted Component Formula:
    - Row Deletion Weight (W_rows) = 0.50 (Complete entity deletion)
    - Value Nullification Weight (W_nulls) = 0.35 (Attribute nullification)
    - Value Alteration Weight (W_cells) = 0.15 (Value formatting modification)

    loss_score = min(1.0, (0.50 * row_loss_ratio) + (0.35 * null_loss_ratio) + (0.15 * cell_change_ratio))
    """
    if original_row_count <= 0 or col_count <= 0:
        return 0.0

    row_loss_ratio = rows_removed / original_row_count
    total_cells = original_row_count * col_count
    null_loss_ratio = values_nullified / total_cells
    cell_change_ratio = cells_changed / total_cells

    raw_score = (0.50 * row_loss_ratio) + (0.35 * null_loss_ratio) + (0.15 * cell_change_ratio)
    return min(1.0, round(float(raw_score), 4))
