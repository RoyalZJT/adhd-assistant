"""
认证相关的 Pydantic 模型
用于请求验证和响应序列化
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserRegisterRequest(BaseModel):
    """用户注册请求模型"""
    
    email: EmailStr = Field(..., description="邮箱地址")
    password: str = Field(..., min_length=8, max_length=128, description="密码")
    username: str | None = Field(None, min_length=2, max_length=50, description="用户名")
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """
        验证密码强度
        要求：至少8位，包含大写字母、小写字母、数字和特殊字符
        """
        if len(v) < 8:
            raise ValueError("密码至少需要8位")
        if not re.search(r"[A-Z]", v):
            raise ValueError("密码必须包含至少一个大写字母")
        if not re.search(r"[a-z]", v):
            raise ValueError("密码必须包含至少一个小写字母")
        if not re.search(r"\d", v):
            raise ValueError("密码必须包含至少一个数字")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\;'/`~]", v):
            raise ValueError("密码必须包含至少一个特殊字符")
        return v


class UserLoginRequest(BaseModel):
    """用户登录请求模型"""
    
    email: EmailStr = Field(..., description="邮箱地址")
    password: str = Field(..., description="密码")


class TokenResponse(BaseModel):
    """Token 响应模型"""
    
    access_token: str = Field(..., description="访问令牌")
    refresh_token: str = Field(..., description="刷新令牌")
    token_type: str = Field(default="bearer", description="令牌类型")


class RefreshTokenRequest(BaseModel):
    """刷新 Token 请求模型"""
    
    refresh_token: str = Field(..., description="刷新令牌")


class UserResponse(BaseModel):
    """用户信息响应模型"""
    
    id: uuid.UUID = Field(..., description="用户 ID")
    email: str = Field(..., description="邮箱地址")
    username: str | None = Field(None, description="用户名")
    is_active: bool = Field(..., description="是否激活")
    created_at: datetime = Field(..., description="创建时间")
    
    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    """用户信息更新请求模型"""
    
    username: str | None = Field(None, min_length=2, max_length=50, description="用户名")


class MessageResponse(BaseModel):
    """通用消息响应模型"""
    
    message: str = Field(..., description="消息内容")
