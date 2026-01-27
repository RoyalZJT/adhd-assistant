# ADHD Assistant API

ADHD 助手应用的后端 API 服务。

## 技术栈

- FastAPI - Web 框架
- PostgreSQL - 数据库
- SQLAlchemy 2.0 - ORM
- Pydantic - 数据验证
- JWT - 用户认证

## 快速开始

### 1. 安装依赖

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 3. 初始化数据库

```bash
# 确保已创建 PostgreSQL 数据库
python -c "from app.database import init_db; import asyncio; asyncio.run(init_db())"
```

### 4. 启动服务

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. 访问 API 文档

打开浏览器访问：http://localhost:8000/docs

## API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/refresh | 刷新 Token |
| GET | /api/auth/me | 获取当前用户 |
| PUT | /api/auth/me | 更新用户信息 |
