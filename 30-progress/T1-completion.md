---
task_id: "T1"
title: "搭建 PocketBase 底座与基础数据模型"
status: "completed"
review_status: "owner-review-ready"
updated_at: "2026-04-17"
worktree: "/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base"
---

# T1 完成记录

## 1. task 目标

- 获取并启动 `PocketBase` 官方运行体。
- 初始化 `users_api`、`contents`、`share_links` 三个基础集合。
- 明确 `pocketbase/data`、`pocketbase/public`、`workspace` 的目录映射。
- 完成一次最小化连通性验证，证明后续业务壳可以接入该底座。

## 2. 实际改动范围

代码与脚本位于 T1 worktree：

- [README.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/README.md)
- [.env.example](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/.env.example)
- [docs/t1-storage-mapping.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/docs/t1-storage-mapping.md)
- [scripts/install_pocketbase.sh](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/scripts/install_pocketbase.sh)
- [scripts/start_pocketbase.sh](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/scripts/start_pocketbase.sh)
- [scripts/verify_t1.sh](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/scripts/verify_t1.sh)
- [pb_migrations/1700000000_create_users.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/pb_migrations/1700000000_create_users.js)
- [pb_migrations/1700000001_create_contents.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/pb_migrations/1700000001_create_contents.js)
- [pb_migrations/1700000002_create_share_links.js](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/pb_migrations/1700000002_create_share_links.js)

## 3. 已完成内容

- 已固定 `PocketBase` 为唯一底座，未引入替代底座。
- 已提供 macOS / Linux 可复用的底座安装与启动脚本。
- 已建立 `users_api`、`contents`、`share_links` 三个基础集合与索引。
- 已明确 `workspace/` 作为后续业务壳的本地工作目录根路径。
- 已保持 `Content` 作为文件与 HTML 的统一主模型。

## 4. 验证证据

已实际完成的验证包括：

- `PocketBase` 官方 macOS arm64 运行体已下载并解压到 `pocketbase/bin/pocketbase`。
- `GET http://127.0.0.1:8090/api/health` 返回成功。
- 本地 SQLite 集合存在：`users_api`、`contents`、`share_links`。
- 已完成最小写入验证：
  - `users_api` 记录存在，示例 API Key 为 `t1_verify_api_key_0001`
  - `contents` 记录可创建并查询
  - `share_links` 记录可创建并按 `content_id` 查询

可复核文件：

- [scripts/verify_t1.sh](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/scripts/verify_t1.sh)
- [docs/t1-storage-mapping.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/docs/t1-storage-mapping.md)

## 5. 已知风险与遗留问题

- `contents.is_shared` 与 `share_links.is_revoked` 的 `bool` 字段在 API 写入 `false` 时曾出现 `validation_required` 风险。
- 该风险不阻断 T1 底座完成，但会影响 T4、T5、T8 的后续实现，应在进入统一写入与分享逻辑前优先处理。
- 当前运行验证主要在 macOS 上完成，Linux MiniPC 仍需后续补跑。

## 6. owner 审查关注点

- 是否认可 `PocketBase + 三集合` 作为固定底座起点。
- 是否认可 `workspace/` 与 `pocketbase/data/` 的职责划分。
- 是否接受 `bool=false` 写入风险在 T4 前集中修复，而不是在 T1 扩展处理。
- 是否接受当前阶段以 macOS 完成底座验证，Linux 验证延后到部署前。

## 7. 结论

- `T1` 已达到进入 `T2 + T3` 的条件。
- 后续 task 不应替换 `PocketBase`，也不应绕过统一 `Content` 模型。
