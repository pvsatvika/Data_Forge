from typing import List, Dict, Optional
from app.models.schemas import (
    SemanticAnalysisResponse,
    TransformationPlanItem,
    RiskSummary,
    CleaningPlanResponse
)
from app.transformations import get_transformation_function, validate_transformation_parameters

class CleaningPlanBuilder:
    @staticmethod
    def build_plan_from_analysis(
        analysis: SemanticAnalysisResponse,
        plan_id: str,
        column_types: Optional[Dict[str, str]] = None
    ) -> CleaningPlanResponse:
        """
        Convert AI analysis recommendations into a validated CleaningPlan.
        Validates every operation against the deterministic registry allow-list and parameters.
        Enforces type compatibility for numeric/categorical columns and calculates RiskSummary.
        """
        validated_items: List[TransformationPlanItem] = []
        col_types = column_types or {}
        low_cnt = 0
        med_cnt = 0
        high_cnt = 0

        for rec in analysis.recommendations:
            col_type = col_types.get(rec.column, "")
            try:
                # Enforce transformation registry validation with column type checks
                get_transformation_function(rec.operation)
                validated_params = validate_transformation_parameters(
                    rec.operation, rec.parameters, rec.reason, column_type=col_type
                )
            except ValueError:
                # Auto-correct fill_missing for numeric columns if string constant was provided by LLM
                is_numeric_col = col_type.lower() in ("float", "integer", "int", "numeric", "number", "double")
                if rec.operation.strip().lower() == "fill_missing" and is_numeric_col:
                    rec_reason_lower = (rec.reason or "").lower()
                    strat = "mean" if "mean" in rec_reason_lower else "median"
                    try:
                        validated_params = validate_transformation_parameters(
                            rec.operation, {"strategy": strat}, rec.reason, column_type=col_type
                        )
                    except ValueError:
                        continue
                else:
                    # Reject un-allowlisted or uncorrectable parameter recommendations
                    continue

            item = TransformationPlanItem(
                column=rec.column,
                operation=rec.operation,
                reason=rec.reason,
                confidence=rec.confidence,
                risk=rec.risk,
                parameters=validated_params
            )
            validated_items.append(item)

            if rec.risk == "low":
                low_cnt += 1
            elif rec.risk == "medium":
                med_cnt += 1
            elif rec.risk == "high":
                high_cnt += 1

        requires_approval = med_cnt > 0 or high_cnt > 0 or any(i.operation == "remove_duplicates" for i in validated_items)

        risk_summary = RiskSummary(
            low_count=low_cnt,
            medium_count=med_cnt,
            high_count=high_cnt,
            requires_approval=requires_approval
        )

        return CleaningPlanResponse(
            plan_id=plan_id,
            dataset_id=analysis.dataset_id,
            analysis_id=analysis.analysis_id,
            status="draft",
            transformations=validated_items,
            risk_summary=risk_summary
        )
