---
doc_id: "p2_t5_runtime_diagnostics_verification"
phase: "executing-plans"
artifact: "verification"
status: "draft"
derived_from:
  - "phase_2_tasks"
  - "p2_t2_startup_preflight_verification"
updated_at: "2026-04-19"
---

# P2-T5 Runtime Diagnostics Verification

## 1. 目标

验证 `P2-T5` 已把运行期失败提升为可诊断输出，而不是停留在泛化的 `internal_error` 或单行 `PocketBase request failed: 400`。

本次重点覆盖：

- PocketBase 下游失败
- API Key 鉴权链路失败
- API 路由内部异常时的结构化日志
- 页面侧 4xx 业务态不误打错误日志

## 2. 本次实现

本次新增或调整：

- `src/errors.js`
- `src/pocketbase/client.js`
- `src/auth/api-key-auth.js`
- `src/http/json.js`
- `src/app.js`
- `tests/auth.test.js`
- `tests/health.test.js`
- `tests/content.test.js`

## 3. 诊断策略

### 3.1 下游 PocketBase 错误

`PocketBaseClient` 现在不再只抛裸 `Error`，而是统一抛出带以下字段的应用错误：

- `statusCode`
- `code`
- `details`
- `diagnostic.operation`
- `diagnostic.pocketbaseStatus`
- `diagnostic.pocketbaseMessage`
- `diagnostic.pocketbaseData`

### 3.2 API 返回体

API 错误响应现在允许输出：

- `error`
- `message`
- `details`
- `diagnostic`

其中：

- `details` 用于给人工排障直接看一眼就能知道失败层级。
- `diagnostic` 用于补充操作名、下游状态码和 PocketBase 原始语义。

### 3.3 服务端日志

对于 API 的 5xx / 下游异常，服务端现在输出一条结构化 JSON 日志，包含：

- `event`
- `message`
- `statusCode`
- `code`
- `details`
- `diagnostic`
- `context.method`
- `context.url`

### 3.4 页面错误日志边界

公开页与 owner 页在以下情况下不打错误日志：

- 400
- 403
- 404
- 410

这些属于预期业务态，不应污染真正的异常排障日志。

## 4. 验证方式

执行：

```bash
node --test tests/auth.test.js
node --test tests/health.test.js
node --test tests/content.test.js
node --test
```

重点断言：

1. `apiKeyAuth` 在 PocketBase 查询失败时返回 `details + diagnostic`
2. `PocketBaseClient` 在 400/404/5xx 时抛出结构化诊断错误
3. `/api/health` 在 PocketBase 不可用时返回结构化降级信息
4. 写接口在内部失败时既返回诊断信息，也输出结构化日志
5. 页面侧 `403` 不再产生日志噪音

## 5. 结果口径

`P2-T5` 完成后，运行期排障不再依赖人工猜测“400 到底是鉴权、字段校验还是文件落盘问题”，而能直接从响应体和日志中看到：

- 失败发生在哪个操作
- 下游返回了什么状态
- PocketBase 是否返回了具体字段级报错
- 当前请求是哪条接口触发的

本次未覆盖：

- 日志落盘
- 日志级别切换
- 请求 ID / trace ID
- 远程日志聚合
