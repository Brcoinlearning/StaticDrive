# 手工联调分终端操作手册

本文档把手工联调流程拆成 `终端 1`、`终端 2` 和 `浏览器` 三个视角，方便你逐步排查，不再来回切换。

## 1. 先确认当前目录

所有终端都先进入：

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base
```

## 2. 终端分工

### 终端 1

用途：运行 PocketBase。

启动：

```bash
./scripts/start_pocketbase.sh
```

正常情况下会持续占住这个终端，不要关。

停止：

```bash
Ctrl + C
```

### 终端 2

用途：运行业务壳服务。

启动：

```bash
./scripts/start_service.sh
```

正常日志：

```text
Business shell listening on http://127.0.0.1:8787
```

停止：

```bash
Ctrl + C
```

### 浏览器

用途：打开后台和 public 页面。

常用地址：

- PocketBase 后台：`http://127.0.0.1:8090/_/`
- PocketBase 健康检查：`http://127.0.0.1:8090/api/health`
- 业务壳健康检查：`http://127.0.0.1:8787/api/health`
- public 内容页：`http://127.0.0.1:8787/web/public/content/<contentHash>`
- public 分享页：`http://127.0.0.1:8787/web/public/share/<shareHash>`

## 3. 推荐启动顺序

### 第一步：终端 1 启动 PocketBase

```bash
./scripts/start_pocketbase.sh
```

### 第二步：浏览器检查 PocketBase 后台

打开：

```text
http://127.0.0.1:8090/_/
```

### 第三步：终端 2 启动业务壳

```bash
./scripts/start_service.sh
```

### 第四步：终端 3 或终端 2 新开 tab 做健康检查

```bash
curl http://127.0.0.1:8090/api/health
curl http://127.0.0.1:8787/api/health
```

## 4. 初始化检查

在浏览器里进入 PocketBase 后台，确认：

1. `_admins` 中你可以正常登录。
2. `users_api` 集合里存在：`T1 Verify User`。
3. 它的 `api_key` 为：`t1_verify_api_key_0001`。

## 5. 功能联调命令

以下所有命令都建议在新的终端 tab 执行。

### 5.1 写入 HTML

```bash
curl -X POST http://127.0.0.1:8787/api/write/html \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"title":"书童四九 HTML 样例","htmlContent":"<article><h1>静态网页服务演示</h1><p>这是手工联调 HTML 样例。</p></article>"}'
```

预期成功时会返回：

- `contentId`
- `contentHash`
- `accessUrl`

### 5.2 写入文件

```bash
curl -X POST http://127.0.0.1:8787/api/write/file \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"title":"架构说明文件","filename":"架构说明.txt","mimeType":"text/plain","contentBase64":"UG9ja2V0QmFzZSArIOS4muWKoeWjsyArIOWvueWkluW/hemXrumXqOWxggo="}'
```

### 5.3 查看 owner 列表

```bash
curl -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  http://127.0.0.1:8787/api/query/list
```

### 5.4 创建分享

```bash
curl -X POST http://127.0.0.1:8787/api/write/share \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"contentId":"<contentId>"}'
```

### 5.5 打开 public 页面

浏览器打开：

- `http://127.0.0.1:8787/web/public/content/<contentHash>`
- `http://127.0.0.1:8787/web/public/share/<shareHash>`

### 5.6 撤销分享

```bash
curl -X POST http://127.0.0.1:8787/api/write/share/revoke \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"contentId":"<contentId>"}'
```

### 5.7 删除内容

```bash
curl -X POST http://127.0.0.1:8787/api/write/delete \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"contentId":"<contentId>"}'
```

## 6. 当前 400 错误的专项排查

如果你执行 `POST /api/write/html` 仍返回：

```json
{"error":"internal_error","message":"Content write failed.","details":"PocketBase request failed: 400"}
```

先不要继续测功能，先按下面顺序排查。

### 6.1 先检查 `.env` 中管理员密码是否混入全角字符

当前最值得怀疑的是：密码最后的感叹号是否是中文全角 `！`，而不是英文半角 `!`。

正确示例：

```env
PB_ADMIN_PASSWORD=Huhangbin2004!
```

错误示例：

```env
PB_ADMIN_PASSWORD=Huhangbin2004！
```

这两者看起来很像，但实际上是两个不同字符。若这里写成全角，业务壳去调用 PocketBase 管理接口时就会登录失败，随后所有受保护写入都会报 `PocketBase request failed: 400`。

### 6.2 改完 `.env` 后，必须重启终端 2 的业务壳

```bash
Ctrl + C
./scripts/start_service.sh
```

### 6.3 再重新执行 HTML 写入命令

如果仍失败，再继续看业务壳终端日志，而不是只看 curl 输出。

### 6.4 再检查 PocketBase 布尔字段是否被配置为 required

必须确认以下两个字段为 `required=false`：

- `contents.is_shared`
- `share_links.is_revoked`

真实联调已验证：若这里为 `required=true`，PocketBase 会把 `false` 判成缺失值，并返回 `400 validation_required`。

## 7. 常见关闭命令

检查 8090：

```bash
lsof -iTCP:8090 -sTCP:LISTEN
```

检查 8787：

```bash
lsof -iTCP:8787 -sTCP:LISTEN
```

结束进程：

```bash
kill 实际PID
```

## 8. 相关文档

- [manual-check-guide.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/docs/manual-check-guide.md)
- [mvp-sample-data.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base/docs/mvp-sample-data.md)
