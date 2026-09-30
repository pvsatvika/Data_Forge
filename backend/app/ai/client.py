import os
import httpx
from typing import Optional
from app.config.settings import settings

class GroqClientError(Exception):
    """Base exception for Groq client errors."""
    pass

class GroqClient:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL
        self.base_url = "https://api.groq.com/openai/v1"

    def is_configured(self) -> bool:
        """Check if Groq API key is configured."""
        return bool(self.api_key and self.api_key.strip())

    async def analyze_profile(self, system_instruction: str, user_prompt: str) -> str:
        """
        Send prompt to Groq API and return raw completion text.
        Handles timeouts, missing credentials, rate limits, and API errors safely.
        """
        if not self.is_configured():
            raise GroqClientError(
                "Groq API key is not configured. Please set GROQ_API_KEY in environment."
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 401:
                    raise GroqClientError("Invalid or unauthorized Groq API key.")
                elif response.status_code == 429:
                    raise GroqClientError("Groq API rate limit exceeded. Please retry shortly.")
                elif response.status_code != 200:
                    raise GroqClientError(
                        f"Groq API returned HTTP error {response.status_code}: {response.text[:200]}"
                    )

                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise GroqClientError("Groq API returned an empty completion response.")

                content = choices[0].get("message", {}).get("content", "")
                if not content:
                    raise GroqClientError("Groq API returned empty message content.")

                return content

        except httpx.TimeoutException:
            raise GroqClientError("Groq API request timed out after 30 seconds.")
        except httpx.RequestError as e:
            raise GroqClientError(f"Network error connecting to Groq API: {type(e).__name__}")
