# P3-T3 Manual Check

## 1. 目标

验证 P3-T3 新增的 owner 写路径能力：

- 单内容更新
- 批量分享
- 批量撤销分享
- 批量删除

本轮不包含：

- 文件二进制内容替换
- owner 凭据管理
- 浏览器自动化 E2E

## 2. 前置条件

1. PocketBase 已启动。
2. 业务服务已启动。
3. 浏览器已通过请求头注入方式带上 owner API Key：
   - Header: `x-shutong49-api-key`
   - Value: 对应 owner 的有效 API Key
4. owner 账户下已有至少 2 条内容，建议同时包含：
   - 1 条 rich text
   - 1 条 file

## 3. 单内容更新检查

### 3.1 更新 rich text

1. 打开 `/web/detail/:contentId`。
2. 在“内容更新”面板修改标题。
3. 修改 HTML 内容。
4. 提交“保存更新”。
5. 预期结果：
   - 页面重定向回当前详情页。
   - 出现成功 flash：“内容已更新”。
   - 标题更新成功。
   - HTML 预览更新成功。
   - content hash 不变化，公开访问地址不变化。

### 3.2 更新 file 元数据

1. 打开 file 类型内容的详情页。
2. 在“内容更新”面板修改标题。
3. 提交“保存更新”。
4. 预期结果：
   - 标题更新成功。
   - 页面出现成功 flash。
   - 页面明确提示：当前不支持浏览器内替换文件二进制。

### 3.3 非法更新约束

1. 对 file 内容尝试伪造提交 `htmlContent`。
2. 预期结果：
   - 服务返回 400。
   - 不会写入非法字段。

## 4. 批量操作检查

### 4.1 批量分享

1. 打开 `/web/list` 或 `/web/search`。
2. 在“批量操作”面板选择 `批量分享`。
3. 勾选多条未公开内容。
4. 提交。
5. 预期结果：
   - 页面跳回列表。
   - 出现成功 flash：“批量分享已完成”。
   - 被勾选内容变为已公开。
   - 对应公开页可访问。

### 4.2 批量撤销分享

1. 选择 `批量撤销分享`。
2. 勾选多条已公开内容。
3. 提交。
4. 预期结果：
   - 页面跳回列表。
   - 出现成功 flash：“批量撤销分享已完成”。
   - 被勾选内容变为未公开。
   - 原公开页访问失败。

### 4.3 批量删除

1. 选择 `批量删除`。
2. 勾选多条内容。
3. 提交。
4. 预期结果：
   - 页面跳回列表。
   - 出现成功 flash：“批量删除已完成”。
   - 被勾选内容从列表消失。
   - 若为 file，底层文件被删除。
   - 若存在分享链接，分享状态一并失效。

## 5. Open API 检查

### 5.1 更新 rich text

```bash
curl -X POST http://127.0.0.1:8787/api/write/update   -H 'content-type: application/json'   -H 'x-shutong49-api-key: <API_KEY>'   -d '{
    "contentId":"<RICH_TEXT_CONTENT_ID>",
    "title":"更新后的标题",
    "htmlContent":"<article><h1>updated</h1><p>body</p></article>"
  }'
```

### 5.2 批量分享

```bash
curl -X POST http://127.0.0.1:8787/api/write/batch   -H 'content-type: application/json'   -H 'x-shutong49-api-key: <API_KEY>'   -d '{
    "action":"share",
    "contentIds":["<CONTENT_ID_1>","<CONTENT_ID_2>"]
  }'
```

### 5.3 批量撤销分享

```bash
curl -X POST http://127.0.0.1:8787/api/write/batch   -H 'content-type: application/json'   -H 'x-shutong49-api-key: <API_KEY>'   -d '{
    "action":"share_revoke",
    "contentIds":["<CONTENT_ID_1>","<CONTENT_ID_2>"]
  }'
```

### 5.4 批量删除

```bash
curl -X POST http://127.0.0.1:8787/api/write/batch   -H 'content-type: application/json'   -H 'x-shutong49-api-key: <API_KEY>'   -d '{
    "action":"delete",
    "contentIds":["<CONTENT_ID_1>","<CONTENT_ID_2>"]
  }'
```
