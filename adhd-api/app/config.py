"""
应用配置模块
从环境变量读取配置，确保敏感信息不硬编码
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置类"""
    
    # 数据库配置
    database_url: str = "postgresql+asyncpg://adhd_user:password@localhost:5432/adhd_db"
    
    # JWT 配置
    secret_key: str = "your-super-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # 应用配置
    debug: bool = False
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def cors_origins(self) -> list[str]:
        """解析 CORS 允许的源列表"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """
    获取配置单例
    使用 lru_cache 确保配置只加载一次
    """
    return Settings()
