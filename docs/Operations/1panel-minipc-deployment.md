# 1Panel MiniPC Deployment

本文档用于把本项目部署到 miniPC 上的 1Panel 环境。目标运行形态仍然是：

1. `pocketbase` 容器负责底座数据库和 collection 迁移。
2. `app` 容器负责业务 API 与网页层。
3. 1Panel 网站反向代理只对外暴露 `app:8787`。

## 1. 推荐目录

在 miniPC 上建议固定一个项目目录，例如：

```bash
/opt/static-content-service
```

项目目录中至少需要保留：

- `.env`
- `docker-compose.1panel.yml`
- `docker/`
- `pb_migrations/`
- `scripts/`
- `src/`
- `package.json`
- `package-lock.json`

运行后需要持久化：

- `pocketbase/data/`
- `pocketbase/public/`
- `workspace/`

## 2. 环境文件

先复制 1Panel 示例配置：

```bash
cp .env.1panel.example .env
```

然后至少修改：

```env
PB_ADMIN_EMAIL=你的 PocketBase 管理员邮箱
PB_ADMIN_PASSWORD=你的 PocketBase 管理员密码
PUBLIC_BASE_URL=https://你的域名
```

容器部署时保持：

```env
PB_HOST=0.0.0.0
PB_BASE_URL=http://pocketbase:8090
SERVICE_HOST=0.0.0.0
```

不要把 `PB_BASE_URL` 写成 `http://127.0.0.1:8090`，因为 app 容器里的 `127.0.0.1` 指向 app 容器自己，不是 PocketBase 容器。

## 3. 1Panel Compose

使用仓库根目录的：

```bash
docker-compose.1panel.yml
```

这份 compose 已经固定项目名：

```yaml
name: static-content-service
```

因此不会受中文目录或 1Panel 工作目录名称影响。

默认端口绑定：

- `127.0.0.1:8787:8787`：给 1Panel 反向代理访问
- `127.0.0.1:8090:8090`：仅宿主机本机访问 PocketBase

不建议把 `8090` 暴露到公网。

## 4. 首次启动

在 1Panel 的容器编排中导入或创建 compose 后启动。

如果在终端验证，可使用：

```bash
cd /opt/static-content-service
docker compose -p static-content-service -f docker-compose.1panel.yml up -d --build
docker compose -p static-content-service -f docker-compose.1panel.yml ps
```

首次启动后：

1. 打开 `http://127.0.0.1:8090/_/` 或通过内网/隧道访问 PocketBase 后台。
2. 创建 PocketBase 管理员。
3. 确保 `.env` 中的 `PB_ADMIN_EMAIL` 和 `PB_ADMIN_PASSWORD` 与后台一致。
4. 在 `users_api` 中创建至少一条可用 API Key。
5. 重启 `app` 容器。

## 5. 1Panel 反向代理

在 1Panel 网站中创建反向代理站点：

- 代理地址：`http://127.0.0.1:8787`
- 域名：与 `.env` 中 `PUBLIC_BASE_URL` 一致
- HTTPS：建议启用

Nginx/OpenResty 等反代层建议保留：

```nginx
client_max_body_size 100m;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

## 6. 验收

启动后至少验证：

```bash
curl http://127.0.0.1:8090/api/health
curl http://127.0.0.1:8787/api/health
curl https://你的域名/api/health
```

浏览器再检查：

- `https://你的域名/web/auth/login`
- `https://你的域名/web/list`
- `https://你的域名/web/public/list`

涉及 Markdown 或公式渲染时，优先用 raw API 验证：

1. `POST /api/write/content` 写入 `bodyFormat: markdown`
2. `GET /api/query/content/:id` 检查 `bodyFormat`、原始 `body` 和渲染后 HTML
3. 再打开网页层确认渲染

## 7. 备份

1Panel 备份任务至少覆盖：

- `/opt/static-content-service/pocketbase/data/`
- `/opt/static-content-service/workspace/`
- `/opt/static-content-service/.env`

升级、迁移或替换磁盘前必须先备份。恢复时要保证 `pocketbase/data/` 和 `workspace/` 来自同一时间点，否则可能出现数据库记录存在但文件已丢失。

## 8. 升级

只改业务壳代码时：

```bash
cd /opt/static-content-service
docker compose -p static-content-service -f docker-compose.1panel.yml up -d --build app
curl http://127.0.0.1:8787/api/health
```

改了 `pb_migrations/`、PocketBase 镜像、挂载目录或 `.env` 底座配置时：

1. 先备份 `pocketbase/data/`、`workspace/`、`.env`
2. 重建并启动 `pocketbase` 与 `app`
3. 检查 PocketBase 真实 collection schema
4. 跑 API 级复测

## 9. 安全收口

- `.env` 不提交到仓库。
- 示例文件只保留占位符，不放真实管理员密码。
- 对公网只开放 80/443。
- PocketBase 后台不要直接公网暴露。
- 部署前轮换曾经出现在示例文件、聊天记录或日志里的管理员密码。
