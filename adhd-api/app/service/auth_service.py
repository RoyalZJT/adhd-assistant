"""
认证服务层
处理用户认证相关的业务逻辑
"""
import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.repository.user_repository import UserRepository
from app.model.user import User
from app.schema.auth import UserRegisterRequest, TokenResponse

settings = get_settings()

# 密码哈希上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthServiceError(Exception):
    """认证服务异常基类"""
    pass


class EmailAlreadyExistsError(AuthServiceError):
    """邮箱已存在异常"""
    pass


class InvalidCredentialsError(AuthServiceError):
    """无效凭据异常"""
    pass


class InvalidTokenError(AuthServiceError):
    """无效 Token 异常"""
    pass


class AuthService:
    """认证服务"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        对密码进行哈希处理
        
        Args:
            password: 明文密码
        
        Returns:
            密码哈希值
        """
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        验证密码是否正确
        
        Args:
            plain_password: 明文密码
            hashed_password: 密码哈希
        
        Returns:
            True 表示密码正确
        """
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(user_id: uuid.UUID) -> str:
        """
        创建访问令牌
        
        Args:
            user_id: 用户 ID
        
        Returns:
            JWT 访问令牌
        """
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "type": "access"
        }
        return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    
    @staticmethod
    def create_refresh_token(user_id: uuid.UUID) -> str:
        """
        创建刷新令牌
        
        Args:
            user_id: 用户 ID
        
        Returns:
            JWT 刷新令牌
        """
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "type": "refresh"
        }
        return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    
    @staticmethod
    def decode_token(token: str) -> dict:
        """
        解码并验证 Token
        
        Args:
            token: JWT 令牌
        
        Returns:
            Token 载荷
        
        Raises:
            InvalidTokenError: Token 无效或已过期
        """
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.algorithm]
            )
            return payload
        except JWTError as e:
            raise InvalidTokenError(f"Token 无效: {str(e)}")
    
    async def register(self, data: UserRegisterRequest) -> User:
        """
        用户注册
        
        Args:
            data: 注册请求数据
        
        Returns:
            创建的用户对象
        
        Raises:
            EmailAlreadyExistsError: 邮箱已被注册
        """
        # 检查邮箱是否已存在
        if await self.user_repo.email_exists(data.email):
            raise EmailAlreadyExistsError("该邮箱已被注册")
        
        # 创建用户
        password_hash = self.hash_password(data.password)
        user = await self.user_repo.create(
            email=data.email,
            password_hash=password_hash,
            username=data.username
        )
        
        return user
    
    async def login(self, email: str, password: str) -> TokenResponse:
        """
        用户登录
        
        Args:
            email: 邮箱
            password: 密码
        
        Returns:
            Token 响应
        
        Raises:
            InvalidCredentialsError: 邮箱或密码错误
        """
        # 查找用户
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise InvalidCredentialsError("邮箱或密码错误")
        
        # 验证密码
        if not self.verify_password(password, user.password_hash):
            raise InvalidCredentialsError("邮箱或密码错误")
        
        # 检查账户状态
        if not user.is_active:
            raise InvalidCredentialsError("账户已被禁用")
        
        # 生成 Token
        access_token = self.create_access_token(user.id)
        refresh_token = self.create_refresh_token(user.id)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )
    
    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        """
        刷新访问令牌
        
        Args:
            refresh_token: 刷新令牌
        
        Returns:
            新的 Token 响应
        
        Raises:
            InvalidTokenError: 刷新令牌无效
        """
        # 解码 Token
        payload = self.decode_token(refresh_token)
        
        # 验证 Token 类型
        if payload.get("type") != "refresh":
            raise InvalidTokenError("无效的刷新令牌")
        
        # 获取用户
        user_id = uuid.UUID(payload.get("sub"))
        user = await self.user_repo.get_by_id(user_id)
        
        if not user or not user.is_active:
            raise InvalidTokenError("用户不存在或已被禁用")
        
        # 生成新 Token
        new_access_token = self.create_access_token(user.id)
        new_refresh_token = self.create_refresh_token(user.id)
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token
        )
    
    async def get_current_user(self, token: str) -> User:
        """
        根据 Token 获取当前用户
        
        Args:
            token: 访问令牌
        
        Returns:
            当前用户对象
        
        Raises:
            InvalidTokenError: Token 无效
        """
        payload = self.decode_token(token)
        
        if payload.get("type") != "access":
            raise InvalidTokenError("无效的访问令牌")
        
        user_id = uuid.UUID(payload.get("sub"))
        user = await self.user_repo.get_by_id(user_id)
        
        if not user or not user.is_active:
            raise InvalidTokenError("用户不存在或已被禁用")
        
        return user
