# ADHD Assistant API 服务器部署指南

本指南将帮助你在 Ubuntu 24.04.2 LTS 服务器上部署 ADHD Assistant 后端 API。

---

## 一、安装 PostgreSQL

```bash
# 更新软件包列表
sudo apt update

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 启动并设置开机自启
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 创建数据库和用户

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 PostgreSQL 命令行中执行以下命令（替换 your_password 为你的密码）
CREATE USER adhd_user WITH PASSWORD 'your_password';
CREATE DATABASE adhd_db OWNER adhd_user;
GRANT ALL PRIVILEGES ON DATABASE adhd_db TO adhd_user;
\q
```

---

## 二、上传后端代码

将 `adhd-api` 目录上传到服务器。你可以使用 SCP、SFTP 或 Git：

### 方法1：使用 SCP（推荐）

```bash
# 在本地执行，将代码上传到服务器
scp -r adhd-api/ username@your-server-ip:~/
```

### 方法2：使用 Git

```bash
# 在服务器上执行
cd ~
git clone your-repo-url adhd-api
```

---

## 三、配置 Python 环境

```bash
# 安装 pip 和 venv（如果未安装）
sudo apt install -y python3-pip python3-venv

# 进入项目目录
cd ~/adhd-api

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

---

## 四、配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑环境变量
nano .env
```

修改以下配置：

```ini
# 数据库配置（替换为你的密码）
DATABASE_URL=postgresql+asyncpg://adhd_user:your_password@localhost:5432/adhd_db

# JWT 密钥（使用强密钥，可以用以下命令生成）
# openssl rand -hex 32
SECRET_KEY=your-generated-secret-key

# 允许的前端域名（替换为你的前端地址）
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:5173
```

---

## 五、测试运行

```bash
# 确保虚拟环境已激活
source ~/adhd-api/venv/bin/activate

# 启动服务（测试）
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

访问 `http://your-server-ip:8000/docs` 查看 API 文档。

按 `Ctrl+C` 停止。

---

## 六、配置 Systemd 服务

创建服务文件：

```bash
sudo nano /etc/systemd/system/adhd-api.service
```

添加以下内容（替换 `ubuntu` 为你的用户名）：

```ini
[Unit]
Description=ADHD Assistant API Service
After=network.target postgresql.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/adhd-api
Environment="PATH=/home/ubuntu/adhd-api/venv/bin"
ExecStart=/home/ubuntu/adhd-api/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启用并启动服务：

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start adhd-api

# 设置开机自启
sudo systemctl enable adhd-api

# 检查状态
sudo systemctl status adhd-api
```

---

## 七、配置 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/adhd-api
```

添加以下内容（替换 `your-server-ip` 为你的服务器 IP）：

```nginx
server {
    listen 80;
    server_name your-server-ip;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/adhd-api /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 八、防火墙配置

```bash
# 允许 HTTP 流量
sudo ufw allow 80/tcp

# 允许 HTTPS 流量（如果配置了 SSL）
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable
```

---

## 九、前端配置

在前端项目中，创建或修改 `.env` 文件：

```ini
VITE_API_URL=http://your-server-ip
```

如果你已部署到 Vercel，在 Vercel 项目设置中添加环境变量：
- 变量名：`VITE_API_URL`
- 值：`http://your-server-ip`

---

## 十、验证部署

1. 访问 `http://your-server-ip/docs` 查看 API 文档
2. 测试注册接口：`POST http://your-server-ip/api/auth/register`
3. 测试登录接口：`POST http://your-server-ip/api/auth/login`

---

## 常用命令

```bash
# 查看服务状态
sudo systemctl status adhd-api

# 查看日志
sudo journalctl -u adhd-api -f

# 重启服务
sudo systemctl restart adhd-api

# 停止服务
sudo systemctl stop adhd-api
```

---

## 故障排查

1. **数据库连接失败**：检查 `.env` 中的数据库密码是否正确
2. **端口被占用**：使用 `sudo lsof -i :8000` 检查
3. **权限问题**：确保虚拟环境目录权限正确

如有问题，请检查日志：`sudo journalctl -u adhd-api -n 50`
