# MVP 样例数据

本文档提供 `T9` 集成验证可直接复用的最小样例数据，覆盖 HTML 内容、文件内容、分享访问、删除与撤销分享。

## 1. 样例业务用户

先在 PocketBase 管理后台的 `users_api` 集合创建一条记录：

```json
{
  "display_name": "T9 Verifier",
  "api_key": "demo-key-001"
}
```

说明：

- 业务壳默认从请求头 `x-shutong49-api-key` 读取 API Key。
- 若你修改了 `API_KEY_HEADER`，后续示例命令中的请求头也要同步调整。

## 2. HTML 写入样例

请求：

```json
{
  "title": "书童四九 HTML 样例",
  "htmlContent": "<article><h1>静态网页服务演示</h1><p>这是 T9 的 HTML 样例内容。</p></article>"
}
```

预期用途：

- 验证 HTML 富文本写入
- 验证 owner 详情页
- 验证 public HTML 访问

## 3. 文件写入样例

源文本：

```text
PocketBase + 业务壳 + 对外访问层
```

对应请求体：

```json
{
  "title": "架构说明文件",
  "filename": "架构说明.txt",
  "mimeType": "text/plain",
  "contentBase64": "UG9ja2V0QmFzZSArIOS4muWKoeWjsyArIOWvueWkluW/hemXrumXqOWxggo="
}
```

预期用途：

- 验证文件写入
- 验证 owner 列表与搜索
- 验证 public 文件下载页
- 验证删除时物理文件清理

## 4. 推荐验证顺序

1. 先写入一条 HTML 内容。
2. 再写入一条文件内容。
3. 对 HTML 内容创建分享链接并验证 public 访问。
4. 对文件内容创建分享链接并验证 public 下载页。
5. 执行 owner 列表、搜索、详情验证。
6. 撤销其中一个分享并确认 public 链接立即失效。
7. 删除文件内容并确认记录与物理文件都消失。

## 5. 常用 curl 模板

HTML 写入：

```bash
curl -X POST http://127.0.0.1:8787/api/write/html \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: demo-key-001' \
  -d '{"title":"书童四九 HTML 样例","htmlContent":"<article><h1>静态网页服务演示</h1><p>这是 T9 的 HTML 样例内容。</p></article>"}'
```

文件写入：

```bash
curl -X POST http://127.0.0.1:8787/api/write/file \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: demo-key-001' \
  -d '{"title":"架构说明文件","filename":"架构说明.txt","mimeType":"text/plain","contentBase64":"UG9ja2V0QmFzZSArIOS4muWKoeWjsyArIOWvueWkluW/hemXrumXqOWxggo="}'
```
