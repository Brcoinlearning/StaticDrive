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


- `docs/P1-MVP/01-before-execution/`：P1 开始前的正式产物，如需求、技术选型、架构、任务拆解、测试契约
- `docs/P1-MVP/02-after-execution/`：P1 执行后的联调、验收、演示与结果文档
- `docs/P2-Stabilization/01-before-execution/`：P2 稳定化阶段开始前的范围、架构、任务与路线图文档
- `docs/P2-Stabilization/02-after-execution/`：P2 执行后的验证、诊断、冷启动与收口文档
- `docs/P3-Owner-Frontend/01-before-execution/`：P3 owner 产品化前端的准备文档
- `docs/_reference/`：补充说明与参考材料

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
3. 在 `users_api` 中插入一条 API Key 样例记录，参考 [mvp-sample-data.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P1-MVP/02-after-execution/mvp-sample-data.md)

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

当前 Phase 3 收口后的验证结果：`70/70` 通过。

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

对应的自动化证据见 [mvp-integration-verification.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P1-MVP/02-after-execution/mvp-integration-verification.md)。

Phase 2 的稳定化证据见：

- [p2-t2-startup-preflight-verification.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P2-Stabilization/02-after-execution/p2-t2-startup-preflight-verification.md)
- [p2-t5-runtime-diagnostics-verification.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P2-Stabilization/02-after-execution/p2-t5-runtime-diagnostics-verification.md)
- [p2-t6-cold-start-reproducibility-verification.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P2-Stabilization/02-after-execution/p2-t6-cold-start-reproducibility-verification.md)

## 常用接口

写接口：

- `POST /api/write/html`
- `POST /api/write/file`
- `POST /api/write/share`
- `POST /api/write/share/revoke`
- `POST /api/write/delete`

查询接口：

- `GET /api/query/list`
- `GET /api/query/search`
- `GET /api/query/detail/:contentId`

public 接口：

- `GET /api/public/content/:contentHash`
- `GET /api/public/share/:shareHash`

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

## 手工演示建议

1. 先按 [mvp-sample-data.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P1-MVP/02-after-execution/mvp-sample-data.md) 写入一条 HTML 内容和一条文件内容。
2. 创建分享链接。
3. 打开 `/web/list`、`/web/search`、`/web/detail/:contentId`。
4. 打开 `/web/public/list`、`/web/public/search?q=关键词`，再进入公开详情页。
5. 验证 `/api/public/content/:contentHash` 或 `/api/public/share/:shareHash` 返回真实文件下载而不是 JSON。
6. 执行 `/api/write/share/revoke` 和 `/api/write/delete`，观察 public 状态变化。

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

更完整的说明见 [vm-and-docker-deployment-guide.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/01-before-execution/vm-and-docker-deployment-guide.md)。

首次启动检查单见 [docker-first-start-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/docker-first-start-checklist.md)。

虚拟机上的 `Nginx + HTTPS + systemd/compose` 模板见 [vm-compose-production-template.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-compose-production-template.md)。

Docker 六项核心能力验收见 [docker-six-capability-acceptance.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/docker-six-capability-acceptance.md)。

Docker 部署收口记录见 [p4-docker-acceptance-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/p4-docker-acceptance-closeout.md)。

虚拟机上线最短执行清单见 [vm-go-live-short-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-go-live-short-checklist.md)。

如果你需要继续维护已经落地的 `ubu2404` 机器，而不是从零部署新 VM，直接看 [vm-ubu2404-ip-http-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-ubu2404-ip-http-closeout.md)。这份文档记录了当前真实运行状态、运维命令、配置修改方式，以及后续从 IP/HTTP 升级到域名/HTTPS 的顺序。

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
