# 手工联调分终端操作手册

本文档把手工联调流程拆成 `终端 1`、`终端 2` 和 `浏览器` 三个视角，方便你逐步排查，不再来回切换。

## 1. 先确认当前目录

所有终端都先进入：

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
```

## 2. 终端分工

### 终端 1

用途：运行 PocketBase。

启动：

```bash
bash ./scripts/preflight.sh pocketbase
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
bash ./scripts/preflight.sh service
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

如果你想先确认仓库内部的冷启动前提，可以先在任意终端执行：

```bash
bash ./scripts/verify_coldstart_dry_run.sh
```

它不会替代 PocketBase 下载和后台初始化，只负责验证仓库本身、脚本和测试状态。

### 第一步：终端 1 启动 PocketBase

```bash
bash ./scripts/preflight.sh pocketbase
./scripts/start_pocketbase.sh
```

### 第二步：浏览器检查 PocketBase 后台

打开：

```text
http://127.0.0.1:8090/_/
```

### 第三步：终端 2 启动业务壳

```bash
bash ./scripts/preflight.sh service
./scripts/start_service.sh
```

若预检失败，不要继续重试启动，先按输出修正问题。当前会直接提示：

- `.env` 缺失
- PocketBase 二进制缺失
- PocketBase 管理员账号密码缺失
- `8090` 或 `8787` 端口占用
- PocketBase `/api/health` 不通

### 第四步：终端 3 或终端 2 新开 tab 做健康检查

```bash
curl http://127.0.0.1:8090/api/health
curl http://127.0.0.1:8787/api/health
```

## 4. 初始化检查

在浏览器里进入 PocketBase 后台，确认：

1. `_admins` 中你可以正常登录。
2. `users_api` 集合里存在 owner 测试用户。
3. 你手工联调时使用的 `api_key` 明确可见。

## 5. 功能联调命令

以下所有命令都建议在新的终端 tab 执行。

### 5.1 写入 HTML

```bash
curl -X POST http://127.0.0.1:8787/api/write/html \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"title":"书童四九 HTML 样例","htmlContent":"<article><h1>静态网页服务演示</h1><p>这是手工联调 HTML 样例。</p></article>"}'
```

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

- `http://127.0.0.1:8787/web/public/list`
- `http://127.0.0.1:8787/web/public/search?q=关键词`
- `http://127.0.0.1:8787/web/public/content/<contentHash>`
- `http://127.0.0.1:8787/web/public/share/<shareHash>`

### 5.5.1 验证文件真实下载

如果目标内容是文件，建议额外执行一次命令行下载验证：

```bash
curl -L http://127.0.0.1:8787/api/public/content/<contentHash> -o /tmp/p2-mvp-download.bin
```

或：

```bash
curl -L http://127.0.0.1:8787/api/public/share/<shareHash> -o /tmp/p2-mvp-download.bin
```

检查点：

- 响应应直接下载文件，而不是返回 `JSON`。
- 下载后的文件大小应与 `api/query/list` 中的 `fileSize` 一致。
- 若你上传的是可读文本文件，可进一步执行：

```bash
cat /tmp/p2-mvp-download.bin
```

若你上传的是二进制文件，可执行：

```bash
shasum /tmp/p2-mvp-download.bin
```

### 5.5.2 验证公开发现流

浏览器打开：

```text
http://127.0.0.1:8787/web/public/list
```

检查点：

- 页面中只能看到已经分享的内容。
- 点击任一结果后，应进入对应的 `public content` 详情页。

再访问：

```text
http://127.0.0.1:8787/web/public/search?q=样例
```

检查点：

- 搜索结果仍只显示公开内容。
- 搜索结果链接仍指向 `/web/public/content/<contentHash>`。


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

如果你执行 `POST /api/write/html` 返回：

```json
{"error":"pocketbase_request_failed","message":"Content write failed.","details":"PocketBase request failed: 400","diagnostic":{"operation":"create_content","pocketbaseStatus":400}}
```

先按下面顺序排查：

1. `.env` 中 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 是否正确
2. PocketBase 中 `contents.is_shared` 与 `share_links.is_revoked` 是否误设为 `required=true`
3. 修改 `.env` 后是否已重启业务壳服务

## 7. 相关文档

- [manual-check-guide.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P1-MVP/02-after-execution/manual-check-guide.md)
- [mvp-sample-data.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P1-MVP/02-after-execution/mvp-sample-data.md)
- [p2-t2-startup-preflight-verification.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P2-Stabilization/02-after-execution/p2-t2-startup-preflight-verification.md)
- [p2-t5-runtime-diagnostics-verification.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P2-Stabilization/02-after-execution/p2-t5-runtime-diagnostics-verification.md)
- [p2-t6-cold-start-reproducibility-verification.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P2-Stabilization/02-after-execution/p2-t6-cold-start-reproducibility-verification.md)
