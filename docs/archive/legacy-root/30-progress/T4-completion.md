---
task_id: "T4"
title: "统一内容写入能力（文件 + HTML）"
status: "completed"
review_status: "owner-review-ready"
updated_at: "2026-04-18"
worktree: "/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base"
review_mode: "manual-local-review-approved-by-owner"
---

# T4 完成记录

## 1. task 目标

- 提供受保护文件上传 API。
- 提供受保护 HTML 富文本保存 API。
- 两类写入统一落到 `contents` 集合，不拆分第二套主模型。
- 返回统一写入结果结构：`contentId`、`type`、`contentHash`、`accessUrl`。
- 处理文件落盘与元数据写入的一致性与失败补偿。

## 2. 实际改动范围

主要实现文件：

- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/app.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/config.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/http/json.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/pocketbase/client.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/src/content/service.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/helpers.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/content.test.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/health.test.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/config.test.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/tests/auth.test.js`
- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/scripts/verify_t4.sh`

## 3. 已完成内容

- 已实现 `POST /api/write/html`，以 JSON 方式保存 HTML 内容到统一 `contents` 集合。
- 已实现 `POST /api/write/file`，以 JSON + `contentBase64` 方式接收文件内容，真实落盘到 `workspace/content-files/` 后再写入 `contents` 集合。
- 两类写入均保持 `owner_user_id`、`type`、`content_hash` 等统一主模型字段。
- 已为文件写入补齐 `original_filename`、`storage_path`、`mime_type`、`file_size`。
- 已为 HTML 写入补齐 `title`、`html_content`、`mime_type=text/html`。
- 已统一返回 `contentId`、`type`、`contentHash`、`accessUrl`。
- 已处理元数据写入失败时的文件回滚，避免遗留孤儿文件。
- 已补充 `content_hash` 冲突重试逻辑，避免直接覆盖既有记录。
- 已将新内容默认写为 `is_shared=false`，保持与后续分享能力边界一致，不提前开放外部访问。

## 4. 验证证据

已实际执行：

- `node --test`

验证结果：

- `16/16` 通过。
- 已覆盖 HTML 写入成功。
- 已覆盖文件写入成功，包括中文与空格文件名。
- 已覆盖元数据写入失败时物理文件回滚。
- 已覆盖 `content_hash` 冲突时重试。
- 已覆盖非法 base64 输入返回 `400`。
- 已覆盖受保护写接口仍先经过 API Key 认证链路。

可复核脚本：

- `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/scripts/verify_t4.sh`

## 5. 审查结果

- spec review：PASS（本地人工审查）
- code quality review：PASS（本地人工审查）

说明：

- 本应使用独立 fresh reviewer subagent。
- 但当前会话平台层 `spawn_agent` 调用持续被参数校验阻塞，reviewer 未能真正启动。
- 已向 Owner 明确阻塞状态；经 Owner 明确批准，本 task 改以人工本地 code review 模式收口。
- 本地审查中实际发现并修复的问题包括：
  - 新内容不应默认 `is_shared=true`
  - `content_hash` 冲突必须重试
  - base64 输入校验不能过宽

## 6. 残留问题与后续关注点

- 当前文件上传接口为 JSON + `contentBase64` 方案，适合当前 MVP 和测试闭环，但后续若要支持更大文件或浏览器直传，应在后续 task 中评估改为 `multipart/form-data` 或流式上传。
- 当前 `accessUrl` 只是统一返回结构中的占位可访问地址，真正的公开访问解析仍依赖 `T5` 和 `T7` 完成。
- Linux MiniPC 上的运行态联调与真实 PocketBase 端到端写入仍需后续集成阶段补跑。

## 7. 结论

- `T4` 已达到进入 `T5` / `T6` 的条件。
- 后续应优先继续完成分享链接解析与查询链路，不应在当前 task 上扩展后台管理或替换上传协议边界。
