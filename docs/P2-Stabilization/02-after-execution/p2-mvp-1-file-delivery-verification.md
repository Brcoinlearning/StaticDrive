---
doc_id: "p2_mvp_1_file_delivery_verification"
phase: "executing-plans"
artifact: "verification_record"
status: "draft"
derived_from:
  - "p2_t1_mvp_scope_freeze"
  - "phase_2_tasks"
updated_at: "2026-04-19"
---

# P2-MVP-1 File Delivery Verification

## 1. 目标

本记录用于证明 `P2-MVP-1` 已把文件 public 访问补到“原样交付且可正式验收”的状态。

## 2. 本轮实现结论

- `GET /api/public/content/:contentHash` 在文件场景下返回真实文件字节流。
- `GET /api/public/share/:shareHash` 在文件场景下返回真实文件字节流。
- 响应带有 `content-type`、`content-length`、`content-disposition` 和 `x-content-type-options`。
- public 文件页只保留“下载原始文件”入口，不再内嵌 `base64` 数据。

## 3. 自动化验证证据

验证命令：

```bash
node --test
```

最近一次结果：`42/42` 通过。

关键用例：

- `public share hash returns binary file download response`
- `public content hash returns binary bytes identical to stored file`
- `web public share page renders downloadable file link`

## 4. 验收口径

本任务按以下口径视为通过：

1. public 文件接口不再返回 `JSON + base64` 包装。
2. 下载响应头足以让浏览器按真实文件下载处理。
3. 下载回来的内容与存储文件字节一致。
4. public 页面仍保留可用下载入口。

## 5. 手工复验建议

建议使用一个文本文件和一个二进制文件各测一次：

```bash
curl -L http://127.0.0.1:8787/api/public/content/<contentHash> -o /tmp/verify-download.bin
```

再用以下方式验证：

- 文本文件：直接打开或 `cat`
- 二进制文件：对上传前原文件和下载后文件分别执行 `shasum`

## 6. 当前结论

`P2-MVP-1` 的自动化证据已经成立，文件 public 交付方式已从演示型 payload 调整为真实下载型交付。

