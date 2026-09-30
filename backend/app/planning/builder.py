from typing import List
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
        plan_id: str
    ) -> CleaningPlanResponse:
        """
        Convert AI analysis recommendations into a validated CleaningPlan.
        Validates every operation against the deterministic registry allow-list and parameters.
        Calculates plan-level RiskSummary.
        """
        validated_items: List[TransformationPlanItem] = []
        low_cnt = 0
        med_cnt = 0
        high_cnt = 0

        for rec in analysis.recommendations:
            try:
                # Enforce transformation registry validation
                get_transformation_function(rec.operation)
                validated_params = validate_transformation_parameters(rec.operation, rec.parameters)
            except ValueError:
                # Reject un-allowlisted or invalid parameter recommendations
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
