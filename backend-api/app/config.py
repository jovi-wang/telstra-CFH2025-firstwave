class Settings:
    """Application settings and configuration"""

    # Server
    PORT: int = 4000
    HOST: str = "0.0.0.0"

    # LLM - Google Gemini (OpenAI-compatible endpoint)
    LLM_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    LLM_API_KEY: str = "AIzaSyCRyfXGRHLoQhnwxVin0hWCX_bw225_H2o"
    # LLM_API_KEY: str = "AIzaSyDjH1PZ_e5srMvnJ338vwPTUtpeL4JY-7U"

    LLM_MODEL: str = "gemini-2.0-flash"

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
