# 静态网页服务-文件管理

本仓库当前已完成 `T1` 到 `T9` 的 MVP 主链路实现，固定采用 `PocketBase + 业务壳服务 + 对外访问网页层` 三层结构。

当前能力包括：

- API Key 鉴权后的 HTML 写入与文件写入
- owner-scoped 的列表、搜索、详情查询
- 面向公开访客的公开列表、公开搜索、公开详情访问
- 分享链接创建、public hash 访问、网页层渲染
- 删除内容与撤销分享
- 文件通过 public/content 与 public/share 的真实二进制下载

## 文档结构

完整入口索引见 [docs/README.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/README.md)。

- `docs/Operations/`：当前运行、同步、重启、排障、发布文档。
- `docs/core-business-flow.md`：当前业务链路和源码入口。
- `docs/P5-String-Resource-Access/02-after-execution/`：当前内容对象边界和 P5 验收清单。
- `docs/archive/`：历史阶段材料、早期规划、开源调研和长篇展示稿。

## 代码结构

- `pb_migrations/`：PocketBase 集合迁移定义
- `scripts/`：PocketBase 安装、启动与阶段性验证脚本
- `src/`：业务壳服务与网页层源码
- `tests/`：Node 原生测试

## 运行关系

本项目实际运行时包含三层：

1. `PocketBase`：提供用户、内容、分享记录的底座存储。
2. `业务壳服务`：提供写入、查询、分享、删除、撤销等 Open API，并承接 API Key 身份映射。
3. `网页层`：直接由业务壳服务进程输出 HTML 页面，不单独起前端工程，但逻辑边界上仍只读消费业务壳接口。

对外访问时：

- API 调用方访问 `/api/*`
- 浏览器页面访问 `/web/*`
- 二者都不能直连 PocketBase

## 环境要求

- Node.js `>=20`
- 可执行的 PocketBase 官方二进制

## 配置说明

先复制 `.env.example` 到 `.env`。

关键配置：

- `PB_BASE_URL`：业务壳访问 PocketBase 的地址
- `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD`：业务壳读取受保护集合时使用的管理员账号
- `WORKSPACE_DIR`：业务壳文件落盘目录
- `SERVICE_HOST` / `SERVICE_PORT`：业务壳监听地址
- `PUBLIC_BASE_URL`：可选，对外访问域名；未设置时默认使用 `SERVICE_HOST:SERVICE_PORT`
- `API_KEY_HEADER`：业务壳读取 API Key 的头名，默认 `x-shutong49-api-key`

## 本地启动步骤

### 1. 安装 PocketBase

```bash
./scripts/install_pocketbase.sh
```

### 2. 启动 PocketBase

```bash
bash ./scripts/preflight.sh pocketbase
./scripts/start_pocketbase.sh
```

首次启动后，在 PocketBase 管理后台完成：

1. 创建管理员账号
2. 确认迁移已初始化 `users_api`、`contents`、`share_links`
3. 在 `users_api` 中插入一条 API Key 样例记录。历史样例可参考 [mvp-sample-data.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P1-MVP/02-after-execution/mvp-sample-data.md)。

### 3. 启动业务壳服务与网页层

```bash
bash ./scripts/preflight.sh service
npm install
npm start
```

或使用：

```bash
./scripts/start_service.sh
```

当前预检会在真正启动前检查：

- `.env` 是否存在
- `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 是否已填写
- PocketBase 二进制是否已安装
- `PB_PORT` / `SERVICE_PORT` 是否被占用
- PocketBase `/api/health` 是否可达
- 数据目录、公开目录、工作目录是否可创建

服务默认监听：

- 业务壳 API: `http://127.0.0.1:8787/api/*`
- 网页层: `http://127.0.0.1:8787/web/*`

## 自动化验证

基础自动化：

执行：

```bash
node --test
```

当前主测试集覆盖内容写入、Markdown 渲染、访问控制、owner/public 页面与健康检查等核心链路。

浏览器级关键回归：

```bash
npm run test:e2e
```

如需观察浏览器过程：

```bash
npm run test:e2e:headed
```

如果只想跑关键子集：

```bash
node --test tests/content.test.js
node --test tests/auth.test.js
node --test tests/health.test.js
```

如果要先做一次近空环境 dry-run，再进入人工冷启动步骤，可执行：

```bash
bash ./scripts/verify_coldstart_dry_run.sh
```

## 十条主流程

当前 MVP 至少覆盖以下 10 条主流程：

1. HTML 写入
2. 文件写入
3. owner 列表
4. owner 搜索
5. owner 详情
6. public 列表
7. public 搜索
8. 分享访问 HTML
9. 分享下载文件
10. 删除内容与撤销分享

历史 MVP 与稳定化验收证据已归档到 `docs/archive/phases/`，日常开发以当前自动化测试和 `docs/Operations/` 中的验收命令为准。

## 常用接口

写接口：

- `POST /api/write/content`
- `POST /api/write/html`
- `POST /api/write/file`
- `POST /api/write/share`
- `POST /api/write/share/revoke`
- `POST /api/write/delete`

其中 `POST /api/write/content`、`POST /api/write/html`、`POST /api/write/file`、`POST /api/write/update` 支持以下访问控制字段：

- `accessMode`: `public | password`（默认 `public`）
- `accessPassword`: 明文输入，服务端只保存 hash
- `accessHint`: 可选提示

查询接口：

- `GET /api/query/content/:contentId`
- `GET /api/query/list`
- `GET /api/query/search`
- `GET /api/query/detail/:contentId`

public 接口：

- `GET /api/public/content/:contentHash`
- `GET /api/public/share/:shareHash`
- `POST /api/public/content/:contentHash/password`
- `POST /api/public/share/:shareHash/password`

说明：

- 当内容访问模式为 `password` 且尚未验证时，`GET /api/public/*` 会返回 `401 public_password_required`。
- 通过 `POST /api/public/*/password` 校验成功后，会建立短期访问态（HttpOnly cookie），在有效期内可访问正文。

网页层：

- `GET /web/auth/login`
- `POST /web/auth/login`
- `POST /web/auth/logout`
- `GET /web/credential`
- `GET /web/list`
- `GET /web/search`
- `GET /web/detail/:contentId`
- `GET /web/public/list`
- `GET /web/public/search`
- `GET /web/public/content/:contentHash`
- `GET /web/public/share/:shareHash`
- `POST /web/public/content/:contentHash/password`
- `POST /web/public/share/:shareHash/password`

说明：

- 公开页访问命中 `password` 模式时会展示密码输入页。
- 密码错误会在密码输入框下方提示红色错误文本，并可继续重试。

## 手工演示建议

1. 先通过 `/api/write/content` 写入一条 HTML 或 Markdown 内容，再通过 `/api/write/file` 写入一条文件内容。
2. 创建分享链接。
3. 打开 `/web/list`、`/web/search`、`/web/detail/:contentId`。
4. 打开 `/web/public/list`、`/web/public/search?q=关键词`，再进入公开详情页。
5. 验证 `/api/public/content/:contentHash` 或 `/api/public/share/:shareHash` 返回真实文件下载而不是 JSON。
6. 执行 `/api/write/share/revoke` 和 `/api/write/delete`，观察 public 状态变化。

## P5 第一阶段演示脚本

如果你要演示本轮新增的 `content` 语义写入、查询、列表增强与 `rich_text` 公开详情复用，可以按下面顺序运行：

```bash
./scripts/p5_demo_step1_write_content.sh
./scripts/p5_demo_step2_query_and_share.sh
./scripts/p5_demo_step3_print_access_info.sh
./scripts/p5_demo_step4_cleanup_content.sh
```

可选环境变量：

- `P5_DEMO_API_KEY`
- `P5_DEMO_API_HEADER`
- `P5_DEMO_SERVICE_BASE_URL`
- `P5_DEMO_OWNER_WEB_BASE_URL`
- `P5_DEMO_PUBLIC_WEB_BASE_URL`
- `P5_DEMO_TITLE`
- `P5_DEMO_BODY`

这些脚本会在 `.demo-state/p5_content_demo.env` 中保存中间状态，便于分步演示和最终清理。

## Docker Desktop 本机部署

如果你当前还没有 Linux 虚拟机，但已经安装了 `Docker Desktop`，建议先走本机容器化部署。

准备：

```bash
cp .env.docker.example .env
APP_ENV_FILE=.env.docker.example docker compose --project-directory . --env-file .env.docker.example build
APP_ENV_FILE=.env.docker.example docker compose --project-directory . --env-file .env.docker.example up -d
```

首次启动后：

1. 打开 `http://127.0.0.1:8090/_/` 创建 PocketBase 管理员。
2. 保持 `.env` 中的 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 与后台一致。
3. 在 `users_api` 中插入一条可用的 API Key 记录。
4. 访问 `http://127.0.0.1:8787/web/auth/login` 和 `http://127.0.0.1:8787/web/public/list` 做首轮验证。

常用命令：

```bash
APP_ENV_FILE=.env.docker.example docker compose --project-directory . --env-file .env.docker.example ps
APP_ENV_FILE=.env.docker.example docker compose --project-directory . --env-file .env.docker.example logs -f pocketbase
APP_ENV_FILE=.env.docker.example docker compose --project-directory . --env-file .env.docker.example logs -f app
APP_ENV_FILE=.env.docker.example docker compose --project-directory . --env-file .env.docker.example down
```

说明：如果使用 `deploy/vm-compose/docker-compose.prod.yml` 这类位于子目录的 compose 文件，务必显式添加 `--project-directory .`，避免 `./.env`、`./workspace`、`./pocketbase/data` 等相对路径被错误解析到子目录。

日常 Docker/VM 维护优先看 [docs/Operations](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations)。历史部署方案和旧 VM 验收记录已归档到 `docs/archive/phases/P4-Deployment/`。

## MiniPC 部署建议

在 MiniPC 上保持同样三层关系：

1. PocketBase 作为固定底座运行
2. Node 业务壳服务运行 `npm start`
3. 反向代理把外部流量转发到业务壳服务

部署注意点：

- `PUBLIC_BASE_URL` 应设置为最终域名或反向代理地址
- `WORKSPACE_DIR`、`pocketbase/data/`、`pocketbase/public/` 都要持久化
- 先启动 PocketBase，再启动业务壳服务
- 升级或迁移前先备份 PocketBase 数据目录和业务壳工作目录

如果 miniPC 使用 1Panel，优先使用：

- [docker-compose.1panel.yml](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docker-compose.1panel.yml)
- [.env.1panel.example](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.env.1panel.example)
- [1panel-minipc-deployment.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/1panel-minipc-deployment.md)

1Panel 反向代理只需要指向 `http://127.0.0.1:8787`。PocketBase 的 `8090` 默认只绑定宿主机本机，不建议公网暴露。

## 当前已知取舍

- owner 网页层当前已支持基于 API Key 登录后签发 HttpOnly session cookie 的浏览器会话；Open API 仍继续使用请求头鉴权
- owner 前端当前覆盖列表、搜索、详情、单条分享/撤销分享/删除、富文本更新、批量分享/撤销/删除、凭据页与退出
- 启动脚本当前提供的是本地预检与失败提示，不是完整守护进程管理方案
- E2E 默认使用 Playwright 自起的 `8788` 临时服务实例，不复用你手工运行在 `8787` 的服务
- 冷启动当前已具备仓库内 dry-run 验证，但仍依赖联网下载 PocketBase 与 PocketBase 后台人工初始化

## PocketBase 注意事项

- `contents.is_shared` 与 `share_links.is_revoked` 在 PocketBase 中必须保持 `required=false`。
- 真实联调已验证：若把这两个布尔字段设为 `required=true`，当业务壳写入 `false` 时，PocketBase 会返回 `400 validation_required`。
- 若你使用全新数据目录重新初始化环境，应确保迁移后的这两个字段不是 required。
