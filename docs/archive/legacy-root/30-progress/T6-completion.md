---
task_id: "T6"
title: "内容列表、搜索、详情查询接口"
status: "completed"
review_status: "owner-review-ready"
updated_at: "2026-04-18"
worktree: "/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base"
review_mode: "manual-local-review-due-to-subagent-block"
---

# T6 完成记录

## 1. task 目标

- 实现发布者可用的内容列表接口。
- 实现基础搜索接口。
- 实现内容详情查询接口。
- 确保查询默认限制在当前拥有者可见范围内。
- 继续建立在统一 `Content` 模型之上，保持排序、分页、搜索和详情访问边界一致。

## 2. 实际改动范围

主要实现文件：

- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/app.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/content/service.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/pocketbase/client.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/http/json.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/content.test.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/auth.test.js`

## 3. 已完成内容

- 已实现 `GET /api/query/list`，支持 owner-scoped 列表分页查询。
- 已实现 `GET /api/query/search?q=...`，按统一 `Content` 模型在 `title` 与 `original_filename` 上执行基础搜索。
- 已实现 `GET /api/query/detail/:contentId`，返回单条内容详情。
- 列表和搜索均通过统一 `pocketbaseClient.listContents` 访问 `contents` 集合，未拆分第二套查询主线。
- 详情查询会先读取记录，再基于 `owner_user_id` 执行归属校验；跨用户访问返回 `403`。
- 已统一查询响应结构中的对外字段命名，例如 `contentId`、`originalFilename`、`contentHash`、`accessUrl`。
- 已为查询接口补齐默认分页归一化逻辑，确保空列表和空搜索结果仍返回合法分页结构。

## 4. 接口摘要

- `GET /api/query/list?page=1&perPage=20`
- `GET /api/query/search?q=keyword&page=1&perPage=20`
- `GET /api/query/detail/:contentId`

返回约定：

- 列表与搜索返回 `items`、`page`、`perPage`、`totalItems`、`totalPages`
- 搜索额外返回归一化后的 `query`
- 详情返回统一内容摘要字段，并补充 `ownerUserId`、`storagePath`、`htmlContent`

## 5. 验证证据

已实际执行：

- `node --test tests/content.test.js`
- `node --test tests/auth.test.js`
- `node --test`

验证结果：

- `tests/content.test.js`：`12/12` 通过。
- `tests/auth.test.js`：`6/6` 通过。
- 全量 `node --test`：`24/24` 通过。

已覆盖的 T6 关键场景：

- owner-scoped 列表成功。
- owner-scoped 搜索成功。
- owner-scoped 详情成功。
- 空列表返回空数组。
- 搜索无命中时返回空结果且保留合法分页结构。
- 跨用户详情访问被拒绝。
- PocketBase 查询 URL 正确携带 owner filter 与 search filter。

## 6. 审查结果

- spec review：PASS（本地人工审查）
- code quality review：PASS（本地人工审查）

说明：

- 按契约本应使用独立 fresh reviewer subagent。
- 当前平台的 `spawn_agent` 在本项目上下文中仍不可稳定使用，因此未能完成真实独立 reviewer 调用。
- 本 task 延续 Owner 已接受的 fallback 方式，改为本地人工双重审查并显式记录，不伪装为子代理 review。

## 7. 残留问题与后续关注点

- 当前详情接口按 `contentId` 查询，而对外公开访问仍应继续通过 `content_hash` / `share_hash` 解析链路完成，这部分仍属于 `T5` 与 `T7` 范围。
- 当前搜索为 PocketBase 基础过滤能力，适合 MVP；若后续需要更复杂全文检索，不应在本轮直接引入重型搜索基础设施。
- 当前列表排序固定为 `-created`，后续若扩展多排序字段，应继续保持在统一 `Content` 查询入口中实现。

## 8. 结论

- `T6` 已达到进入 `T5` 或后续前台查询消费工作的条件。
- 当前主链路已具备“写入 -> 列表/搜索/详情查询”的业务壳能力，下一步应继续补齐分享链接与 hash 访问解析主线。
