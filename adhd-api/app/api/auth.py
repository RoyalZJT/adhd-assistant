"""
认证 API 路由
处理用户注册、登录、Token 刷新等请求
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.service.auth_service import (
    AuthService,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidTokenError,
)
from app.schema.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    UserUpdateRequest,
    MessageResponse,
)

router = APIRouter(prefix="/auth", tags=["认证"])

# Bearer Token 提取器
security = HTTPBearer()


async def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    从 Token 中获取当前用户的依赖注入函数
    """
    auth_service = AuthService(db)
    try:
        user = await auth_service.get_current_user(credentials.credentials)
        return user
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    用户注册
    
    - **email**: 邮箱地址（必填）
    - **password**: 密码，至少8位，包含字母和数字（必填）
    - **username**: 用户名（可选）
    """
    auth_service = AuthService(db)
    
    try:
        await auth_service.register(data)
        return MessageResponse(message="注册成功")
    except EmailAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    用户登录
    
    - **email**: 邮箱地址
    - **password**: 密码
    
    返回 access_token 和 refresh_token
    """
    auth_service = AuthService(db)
    
    try:
        tokens = await auth_service.login(data.email, data.password)
        return tokens
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    刷新访问令牌
    
    使用 refresh_token 获取新的 access_token 和 refresh_token
    """
    auth_service = AuthService(db)
    
    try:
        tokens = await auth_service.refresh_tokens(data.refresh_token)
        return tokens
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user = Depends(get_current_user_from_token)
):
    """
    获取当前登录用户信息
    
    需要在请求头中携带 Bearer Token
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    data: UserUpdateRequest,
    current_user = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    更新当前用户信息
    
    - **username**: 新的用户名
    """
    from app.repository.user_repository import UserRepository
    
    user_repo = UserRepository(db)
    updated_user = await user_repo.update(current_user, username=data.username)
    return updated_user
