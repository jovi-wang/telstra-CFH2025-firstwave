from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from typing import Dict, Any, List
from app.config import settings
from contextlib import AsyncExitStack
import json
import sys


class MCPClient:
    """Client for communicating with CAMARA MCP server via stdio"""

    def __init__(self):
        self.session: ClientSession | None = None
        self.exit_stack: AsyncExitStack = AsyncExitStack()
        self.available_tools: List[Any] = []

    async def connect(self):
        """Connect to the CAMARA MCP server via stdio"""
        try:
            # Set up stdio server parameters
            server_params = StdioServerParameters(
                command=settings.MCP_SERVER_COMMAND,
                args=settings.MCP_SERVER_ARGS,
                cwd=settings.MCP_SERVER_CWD,
                env=None,
            )

            # Use AsyncExitStack to properly manage context managers
            stdio_transport = await self.exit_stack.enter_async_context(
                stdio_client(server_params)
            )
            read_stream, write_stream = stdio_transport

            # Create and initialize session with AsyncExitStack
            self.session = await self.exit_stack.enter_async_context(
                ClientSession(read_stream, write_stream)
            )

            await self.session.initialize()

            # List available tools
            tools_response = await self.session.list_tools()
            self.available_tools = tools_response.tools

        except Exception as e:
            print(
                f"❌ Failed to connect to MCP server: {e}", file=sys.stderr, flush=True
            )
            raise

    async def disconnect(self):
        """Disconnect from MCP server"""
        try:
            await self.exit_stack.aclose()
            self.session = None
            self.available_tools = []
        except Exception as e:
            print(f"⚠️  Error during MCP disconnect: {e}", file=sys.stderr, flush=True)

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """
        Call a tool on the MCP server

        Args:
            tool_name: Name of the tool to call
            arguments: Dictionary of arguments for the tool

        Returns:
            Tool execution result
        """
        if not self.session:
            raise RuntimeError("MCP client not connected")

        try:
            result = await self.session.call_tool(tool_name, arguments)

            # Extract text content from result with proper error handling
            if not hasattr(result, 'content') or result.content is None:
                return {"error": f"Tool {tool_name} returned invalid result structure"}

            if len(result.content) == 0:
                return {"error": f"Tool {tool_name} returned empty content"}

            # Access first content item
            content_item = result.content[0]
            if not hasattr(content_item, 'text'):
                return {"error": f"Tool {tool_name} returned invalid content format"}

            text_content = content_item.text

            if not text_content or text_content.strip() == "":
                return {"error": f"Tool {tool_name} returned empty result"}

            # Clean up text content - strip whitespace and ensure single-line JSON
            text_content = text_content.strip()

            # Parse JSON response from tool with robust handling
            try:
                return json.loads(text_content)
            except json.JSONDecodeError as json_err:
                # FALLBACK: Try to extract just the first valid JSON object if error is "Extra data"
                if "Extra data" in str(json_err) and json_err.pos:
                    try:
                        # Extract only the content up to the error position
                        first_json = text_content[:json_err.pos].strip()
                        # Try parsing the extracted JSON
                        result = json.loads(first_json)
                        return result
                    except Exception:
                        pass

                return {"error": f"Invalid JSON response: {str(json_err)}", "raw_content": text_content[:200]}

        except Exception as e:
            print(f"❌ MCP tool call error ({tool_name}): {e}", file=sys.stderr, flush=True)
            raise

    def get_tools_for_llm(self) -> List[Dict[str, Any]]:
        """
        Convert MCP tools to AWS Bedrock Converse tool format

        Returns:
            List of tool definitions in Bedrock format
        """
        bedrock_tools = []

        for tool in self.available_tools:
            bedrock_tools.append(
                {
                    "toolSpec": {
                        "name": tool.name,
                        "description": tool.description,
                        "inputSchema": {"json": tool.inputSchema},
                    }
                }
            )

        return bedrock_tools

    def get_tool_names(self) -> List[str]:
        """Get list of available tool names"""
        return [tool.name for tool in self.available_tools]


# Global MCP client instance
mcp_client = MCPClient()
