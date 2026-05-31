---
task_id: "T7"
title: "对外访问网页层"
status: "completed"
review_status: "owner-review-ready"
updated_at: "2026-04-18"
worktree: "/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base"
review_mode: "manual-local-review-due-to-subagent-block"
---

# T7 完成记录

## 1. task 目标

- 实现列表页、搜索页和详情页。
- 对 HTML 内容进行安全渲染。
- 对文件类型内容提供下载或预览入口。
- 页面只消费业务壳提供的接口，不自行实现权限、hash 解析或底层拼接规则。
- 页面结构围绕统一 `Content` 模型构建。

## 2. 实际改动范围

主要实现文件：

- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/app.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/web/page-renderer.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/content.test.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/helpers.js`

## 3. 已完成内容

- 已实现 owner 侧网页路由：`GET /web/list`、`GET /web/search`、`GET /web/detail/:contentId`。
- 已实现 public 网页路由：`GET /web/public/content/:contentHash`、`GET /web/public/share/:shareHash`。
- 页面层全部通过现有 `contentService` 获取列表、搜索、详情和 public 访问结果，没有直连 PocketBase，也没有自行复写权限或 hash 解析逻辑。
- 列表页与搜索页基于统一 `Content` 摘要渲染卡片，保持文件与 HTML 内容在同一信息架构下展示。
- 详情页对 `rich_text` 内容通过带 `sandbox` 的 `iframe srcdoc` 渲染，避免把原始 HTML 直接插入页面主 DOM。
- public 文件页复用业务壳返回的 `download.contentBase64`，生成浏览器可点击的 `data:` 下载链接，满足 MVP 阶段“下载或预览入口”要求。
- 页面错误态已对接业务壳的 `400/403/404/410` 失败流，返回 HTML 错误页而不是把 JSON 直接暴露到浏览器视图。
- 测试辅助已支持同时捕获 JSON 与 HTML 响应，便于后续继续覆盖网页层场景。

## 4. 页面路由摘要

- `GET /web/list`
- `GET /web/search?q=keyword`
- `GET /web/detail/:contentId`
- `GET /web/public/content/:contentHash`
- `GET /web/public/share/:shareHash`

页面行为约定：

- owner 页面继续走 API Key 鉴权，与 `/api/query/*` 共享 owner-scoped 查询边界。
- public 页面只走既有 `content_hash` / `share_hash` 解析链路，不在页面层补任何访问控制判断。
- HTML 内容通过 `iframe[sandbox]` 只读预览。
- 文件内容通过下载链接暴露，不返回底层真实存储路径。

## 5. 验证证据

已实际执行：

- `node --test tests/content.test.js`
- `node --test`

验证结果：

- `tests/content.test.js`：`22/22` 通过。
- 全量 `node --test`：`37/37` 通过。

已覆盖的 T7 关键场景：

- owner 内容列表页渲染成功。
- owner HTML 详情页通过 sandboxed iframe 安全渲染。
- public share 文件页可生成下载链接。
- 未分享内容的 public 页面访问返回 HTML 错误页。
- 原有写入、查询、分享、公网访问 API 契约未被破坏。

## 6. 审查结果

- spec review：PASS（本地人工审查）
- code quality review：PASS（本地人工审查）

说明：

- 按契约本应使用独立 fresh reviewer subagent。
- 当前平台在本项目上下文中仍无法稳定完成真实 reviewer 子代理调用，因此继续采用本地人工双重审查并显式记录。
- 本记录不伪装为独立 subagent review。

## 7. 残留问题与后续关注点

- 当前网页层样式为服务端直出 HTML，目标是先形成可访问、可演示的 MVP 网页入口，不是完整前端工程化方案。
- public 文件页目前使用 `data:` 链接承接下载，适合当前 JSON + base64 public API；若后续在 `T9` 前希望更贴近真实下载体验，可再评估改为业务壳二进制流响应。
- 当前 owner 页面仍以 API Key 头访问，适合内测与联调；若后续要给真实浏览器用户长期使用，需要在后续范围内补充会话态或代理层方案。

## 8. 结论

- `T7` 已达到“写入 -> 查询 -> 分享访问 -> 网页展示”的 MVP 主链路要求。
- 下一步应继续进入 `T8`，补齐删除与撤销分享闭环，再进入 `T9` 做集成验证与部署说明。
