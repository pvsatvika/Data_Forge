from typing import Optional
from app.models.schemas import DatasetProfile, SemanticAnalysisResponse
from app.ai.prompts import PromptBuilder, SYSTEM_INSTRUCTION
from app.ai.client import GroqClient, GroqClientError
from app.ai.validation import ResponseValidator, ResponseValidationError

class SemanticAnalyzer:
    def __init__(self, client: Optional[GroqClient] = None):
        self.client = client or GroqClient()

    async def analyze_dataset_profile(self, profile: DatasetProfile) -> SemanticAnalysisResponse:
        """
        Orchestrate LLM analysis of dataset profile.
        1. Build prompt with prompt injection defense.
        2. Query Groq API.
        3. Enforce server-side validation (allow-list, confidence, risk).
        """
        user_prompt = PromptBuilder.build_analysis_prompt(profile)
        
        # Call Groq API
        raw_response = await self.client.analyze_profile(
            system_instruction=SYSTEM_INSTRUCTION,
            user_prompt=user_prompt
        )

        # Server-side validation of response
        validated_response = ResponseValidator.validate_and_parse_response(
            raw_json_str=raw_response,
            dataset_id=profile.dataset_id,
            model_used=self.client.model
        )

        return validated_response
