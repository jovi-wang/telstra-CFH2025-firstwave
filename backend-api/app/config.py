class Settings:
    """Application settings and configuration"""

    # Server
    PORT: int = 4000
    HOST: str = "0.0.0.0"

    # AWS Bedrock - Claude 3 Haiku
    AWS_ACCESS_KEY_ID: str = "xxx"
    AWS_SECRET_ACCESS_KEY: str = "xxx"
    AWS_REGION: str = "ap-southeast-2"  # Sydney
    BEDROCK_MODEL_ID: str = "anthropic.claude-3-haiku-20240307-v1:0"

    # MCP Server (running from within backend-api directory with relative path)
    MCP_SERVER_COMMAND: str = ".venv/bin/python"
    MCP_SERVER_ARGS: list[str] = ["-m", "app.services.mcp_server"]
    MCP_SERVER_CWD: str = "."

    # CORS
    CORS_ORIGINS: list[str] = ["*"]

    # Mission defaults
    DEFAULT_DRONE_ID: str = "drone-001"
    DEFAULT_PHONE_NUMBER: str = "+61491570006"
    DEFAULT_INCIDENT_LAT: float = -37.8136
    DEFAULT_INCIDENT_LON: float = 144.9631


settings = Settings()
