"""
FastAPI 应用入口
配置 CORS、路由、生命周期事件
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.api.auth import router as auth_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    启动时初始化数据库，关闭时清理资源
    """
    # 启动时执行
    await init_db()
    print("数据库初始化完成")
    
    yield
    
    # 关闭时执行
    print("应用关闭")


# 创建 FastAPI 应用实例
app = FastAPI(
    title="ADHD Assistant API",
    description="ADHD 助手应用后端 API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth_router, prefix="/api")


@app.get("/")
async def root():
    """根路径健康检查"""
    return {"status": "ok", "message": "ADHD Assistant API is running"}


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}
