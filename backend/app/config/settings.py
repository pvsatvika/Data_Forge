import os
from pathlib import Path
from typing import List
from pydantic import Field
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel as BaseSettings  # Fallback type definition if needed

class Settings(BaseSettings):
    PROJECT_NAME: str = Field(default="Data Forge API")
    VERSION: str = Field(default="0.1.0")
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)

    # Groq AI settings
    GROQ_API_KEY: str = Field(default_factory=lambda: os.getenv("GROQ_API_KEY", ""))
    GROQ_MODEL: str = Field(default_factory=lambda: os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"))

    # Supabase Authentication & Storage Settings
    SUPABASE_JWT_SECRET: str = Field(default_factory=lambda: os.getenv("SUPABASE_JWT_SECRET", ""))
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default_factory=lambda: os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
    SUPABASE_URL: str = Field(default_factory=lambda: os.getenv("SUPABASE_URL", "https://tnmdiejiumwzxcndclmc.supabase.co"))
    SUPABASE_AUDIENCE: str = Field(default_factory=lambda: os.getenv("SUPABASE_AUDIENCE", "authenticated"))
    STORAGE_MODE: str = Field(default_factory=lambda: os.getenv("STORAGE_MODE", "local"))
    SUPABASE_STORAGE_BUCKET: str = Field(default_factory=lambda: os.getenv("SUPABASE_STORAGE_BUCKET", "data-forge-storage"))

    # Server & Database Settings
    HOST: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    DATABASE_URL: str = Field(default="sqlite:///./data/storage/data_forge.db")
    
    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "data" / "storage"
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    
    # File upload limits
    MAX_UPLOAD_SIZE_MB: int = Field(default=25)
    ALLOWED_EXTENSIONS: set = Field(default_factory=lambda: {".csv", ".xlsx"})

    # CORS
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    )

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
