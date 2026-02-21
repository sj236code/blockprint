from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_provider: str = "gemini"
    ai_api_key: str = ""
    ai_model: str = "gemini-2.5-flash"
    rcon_host: str = "localhost"
    rcon_port: int = 25575
    rcon_password: str = ""
    build_origin_x: int = 100
    build_origin_y: int = 70
    build_origin_z: int = 100
    debug: bool = True
    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
