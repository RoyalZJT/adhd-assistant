"""
用户数据模型
定义用户表的 ORM 映射
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class User(Base):
    """用户模型"""
    
    __tablename__ = "users"
    
    # 主键使用 UUID，增强安全性
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    
    # 邮箱作为登录标识，必须唯一
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    
    # 密码哈希，不存储明文密码
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    # 用户名，用于显示
    username: Mapped[str] = mapped_column(
        String(50),
        nullable=True
    )
    
    # 账户状态
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"
