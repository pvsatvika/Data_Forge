import json
import uuid
from datetime import datetime
from typing import Dict, Any, List

from app.models.schemas import (
    SemanticAnalysisResponse,
    InferredConstraint,
    CleaningRecommendation,
    AnalysisWarning
)
from app.transformations import ALLOW_LISTED_OPERATIONS

VALID_RISK_LEVELS = {"low", "medium", "high"}

class ResponseValidationError(ValueError):
    """Exception raised when AI response fails server-side validation rules."""
    pass

class ResponseValidator:
    @staticmethod
    def validate_and_parse_response(
        raw_json_str: str,
        dataset_id: str,
        model_used: str
    ) -> SemanticAnalysisResponse:
        """
        Server-side validation of AI output.
        - Parses JSON string.
        - Enforces operation allow-list.
        - Enforces confidence bounds [0.0, 1.0].
        - Enforces valid risk classification.
        - Validates Pydantic schema.
        """
        # Clean potential markdown formatting wrappers
        clean_json = raw_json_str.strip()
        if clean_json.startswith("```"):
            lines = clean_json.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_json = "\n".join(lines).strip()

        try:
            data = json.loads(clean_json)
        except json.JSONDecodeError as e:
            raise ResponseValidationError(f"Groq output is not valid JSON: {str(e)}")

        if not isinstance(data, dict):
            raise ResponseValidationError("Groq JSON response must be a top-level JSON object.")

        dataset_summary = str(data.get("dataset_summary", "Semantic analysis performed successfully."))

        # Validate Inferred Constraints
        validated_constraints: List[InferredConstraint] = []
        raw_constraints = data.get("inferred_constraints", [])
        if isinstance(raw_constraints, list):
            for item in raw_constraints:
                if isinstance(item, dict) and "column" in item:
                    conf = float(item.get("confidence", 0.8))
                    conf = max(0.0, min(1.0, conf)) # Clamp to [0, 1]
                    validated_constraints.append(
                        InferredConstraint(
                            column=str(item.get("column", "unknown")),
                            constraint_type=str(item.get("constraint_type", "general_constraint")),
                            description=str(item.get("description", "")),
                            confidence=conf
                        )
                    )

        # Validate Recommendations against ALLOW-LIST
        validated_recommendations: List[CleaningRecommendation] = []
        raw_recs = data.get("recommendations", [])
        if isinstance(raw_recs, list):
            for rec in raw_recs:
                if not isinstance(rec, dict):
                    continue
                
                col = str(rec.get("column", ""))
                op = str(rec.get("operation", "")).strip().lower()
                
                # STRICT ALLOW-LIST VALIDATION
                if op not in ALLOW_LISTED_OPERATIONS:
                    # Filter out or reject un-allowlisted operation names invented by LLM
                    continue

                reason = str(rec.get("reason", f"Recommended {op} on column {col}"))
                conf = float(rec.get("confidence", 0.8))
                if conf < 0.0 or conf > 1.0:
                    conf = max(0.0, min(1.0, conf))

                risk = str(rec.get("risk", "low")).lower()
                if risk not in VALID_RISK_LEVELS:
                    risk = "medium"

                params = rec.get("parameters", {})
                if not isinstance(params, dict):
                    params = {}

                validated_recommendations.append(
                    CleaningRecommendation(
                        column=col,
                        operation=op,
                        reason=reason,
                        confidence=conf,
                        risk=risk, # type: ignore
                        parameters=params
                    )
                )

        # Validate Warnings
        validated_warnings: List[AnalysisWarning] = []
        raw_warnings = data.get("warnings", [])
        if isinstance(raw_warnings, list):
            for w in raw_warnings:
                if isinstance(w, dict) and "message" in w:
                    sev = str(w.get("severity", "warning")).lower()
                    if sev not in ("info", "warning", "critical"):
                        sev = "warning"
                    validated_warnings.append(
                        AnalysisWarning(
                            type=str(w.get("type", "data_quality")),
                            message=str(w.get("message", "")),
                            severity=sev # type: ignore
                        )
                    )

        analysis_id = f"an_{uuid.uuid4().hex[:12]}"

        return SemanticAnalysisResponse(
            analysis_id=analysis_id,
            dataset_id=dataset_id,
            model_used=model_used,
            dataset_summary=dataset_summary,
            inferred_constraints=validated_constraints,
            recommendations=validated_recommendations,
            warnings=validated_warnings,
            analyzed_at=datetime.utcnow()
        )
