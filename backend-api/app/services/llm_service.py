import boto3
import json
import asyncio
from typing import List, Dict, Any, AsyncIterator
from app.config import settings


class LLMService:
    """Service for communicating with AWS Bedrock Claude via Converse API"""

    def __init__(self):
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

    def _convert_messages_to_bedrock(
        self, messages: List[Dict[str, Any]]
    ) -> tuple[List[Dict[str, str]], List[Dict[str, Any]]]:
        """
        Convert OpenAI-style messages to Bedrock Converse format.

        Returns:
            Tuple of (system_prompts, bedrock_messages)
        """
        system_prompts = []
        bedrock_messages = []

        for msg in messages:
            role = msg.get("role")
            content = msg.get("content", "")

            if role == "system":
                # System messages go to separate system parameter
                system_prompts.append({"text": content})

            elif role == "user":
                bedrock_messages.append({"role": "user", "content": [{"text": content}]})

            elif role == "assistant":
                assistant_content = []

                # Add text content if present
                if content:
                    assistant_content.append({"text": content})

                # Add tool use blocks if present
                if "tool_calls" in msg and msg["tool_calls"]:
                    for tc in msg["tool_calls"]:
                        tool_use_block = {
                            "toolUse": {
                                "toolUseId": tc["id"],
                                "name": tc["function"]["name"],
                                "input": {},
                            }
                        }
                        # Parse arguments if they're a string
                        args = tc["function"].get("arguments", {})
                        if isinstance(args, str):
                            try:
                                tool_use_block["toolUse"]["input"] = json.loads(args)
                            except json.JSONDecodeError:
                                tool_use_block["toolUse"]["input"] = {}
                        else:
                            tool_use_block["toolUse"]["input"] = args
                        assistant_content.append(tool_use_block)

                if assistant_content:
                    bedrock_messages.append(
                        {"role": "assistant", "content": assistant_content}
                    )

            elif role == "tool":
                # Tool results in Bedrock go as user messages with toolResult
                tool_call_id = msg.get("tool_call_id", "")
                tool_content = msg.get("content", "{}")

                # Parse tool result content
                try:
                    result_json = json.loads(tool_content)
                except json.JSONDecodeError:
                    result_json = {"result": tool_content}

                # Bedrock requires toolResult.content[].json to be a JSON object (dict)
                # If the result is a list or primitive, wrap it in an object
                if not isinstance(result_json, dict):
                    result_json = {"result": result_json}

                tool_result_block = {
                    "toolResult": {
                        "toolUseId": tool_call_id,
                        "content": [{"json": result_json}],
                    }
                }

                # Check if last message is a user message with toolResult
                # If so, append to it; otherwise create new user message
                if (
                    bedrock_messages
                    and bedrock_messages[-1]["role"] == "user"
                    and any(
                        "toolResult" in c for c in bedrock_messages[-1]["content"]
                    )
                ):
                    bedrock_messages[-1]["content"].append(tool_result_block)
                else:
                    bedrock_messages.append(
                        {"role": "user", "content": [tool_result_block]}
                    )

        return system_prompts, bedrock_messages

    async def chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]] | None = None,
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Stream chat completion with optional tool calling support using Bedrock Converse API.

        Args:
            messages: List of message dicts with 'role' and 'content'
            tools: Optional list of tool definitions in Bedrock format

        Yields:
            Streaming events from Bedrock
        """
        try:
            # Convert messages to Bedrock format
            system_prompts, bedrock_messages = self._convert_messages_to_bedrock(
                messages
            )

            # Build request params
            params = {
                "modelId": settings.BEDROCK_MODEL_ID,
                "messages": bedrock_messages,
                "inferenceConfig": {
                    "temperature": 0,  # Use deterministic output for consistent tool calling
                },
            }

            # Add system prompts if present
            if system_prompts:
                params["system"] = system_prompts

            # Add tool configuration if tools provided
            if tools:
                params["toolConfig"] = {"tools": tools}

            # Call converse_stream (sync API wrapped in executor for async compatibility)
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None, lambda: self.client.converse_stream(**params)
            )

            # Yield streaming events
            for event in response["stream"]:
                yield event
                # Give control back to event loop to allow SSE to flush
                await asyncio.sleep(0)

        except Exception as e:
            print(f"❌ LLM Service Error: {e}")
            raise
