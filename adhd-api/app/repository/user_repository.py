"""
用户仓储层
负责数据库 CRUD 操作
"""
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.model.user import User


class UserRepository:
    """用户数据访问对象"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, email: str, password_hash: str, username: str | None = None) -> User:
        """
        创建新用户
        
        Args:
            email: 邮箱地址
            password_hash: 密码哈希
            username: 用户名（可选）
        
        Returns:
            创建的用户对象
        """
        user = User(
            email=email,
            password_hash=password_hash,
            username=username
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def get_by_email(self, email: str) -> User | None:
        """
        根据邮箱查询用户
        
        Args:
            email: 邮箱地址
        
        Returns:
            用户对象，不存在则返回 None
        """
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        """
        根据 ID 查询用户
        
        Args:
            user_id: 用户 ID
        
        Returns:
            用户对象，不存在则返回 None
        """
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def update(self, user: User, **kwargs) -> User:
        """
        更新用户信息
        
        Args:
            user: 用户对象
            **kwargs: 要更新的字段
        
        Returns:
            更新后的用户对象
        """
        for key, value in kwargs.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def email_exists(self, email: str) -> bool:
        """
        检查邮箱是否已被注册
        
        Args:
            email: 邮箱地址
        
        Returns:
            True 表示已存在，False 表示不存在
        """
        user = await self.get_by_email(email)
        return user is not None
