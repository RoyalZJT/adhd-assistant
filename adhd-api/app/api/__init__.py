"""
API 模块
导出所有路由
"""
from app.api.auth import router as auth_router

__all__ = ["auth_router"]
