from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, Optional


class Settings(BaseSettings):
    # App settings
    app_name: str = "Image-to-Minecraft API"
    debug: bool = True
    version: str = "1.0.0"
    
    # CORS comma-separated (e.g. CORS_ORIGINS=http://localhost:5173,http://localhost:3000)
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # RCON Configuration
    rcon_host: str = "localhost"
    rcon_port: int = 25575
    rcon_password: str = "minecraft"
    
    # Build Origin
    build_origin_x: int = 100
    build_origin_y: int = 70
    build_origin_z: int = 100
    
    # AI Provider
    ai_provider: str = "openai"  # or "gemini"
    ai_api_key: Optional[str] = None
    ai_model: str = "gpt-4-vision-preview"
    
    # Upload settings
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    upload_dir: str = "./uploads"

    # ElevenLabs (speech-to-text for voice blueprint)
    elevenlabs_api_key: Optional[str] = None
    elevenlabs_stt_model: str = "scribe_v1"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()