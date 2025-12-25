from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Teaching Resource Agent"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # AI Configuration
    ZHIPU_API_KEY: str
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    TAVILY_API_KEY: Optional[str] = None
    
    # Application Settings
    CORS_ORIGINS: List[str] = ["*"]
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 10
    MAX_PAGE_SIZE: int = 100
    
    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

# 创建单例配置实例
settings = Settings()
