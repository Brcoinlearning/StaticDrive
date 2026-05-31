---
task_id: "T5"
title: "分享链接与 hash 路由解析"
status: "completed"
review_status: "owner-review-ready"
updated_at: "2026-04-18"
worktree: "/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base"
review_mode: "manual-local-review-due-to-subagent-block"
---

# T5 完成记录

## 1. task 目标

- 生成内容 hash 与分享 hash。
- 实现分享链接创建与 hash 解析逻辑。
- 校验外部访问合法性。
- 明确区分 `content_hash` 与 `share_hash` 的用途。
- 建立统一 public 访问入口，不让页面或调用方自行拼接底层路径。

## 2. 实际改动范围

主要实现文件：

- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/app.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/content/service.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/pocketbase/client.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/http/json.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/content.test.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/auth.test.js`

## 3. 已完成内容

- 已实现 `POST /api/write/share`，允许内容 owner 为自己内容创建分享链接。
- 已实现分享记录复用逻辑：若内容已有未撤销分享，则直接返回现有分享链接，不重复生成第二条有效分享。
- 已在创建分享时同步把内容 `is_shared` 标记为 `true`，保持 `content_hash` 访问边界与分享状态一致。
- 已实现 `GET /api/public/content/:contentHash`，用于解析内容访问 hash。
- 已实现 `GET /api/public/share/:shareHash`，用于解析分享访问 hash。
- 已集中在 `contentService` 中实现 hash 解析与访问校验，未把权限或路径规则散落到页面层。
- 对 `content_hash` 访问已限制为仅允许 `is_shared=true` 的内容。
- 对 `share_hash` 访问已限制为必须存在且 `is_revoked=false`；撤销后返回 `410 Gone`。
- 对 HTML 内容返回结构化可渲染数据；对文件内容读取本地工作目录文件后返回下载元数据与 base64 内容，不暴露原始存储路径给外部调用方。
- 已补齐 `share_hash` 冲突复用与重试链路，沿用统一 hash 冲突处理机制。

## 4. 接口摘要

- `POST /api/write/share`
- `GET /api/public/content/:contentHash`
- `GET /api/public/share/:shareHash`

返回约定：

- 分享创建返回 `contentId`、`contentHash`、`shareId`、`shareHash`、`shareUrl`、`accessUrl`、`type`
- HTML 公共访问返回 `access`、`contentId`、`type`、`title`、`contentHash`、`mimeType`、`htmlContent`
- 文件公共访问返回 `access`、内容摘要字段和 `download.{filename,mimeType,contentBase64}`

## 5. 验证证据

已实际执行：

- `node --test tests/content.test.js`
- `node --test tests/auth.test.js`
- `node --test`

验证结果：

- `tests/content.test.js`：`18/18` 通过。
- `tests/auth.test.js`：`9/9` 通过。
- 全量 `node --test`：`33/33` 通过。

已覆盖的 T5 关键场景：

- owner 创建分享成功。
- `content_hash` 访问 HTML 成功。
- 未分享内容通过 `content_hash` 访问被拒绝。
- `share_hash` 访问文件成功，并可读取实际落盘文件内容。
- 已撤销分享返回 `410`。
- 不存在的 `share_hash` 返回 `404`。
- PocketBase 查询 `content_hash`、`share_links`、内容 sharing flag 更新的请求构造正确。

## 6. 审查结果

- spec review：PASS（本地人工审查）
- code quality review：PASS（本地人工审查）

说明：

- 按契约本应使用独立 fresh reviewer subagent。
- 当前平台 `spawn_agent` 在本项目上下文中仍不可稳定使用，因此未能完成真实独立 reviewer 调用。
- 本 task 延续 Owner 已接受的 fallback 方式，改为本地人工双重审查并显式记录，不伪装为子代理 review。

## 7. 残留问题与后续关注点

- 当前已实现分享创建与解析，但“撤销分享”动作本身仍属于 `T8` 范围；本轮主要覆盖 revoked 状态的解析行为。
- 当前公共文件访问以 JSON + base64 返回，便于 MVP 验证；在 `T7` 或后续真实前台接入时，可再评估是否切换为更贴近浏览器下载体验的二进制响应。
- 当前 public 访问返回的是业务壳结构化数据，前台展示和 HTML 安全渲染仍应在 `T7` 中继续实现。

## 8. 结论

- `T5` 已达到进入 `T7` 的条件。
- 当前业务壳主链路已具备“写入 -> 查询 -> 分享创建 -> public hash 访问解析”的 MVP 基础能力，下一步应继续实现对外访问网页层。
