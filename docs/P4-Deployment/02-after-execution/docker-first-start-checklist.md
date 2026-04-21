# Docker First Start Checklist

本文档用于在本机 `Docker Desktop` 场景下完成首次启动、首次初始化和首轮验收，确保当前容器化部署不是“容器在跑”，而是“服务真的可用”。

## 1. 前提条件

需要满足：

- `Docker Desktop` 已启动
- 仓库根目录下存在以下文件：
  - `docker-compose.yml`
  - `docker/app.Dockerfile`
  - `docker/pocketbase.Dockerfile`
  - `.env.docker.example`

## 2. 首次启动命令

在仓库根目录执行：

```bash
APP_ENV_FILE=.env.docker.example docker compose -p static-content-service --env-file .env.docker.example build
APP_ENV_FILE=.env.docker.example docker compose -p static-content-service --env-file .env.docker.example up -d
APP_ENV_FILE=.env.docker.example docker compose -p static-content-service --env-file .env.docker.example ps
```

预期结果：

- `pocketbase` 容器处于 `healthy`
- `app` 容器处于 `healthy`

## 3. 宿主机健康检查

执行：

```bash
curl -fsS http://127.0.0.1:8090/api/health
curl -fsS http://127.0.0.1:8787/api/health
```

预期结果：

- `8090` 返回 PocketBase 健康 JSON
- `8787` 返回 business shell 健康 JSON

## 4. PocketBase 后台初始化

浏览器打开：

- `http://127.0.0.1:8090/_/`

首次必须完成：

1. 创建管理员账号。
2. 确认集合已经存在：
   - `users_api`
   - `contents`
   - `share_links`
3. 在 `users_api` 中插入一条 API Key 记录。

建议示例：

- `name`: `Docker Verify User`
- `display_name`: `Docker Verify`
- `api_key`: `docker_verify_api_key_0001`

## 5. 回写管理员账号到 Docker 环境文件

编辑：

- `.env.docker.example`

至少保证这两项与刚创建的管理员一致：

```env
PB_ADMIN_EMAIL=your-admin@example.com
PB_ADMIN_PASSWORD=your-password
```

修改后执行：

```bash
APP_ENV_FILE=.env.docker.example docker compose -p static-content-service --env-file .env.docker.example restart app
```

## 6. 页面访问检查

浏览器打开：

- `http://127.0.0.1:8787/web/auth/login`
- `http://127.0.0.1:8787/web/public/list`

预期结果：

- owner 登录页可以打开
- public 列表页可以打开
- 如果还没有公开内容，public 列表允许为空，但页面必须正常渲染，不应是 500

## 7. 六个核心能力的首轮验收

### 7.1 Open API 保存文件

后续可用你已有的 PDF 或其它本地文件，调用：

- `POST /api/write/file`

### 7.2 Open API 保存富文本

调用：

- `POST /api/write/html`

### 7.3 公开列表页可发现内容

浏览器访问：

- `GET /web/public/list`

### 7.4 公开搜索页可搜索内容

浏览器访问：

- `GET /web/public/search?q=关键词`

### 7.5 公开详情页可查看内容

浏览器访问：

- `GET /web/public/content/:contentHash`

### 7.6 下载链路真实可用

浏览器访问或命令行访问：

- `GET /api/public/content/:contentHash`
- `GET /api/public/share/:shareHash`

预期结果：

- 文件型内容必须返回真实文件下载
- 富文本型内容必须返回真实 HTML/rich text 内容

## 8. 常用排查命令

查看状态：

```bash
APP_ENV_FILE=.env.docker.example docker compose -p static-content-service --env-file .env.docker.example ps
```

查看 PocketBase 日志：

```bash
APP_ENV_FILE=.env.docker.example docker compose -p static-content-service --env-file .env.docker.example logs -f pocketbase
```

查看 app 日志：

```bash
APP_ENV_FILE=.env.docker.example docker compose -p static-content-service --env-file .env.docker.example logs -f app
```

停止容器：

```bash
APP_ENV_FILE=.env.docker.example docker compose -p static-content-service --env-file .env.docker.example down
```

## 9. 当前已验证结论

本仓库当前已经完成的真实验证包括：

1. Docker Desktop 可连接。
2. 两个镜像可以成功构建。
3. 两个容器可以成功启动。
4. `http://127.0.0.1:8090/api/health` 可达。
5. `http://127.0.0.1:8787/api/health` 可达。
6. 当前 `app` 与 `pocketbase` 容器均可进入 `healthy`。

这意味着：当前阶段 Docker 化部署链路已成立，可以继续推进首次内容写入和业务验收。
