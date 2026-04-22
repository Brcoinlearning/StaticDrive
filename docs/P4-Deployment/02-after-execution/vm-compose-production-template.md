# VM Compose Production Template

本文档提供一套从“本机 Docker Desktop 已验证通过”迁移到“真实 Linux 虚拟机”的最小生产模板。

文档定位：

- 这是“新 VM 从零部署”的标准模板，不记录某一台机器的个性化事实。
- 如果你只想要最短执行步骤，请看 [vm-go-live-short-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-go-live-short-checklist.md)。
- 如果你要维护本次已经落地的 `ubu2404`，请看 [vm-ubu2404-ip-http-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-ubu2404-ip-http-closeout.md)。

配套模板文件位于：

- `deploy/vm-compose/docker-compose.prod.yml`
- `deploy/vm-compose/nginx.conf.example`
- `deploy/vm-compose/static-content-compose.service.example`

## 1. 使用目标

这套模板用于以下部署策略：

- 继续沿用 Docker Compose 管理 `PocketBase` 与 `app`
- 虚拟机上不直接暴露 `PocketBase`
- 通过 `Nginx` 对外提供 `80/443`
- 使用 `systemd` 托管 `docker compose up -d`

## 2. 目录结构建议

```text
/opt/static-content-service
  ├── .env
  ├── deploy/vm-compose/
  ├── docker-compose.yml
  ├── docker/
  ├── pocketbase/data/
  ├── pocketbase/public/
  └── workspace/
```

## 3. 推荐 `.env`

虚拟机上建议使用真实生产值，例如：

```env
PB_VERSION=0.22.0
PB_HOST=0.0.0.0
PB_PORT=8090
PB_BASE_URL=http://pocketbase:8090
PB_ADMIN_EMAIL=your-admin@example.com
PB_ADMIN_PASSWORD=replace-with-strong-ascii-password
PB_DATA_DIR=./pocketbase/data
PB_PUBLIC_DIR=./pocketbase/public
WORKSPACE_DIR=./workspace
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8787
PUBLIC_BASE_URL=https://content.example.com
API_KEY_HEADER=x-shutong49-api-key
OWNER_SESSION_COOKIE_NAME=shutong49_owner_session
OWNER_SESSION_MAX_AGE_SECONDS=43200
```

注意：

- Compose 内部通讯仍使用 `PB_BASE_URL=http://pocketbase:8090`
- 宿主机映射通过 `docker-compose.prod.yml` 限制为 `127.0.0.1`
- 对外真实访问地址由 `PUBLIC_BASE_URL` 决定

## 4. 首次部署命令

```bash
cd /opt/static-content-service
cp .env.docker.example .env
vi .env
APP_ENV_FILE=.env docker compose --project-directory . -p static-content-service --env-file .env build
APP_ENV_FILE=.env docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d
```

注意：

- `docker-compose.prod.yml` 位于 `deploy/vm-compose/` 子目录下，执行时必须显式带上 `--project-directory .`，否则 `./pocketbase/data`、`./workspace`、`./.env` 这类相对路径可能会错误地按 `deploy/vm-compose/` 解析。
- VM 上统一只维护仓库根目录的 `.env`，不要再额外创建 `deploy/vm-compose/.env`，避免 Compose 与容器挂载读取到两份不同配置。

## 5. Nginx 挂载

1. 把 `deploy/vm-compose/nginx.conf.example` 复制到：

```bash
sudo cp deploy/vm-compose/nginx.conf.example /etc/nginx/sites-available/static-content-service
```

2. 修改 `server_name` 为真实域名。

3. 建立软链接并重载：

```bash
sudo ln -s /etc/nginx/sites-available/static-content-service /etc/nginx/sites-enabled/static-content-service
sudo nginx -t
sudo systemctl reload nginx
```

## 6. HTTPS

域名解析完成后执行：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d content.example.com
```

## 7. systemd 托管 Compose

1. 复制模板：

```bash
sudo cp deploy/vm-compose/static-content-compose.service.example /etc/systemd/system/static-content-compose.service
```

2. 重新加载并启用：

```bash
sudo systemctl daemon-reload
sudo systemctl enable static-content-compose
sudo systemctl start static-content-compose
```

3. 查看状态：

```bash
sudo systemctl status static-content-compose
```

## 8. 推荐检查项

部署完成后至少检查：

1. `curl http://127.0.0.1:8090/api/health`
2. `curl http://127.0.0.1:8787/api/health`
3. `curl -I http://127.0.0.1`
4. 浏览器访问 `https://content.example.com/web/auth/login`
5. 浏览器访问 `https://content.example.com/web/public/list`

## 9. 当前模板定位

这套模板的目标不是一步到位覆盖高可用，而是提供一套：

- 可重复
- 可迁移
- 可直接验收
- 与你当前本机 Docker 形态一致

的虚拟机上线基线。
