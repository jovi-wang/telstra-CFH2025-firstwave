from openai import AsyncOpenAI
from typing import List, Dict, Any, AsyncIterator
from app.config import settings


class LLMService:
    """Service for communicating with Gemini via OpenAI-compatible API"""

    def __init__(self):
        self.client = AsyncOpenAI(
            base_url=settings.LLM_BASE_URL,
            api_key=settings.LLM_API_KEY,
        )

    async def chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]] | None = None,
        temperature: float | None = None,
    ) -> AsyncIterator:
        """
        Stream chat completion with optional tool calling support

        Args:
            messages: List of message dicts with 'role' and 'content'
            tools: Optional list of tool definitions in OpenAI format
            temperature: Optional temperature override

        Yields:
            Streaming chunks from the LLM
        """
        try:
            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                tools=tools,
                temperature=0,
                stream=True,
            )

            async for chunk in response:
                yield chunk

        except Exception as e:
            print(f"❌ LLM Service Error: {e}")
            raise
