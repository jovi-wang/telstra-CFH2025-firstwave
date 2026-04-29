class Settings:
    """Application settings and configuration"""

    # AWS Bedrock - Claude Haiku 4.5
    AWS_ACCESS_KEY_ID: str = "xxx"
    AWS_SECRET_ACCESS_KEY: str = "xxx"
    AWS_REGION: str = "ap-southeast-2"  # Sydney
    BEDROCK_MODEL_ID: str = "au.anthropic.claude-haiku-4-5-20251001-v1:0"

    # MCP Server (running from within backend-api directory with relative path)
    MCP_SERVER_COMMAND: str = ".venv/bin/python"
    MCP_SERVER_ARGS: list[str] = ["-m", "app.services.mcp_server"]
    MCP_SERVER_CWD: str = "."

    # CORS
    CORS_ORIGINS: list[str] = ["*"]


settings = Settings()
