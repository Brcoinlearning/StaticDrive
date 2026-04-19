---
task_id: "T8"
title: "删除与撤销分享能力"
status: "completed"
review_status: "owner-review-ready"
updated_at: "2026-04-18"
worktree: "/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base"
review_mode: "manual-local-review-due-to-subagent-block"
---

# T8 完成记录

## 1. task 目标

- 实现内容删除。
- 实现分享链接撤销。
- 确保只有内容拥有者可执行操作。
- 删除内容时同时处理元数据、分享记录与物理文件之间的一致性。
- 撤销分享后，原分享访问入口必须立即失效。

## 2. 实际改动范围

主要实现文件：

- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/app.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/content/service.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/pocketbase/client.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/content.test.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/auth.test.js`

## 3. 已完成内容

- 已实现 `POST /api/write/share/revoke`，按 owner 范围撤销当前内容的活动分享链接。
- 已实现 `POST /api/write/delete`，按 owner 范围删除指定内容。
- 撤销分享时会同步把内容 `is_shared` 置为 `false`，保证 `share_hash` 与 `content_hash` 的 public 访问入口都立刻失效。
- 删除内容时会先收集该内容的分享记录，将未撤销分享统一置为 `is_revoked=true`，再删除物理文件，最后删除内容元数据记录。
- 文件写入失败回滚处已统一改为“若存在则删除”，避免依赖调用方提供特定文件系统方法实现。
- 已为 PocketBase client 增加分享列表查询、分享记录更新、内容删除三类基础操作，保持删除与撤销逻辑仍收敛在业务壳层。
- 写接口补齐了 `403/404` 失败流响应，避免删除与撤销错误被统一吞成 `500`。

## 4. 接口摘要

- `POST /api/write/share/revoke`
- `POST /api/write/delete`

返回约定：

- 撤销分享返回 `contentId`、`shareId`、`shareHash`、`revoked=true`
- 删除内容返回 `contentId`、`deleted=true`、`revokedShareCount`、`removedFile`

行为约定：

- 非 owner 删除或撤销一律返回 `403`
- 无活动分享可撤销时返回 `404`
- 撤销后通过原 `share_hash` 访问返回 `410`
- 删除后物理文件必须消失，内容记录必须删除，原 public 入口不再可解析

## 5. 验证证据

已实际执行：

- `node --test tests/content.test.js`
- `node --test tests/auth.test.js`
- `node --test`

验证结果：

- `tests/content.test.js`：`25/25` 通过。
- `tests/auth.test.js`：`10/10` 通过。
- 全量 `node --test`：`41/41` 通过。

已覆盖的 T8 关键场景：

- owner 撤销分享成功。
- 撤销后原分享链接立即返回 `410`。
- owner 删除文件内容成功，并同步删除物理文件。
- 删除时未撤销分享会被批量置为 revoked。
- 跨用户删除被拒绝。
- PocketBase 删除与分享更新请求构造正确。

## 6. 审查结果

- spec review：PASS（本地人工审查）
- code quality review：PASS（本地人工审查）

说明：

- 按契约本应使用独立 fresh reviewer subagent。
- 当前平台在本项目上下文中仍无法稳定完成真实 reviewer 子代理调用，因此继续采用本地人工双重审查并显式记录。
- 本记录不伪装为独立 subagent review。

## 7. 残留问题与后续关注点

- 当前删除流程在“物理文件已删但 PocketBase 删除失败”场景下只能返回一致性错误，无法自动恢复原文件；这是单机 MVP 下可接受的显式失败方式，`T9` 可在部署说明中补充运维处置建议。
- 当前删除接口以 `contentId` 为输入，适合 owner 管理侧使用；若后续要提供更公开友好的后台入口，仍应维持业务壳 owner-scoped 约束，不应把 hash 直接当作删除主键。
- 当前撤销逻辑撤销的是该内容当前活动分享；若后续允许多活动分享并存，需要重新定义 sharing model，但这不在本轮 MVP 范围内。

## 8. 结论

- `T8` 已完成，MVP 主链路中的删除与撤销分享闭环已补齐。
- 下一步应进入 `T9`，统一完成集成验证、样例数据与部署说明。
