---
task_id: "T2+T3"
title: "业务壳项目骨架与 API Key 身份中间层"
status: "completed"
review_status: "owner-review-ready"
updated_at: "2026-04-17"
worktree: "/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base"
---

# T2 + T3 完成记录

## 1. task 目标

- 提供可启动的业务壳最小骨架。
- 完成配置加载、健康检查与路由分组。
- 建立 PocketBase 访问封装。
- 完成 API Key 到 `users_api` 的身份映射。
- 为后续受保护接口提供统一认证上下文。

## 2. 实际改动范围

主要实现文件：

- [package.json](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/package.json)
- [src/config.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/config.js)
- [src/app.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/app.js)
- [src/server.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/server.js)
- [src/pocketbase/client.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/pocketbase/client.js)
- [src/auth/api-key-auth.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/auth/api-key-auth.js)
- [tests/config.test.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/config.test.js)
- [tests/auth.test.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/auth.test.js)
- [tests/health.test.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/health.test.js)
- [scripts/start_service.sh](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/scripts/start_service.sh)
- [scripts/verify_t23.sh](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/scripts/verify_t23.sh)
- [README.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/README.md)
- [.env.example](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/.env.example)

## 3. 已完成内容

- 已建立最小 Node.js 业务壳，无额外框架依赖。
- 已支持 `PB_BASE_URL`、`PB_ADMIN_EMAIL`、`PB_ADMIN_PASSWORD`、`SERVICE_PORT`、`API_KEY_HEADER` 等配置项。
- 已暴露健康检查接口 `GET /api/health`。
- 已固定三类路由分组：
  - `/api/write/*`
  - `/api/query/*`
  - `/api/public/*`
- 已实现 API Key 中间件。
- 已实现通过 PocketBase 管理员身份查询 `users_api`，建立业务认证上下文。
- 已创建并验证 PocketBase 管理员账号 `249328598@qq.com` 供业务壳访问底座使用。

## 4. 验证证据

自动化验证：

- `npm test` 通过，当前为 `9/9` 通过。

运行时验证：

- `GET http://127.0.0.1:8787/api/health` 返回成功，并联通 PocketBase 健康状态。
- 未携带 API Key 访问 `GET /api/write/ping` 返回 `401`。
- 携带 `x-shutong49-api-key: t1_verify_api_key_0001` 访问 `GET /api/write/ping` 返回成功，认证上下文识别到：
  - `userId = 2eith07vaxt5jl5`
  - `displayName = T1 Verify User`

可复核文件：

- [scripts/verify_t23.sh](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/scripts/verify_t23.sh)
- [tests/auth.test.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/auth.test.js)
- [tests/health.test.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/health.test.js)

## 5. 问题定位与修复记录

- 初版业务壳曾直接匿名查询 `users_api`，运行时被 PocketBase 返回 `403`。
- 已修正为：业务壳先使用管理员账号登录 PocketBase，再带管理员 token 查询 `users_api`。
- 服务入口的 worktree 根路径解析曾指向错误目录，已修正为基于 `fileURLToPath` 的标准路径解析。

## 6. 已知风险与遗留问题

- 当前业务壳只完成骨架与认证上下文，尚未进入统一内容写入逻辑。
- `.env` 中当前为本地开发阶段凭据，后续部署前需要替换为正式环境凭据。
- 认证通过不代表写入链路已可用，T4 仍需处理统一内容写入与 `bool=false` 风险。

## 7. owner 审查关注点

- 是否认可当前业务壳保持“薄服务”定位，而不是把更多规则下沉到 PocketBase。
- 是否认可 `users_api` 只能由业务壳通过管理员身份读取，不对前台或调用方暴露底座访问能力。
- 是否认可当前以最小 Node.js 骨架推进 MVP，而非提前引入更重框架。
- 是否允许在进入 T4 前，把 owner 审查文档作为后续 task 的固定交付物继续维护。

## 8. 结论

- `T2 + T3` 已达到进入 `T4` 的条件。
- 下一 task 应聚焦统一 `Content` 模型下的文件与 HTML 写入，不应扩展额外后台管理能力。
