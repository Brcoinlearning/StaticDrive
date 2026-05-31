# VM And Docker Deployment Guide

本文档用于把当前 `PocketBase + 业务壳服务 + Web 页面层` 项目部署到可长期运行的环境中，并明确在“还没有虚拟机、但已经安装 Docker Desktop 客户端”的情况下应如何推进。

文档定位：

- 这是 P4 的总体部署路线说明，用来回答“应该先做什么、后做什么”。
- 如果你的目标是“部署到一台新的 Linux 机器”，默认先看 [linux-vm-deployment-playbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/linux-vm-deployment-playbook.md)。
- 如果你要在一台新 Ubuntu VM 上直接照着执行，请优先看 [linux-vm-deployment-playbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/linux-vm-deployment-playbook.md)、[vm-compose-production-template.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-compose-production-template.md) 和 [vm-go-live-short-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-go-live-short-checklist.md)。
- 如果你要查看当前已验证通过的新 VM 结果，请优先看 [vm-accept-acceptance-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-accept-acceptance-closeout.md)。
- 如果你要复用本次“旧 VM 废弃后重建新 VM”的实战经验，请同时看 [vm-rebuild-lessons-learned.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-rebuild-lessons-learned.md)。
- `ubu2404` 相关文档现在只保留为历史归档，不再作为当前默认入口。

## 1. 当前建议

当前最稳妥的路线不是立刻购买云主机或手工安装虚拟机，而是先分两步走：

1. 在本机通过 Docker Desktop 跑通一份接近生产形态的部署。
2. 在确认端口、目录映射、环境变量、反向代理策略都没有问题后，再迁移到真实 Linux 虚拟机。

原因：

- 当前项目本质上只有两个长期进程：`PocketBase` 和 `Node business shell`。
- Docker 更适合先验证“部署形态是否成立”，包括端口、持久化目录、环境变量、启动顺序。
- 如果直接先上虚拟机，出问题时你很难区分是“项目问题”还是“机器初始化问题”。
- 先本机容器化验证，后续无论上云主机、轻量应用服务器还是本地 Linux VM，迁移都会更稳。

## 2. 两条可选路线

### 路线 A：先本机 Docker，再上云 VM

适合当前状态，推荐优先执行。

目标：

- 先在本机得到一套可重复启动的部署方式。
- 后续把同样的目录结构、环境变量和反向代理策略迁移到 Ubuntu 虚拟机。

你现在下一步应该做的是：

1. 安装并打开 `Docker Desktop`。
2. 确认本机能执行 `docker version` 和 `docker compose version`。
3. 后续为本项目补 `Dockerfile`、`docker-compose.yml`、可选的 `nginx.conf`。
4. 在本机先访问：
   - `http://127.0.0.1:8787/web/auth/login`
   - `http://127.0.0.1:8787/web/public/list`
5. 验证通过后，再决定是否上阿里云、腾讯云、Vultr、Oracle Cloud 等 Linux 虚拟机。

### 路线 B：直接上 Linux 虚拟机

适合你已经明确要对外长期提供服务，且愿意自己管理系统。

推荐环境：

- Ubuntu `22.04 LTS` 或 `24.04 LTS`
- 至少 `1 vCPU / 2 GB RAM`
- 磁盘至少 `20 GB`

标准结构：

- `PocketBase` 监听 `127.0.0.1:8090`
- `Node business shell` 监听 `127.0.0.1:8787`
- `Nginx` 对外监听 `80/443`
- `systemd` 托管两个服务

## 3. 如果你现在只有 Docker Desktop，应该先做什么

### 3.1 确认 Docker 可用

在本机终端执行：

```bash
docker version
docker compose version
```

如果两条命令都正常返回版本信息，说明 Docker 基础环境已经就绪。

### 3.2 不建议现在就做的事

在当前阶段，不建议你立刻做以下动作：

- 不建议先手工装一台 Linux 虚拟机再慢慢配环境。
- 不建议一上来就配 HTTPS、域名和公网。
- 不建议先做复杂编排，例如 Kubernetes。

原因很简单：当前项目规模远没到那个复杂度，过早投入会把调试面扩大。

### 3.3 当前正确顺序

推荐顺序如下：

1. 先把当前代码在本机继续保持可运行。
2. 为项目补齐容器化部署文件。
3. 在 Docker Desktop 本机跑通。
4. 再决定：
   - 是继续本机长期使用；
   - 还是迁移到云上 Ubuntu 虚拟机；
   - 还是先用本地 Linux VM 做演练。

## 4. 真实 Linux 虚拟机的推荐部署结构

如果后续进入真实 VM，建议使用如下目录：

```text
/opt/static-content-service
  ├── .env
  ├── package.json
  ├── src/
  ├── scripts/
  ├── pb_migrations/
  ├── pocketbase/
  │   ├── bin/
  │   ├── data/
  │   └── public/
  └── workspace/
```

### 4.1 运行关系

- `PocketBase` 只对本机开放：`127.0.0.1:8090`
- `业务壳服务` 只对本机开放：`127.0.0.1:8787`
- `Nginx` 对外开放：`80/443`
- 外部用户只访问 `Nginx`，不直接访问 PocketBase

### 4.2 推荐环境变量

生产环境建议类似这样配置：

```env
PB_VERSION=0.22.0
PB_HOST=127.0.0.1
PB_PORT=8090
PB_BASE_URL=http://127.0.0.1:8090

PB_ADMIN_EMAIL=your-admin@example.com
PB_ADMIN_PASSWORD=replace-with-strong-password

PB_DATA_DIR=./pocketbase/data
PB_PUBLIC_DIR=./pocketbase/public
WORKSPACE_DIR=./workspace

SERVICE_HOST=127.0.0.1
SERVICE_PORT=8787

PUBLIC_BASE_URL=https://content.example.com
API_KEY_HEADER=x-shutong49-api-key
OWNER_SESSION_COOKIE_NAME=shutong49_owner_session
OWNER_SESSION_MAX_AGE_SECONDS=43200
```

说明：

- `PUBLIC_BASE_URL` 在对外部署时必须改成真实域名。
- 管理员密码建议只使用 ASCII 字符，避免全角标点导致运维误判。
- `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 由业务壳读取，用于访问 PocketBase 受保护集合。

## 5. Linux 虚拟机上的标准部署步骤

### 5.1 安装系统依赖

```bash
sudo apt update
sudo apt install -y nginx unzip curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 5.2 拉取项目并安装 Node 依赖

```bash
cd /opt
sudo git clone <your-repo-url> static-content-service
sudo chown -R $USER:$USER /opt/static-content-service
cd /opt/static-content-service
npm install
```

### 5.3 安装 PocketBase

```bash
cd /opt/static-content-service
bash ./scripts/install_pocketbase.sh
```

### 5.4 初始化 `.env`

```bash
cp .env.example .env
```

然后手工编辑 `.env`，填好：

- `PB_ADMIN_EMAIL`
- `PB_ADMIN_PASSWORD`
- `PUBLIC_BASE_URL`

### 5.5 首次手工启动

终端 1：

```bash
cd /opt/static-content-service
bash ./scripts/preflight.sh pocketbase
./scripts/start_pocketbase.sh
```

终端 2：

```bash
cd /opt/static-content-service
bash ./scripts/preflight.sh service
./scripts/start_service.sh
```

### 5.6 首次启动后必须完成的事情

1. 打开 PocketBase 管理后台。
2. 创建管理员账号。
3. 确认迁移已创建：
   - `users_api`
   - `contents`
   - `share_links`
4. 插入至少一条 `users_api` 测试数据。
5. 调用项目已有演示脚本或手工 API，验证六个核心能力。

## 6. Linux 虚拟机上的进程托管建议

建议使用 `systemd`。

### 6.1 PocketBase service

文件：`/etc/systemd/system/pocketbase-content-pb.service`

```ini
[Unit]
Description=PocketBase for static content service
After=network.target

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/opt/static-content-service
ExecStart=/opt/static-content-service/scripts/start_pocketbase.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### 6.2 Business shell service

文件：`/etc/systemd/system/pocketbase-content-app.service`

```ini
[Unit]
Description=Business shell for static content service
After=network.target pocketbase-content-pb.service
Requires=pocketbase-content-pb.service

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/opt/static-content-service
ExecStart=/opt/static-content-service/scripts/start_service.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### 6.3 启用与检查

```bash
sudo systemctl daemon-reload
sudo systemctl enable pocketbase-content-pb
sudo systemctl enable pocketbase-content-app
sudo systemctl start pocketbase-content-pb
sudo systemctl start pocketbase-content-app
sudo systemctl status pocketbase-content-pb
sudo systemctl status pocketbase-content-app
```

日志查看：

```bash
journalctl -u pocketbase-content-pb -n 100 --no-pager
journalctl -u pocketbase-content-app -n 100 --no-pager
```

## 7. Linux 虚拟机上的 Nginx 反向代理建议

`/etc/nginx/sites-available/static-content-service`

```nginx
server {
    listen 80;
    server_name content.example.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

启用：

```bash
sudo ln -s /etc/nginx/sites-available/static-content-service /etc/nginx/sites-enabled/static-content-service
sudo nginx -t
sudo systemctl reload nginx
```

### 7.1 HTTPS

域名解析完成后：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d content.example.com
```

## 8. 首次上线检查清单

1. `curl http://127.0.0.1:8090/api/health` 返回 200。
2. `curl http://127.0.0.1:8787/api/health` 返回 200。
3. 浏览器可访问 `/web/auth/login`。
4. 浏览器可访问 `/web/public/list`。
5. API Key 写入 HTML 成功。
6. API Key 写入文件成功。
7. public content 页面可以访问 rich text。
8. public content / public share 可以真实下载文件。
9. revoke share 后公开访问失效。
10. delete 后 owner 与 public 页面都不再可用。

## 9. 发布更新命令

如果代码更新但未改 PocketBase 迁移，可执行：

```bash
cd /opt/static-content-service
git pull
npm install
sudo systemctl restart pocketbase-content-app
```

如果包含 `pb_migrations/` 或 PocketBase 相关底座变更，建议一起重启：

```bash
cd /opt/static-content-service
git pull
npm install
sudo systemctl restart pocketbase-content-pb
sudo systemctl restart pocketbase-content-app
```

## 10. 当前阶段结论

对于你当前的实际状态，结论非常明确：

- 你现在不应该优先去“装虚拟机”。
- 你现在应该先确认 Docker Desktop 可用。
- 然后下一阶段为本项目补容器化文件。
- 本机 Docker 形态跑通后，再迁移到真实 Ubuntu 虚拟机。

这样做的收益是：部署问题会被拆成两个更容易控制的子问题。

1. 项目本身能否稳定启动。
2. 目标机器是否只是环境差异。

这比直接把两类问题叠在一起更可控。

## 11. 本机 Docker Desktop 最小落地步骤

当前仓库已经补齐以下文件：

- `docker-compose.yml`
- `docker/app.Dockerfile`
- `docker/pocketbase.Dockerfile`
- `.env.docker.example`
- `.dockerignore`

### 11.1 首次启动

```bash
cp .env.docker.example .env
APP_ENV_FILE=.env.docker.example docker compose --env-file .env.docker.example build
APP_ENV_FILE=.env.docker.example docker compose --env-file .env.docker.example up -d
```

### 11.2 首次初始化

1. 打开 `http://127.0.0.1:8090/_/`。
2. 创建 PocketBase 管理员账号。
3. 确保 `.env` 中的 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 与刚创建的管理员一致。
4. 重启 app 容器：

```bash
APP_ENV_FILE=.env.docker.example docker compose --env-file .env.docker.example restart app
```

5. 在 PocketBase 后台确认集合已存在：
   - `users_api`
   - `contents`
   - `share_links`
6. 手工插入一条 `users_api` 记录。

### 11.3 常用命令

```bash
APP_ENV_FILE=.env.docker.example docker compose --env-file .env.docker.example ps
APP_ENV_FILE=.env.docker.example docker compose --env-file .env.docker.example logs -f pocketbase
APP_ENV_FILE=.env.docker.example docker compose --env-file .env.docker.example logs -f app
APP_ENV_FILE=.env.docker.example docker compose --env-file .env.docker.example restart app
APP_ENV_FILE=.env.docker.example docker compose --env-file .env.docker.example down
```

### 11.4 首轮验证地址

- PocketBase 后台：`http://127.0.0.1:8090/_/`
- 业务壳健康检查：`http://127.0.0.1:8787/api/health`
- owner 登录页：`http://127.0.0.1:8787/web/auth/login`
- public 列表页：`http://127.0.0.1:8787/web/public/list`

### 11.5 关键提醒

- Docker 形态下，容器内 app 访问 PocketBase 必须使用 `PB_BASE_URL=http://pocketbase:8090`，不能继续写 `127.0.0.1:8090`。
- Docker 形态下，`SERVICE_HOST` 必须是 `0.0.0.0`，否则容器外无法访问 8787。
- 如果你后续要切回本机非 Docker 启动，应恢复原本的 `.env`，不要直接复用 Docker 版地址。
