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

执行：

```bash
node --test
```

当前 fresh 验证结果：`51/51` 通过。

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

- owner 网页层当前依赖 API Key 头，适合内测和联调，不是最终浏览器会话方案
- 启动脚本当前提供的是本地预检与失败提示，不是完整守护进程管理方案
- 冷启动当前已具备仓库内 dry-run 验证，但仍依赖联网下载 PocketBase 与 PocketBase 后台人工初始化

## PocketBase 注意事项

- `contents.is_shared` 与 `share_links.is_revoked` 在 PocketBase 中必须保持 `required=false`。
- 真实联调已验证：若把这两个布尔字段设为 `required=true`，当业务壳写入 `false` 时，PocketBase 会返回 `400 validation_required`。
- 若你使用全新数据目录重新初始化环境，应确保迁移后的这两个字段不是 required。
