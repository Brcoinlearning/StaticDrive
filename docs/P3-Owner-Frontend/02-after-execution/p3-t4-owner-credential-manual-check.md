# P3-T4 Owner Credential Manual Check

## 1. 本轮目标

验证 owner 凭据管理的最小 Web 闭环：

- 浏览器可通过 API Key 登录 owner 会话
- owner 页面可通过 HttpOnly session cookie 访问
- 可查看当前 owner 凭据摘要页
- 可主动退出当前 owner 会话
- Open API 仍继续使用 header 鉴权

## 2. 前置条件

1. PocketBase 已启动。
2. 业务服务已启动。
3. `users_api` 中存在有效 owner 记录。
4. 你已知道该 owner 的 API Key。

## 3. 登录检查

1. 打开 `/web/auth/login`。
2. 在页面输入有效 API Key 并提交。
3. 预期结果：
   - 浏览器跳转到 `/web/list`
   - 页面出现“登录成功”反馈
   - 后续访问 owner 页面不再需要手工请求头注入

## 4. Owner 页面检查

1. 登录成功后直接访问：
   - `/web/list`
   - `/web/search?q=...`
   - `/web/detail/:contentId`
2. 预期结果：
   - 页面均可正常进入
   - 页面工具栏可见“凭据与会话”入口
   - 批量操作、更新、删除等 owner 行为仍可正常使用

## 5. 凭据页检查

1. 打开 `/web/credential`。
2. 预期结果：
   - 展示当前 owner 的 display name / owner id
   - 展示 API Key header 名称
   - 只展示 API Key 摘要，不完整暴露敏感值
   - 页面包含退出当前会话入口

## 6. 退出检查

1. 在 `/web/credential` 或 owner 页面顶部执行退出。
2. 预期结果：
   - 浏览器跳回 `/web/auth/login`
   - 会话 cookie 失效
   - 再访问 owner 页面会被要求先登录

## 7. Open API 回归检查

登录/退出能力不应替代原有 Open API header 模式，以下命令仍应可用：

```bash
curl -H 'x-shutong49-api-key: <API_KEY>' http://127.0.0.1:8787/api/query/list
```
