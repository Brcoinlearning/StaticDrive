# 手工联调使用手册

本文档面向你手工检查 MVP 流程时使用，重点提供：

- 常用启动命令
- 常用关闭命令
- 服务访问地址
- PocketBase 管理后台地址
- 常用 API 与网页入口
- 一条最短手工验证路径

## 1. 工作目录

当前联调 worktree：

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base
```

## 2. 启动前准备

### 2.1 准备环境变量

首次使用时：

```bash
cp .env.example .env
```

至少确认以下配置：

```env
PB_BASE_URL=http://127.0.0.1:8090
PB_ADMIN_EMAIL=你的 PocketBase 管理员邮箱
PB_ADMIN_PASSWORD=你的 PocketBase 管理员密码
SERVICE_HOST=127.0.0.1
SERVICE_PORT=8787
API_KEY_HEADER=x-shutong49-api-key
WORKSPACE_DIR=./workspace
PUBLIC_BASE_URL=
```

### 2.2 安装 PocketBase 二进制

如果 `pocketbase/bin/pocketbase` 还不存在，先执行：

```bash
./scripts/install_pocketbase.sh
```

## 3. 常用启动命令

### 3.1 启动 PocketBase

```bash
bash ./scripts/preflight.sh pocketbase
./scripts/start_pocketbase.sh
```

默认监听地址：

- PocketBase 服务地址：`http://127.0.0.1:8090`
- PocketBase 健康检查：`http://127.0.0.1:8090/api/health`
- PocketBase 管理后台：`http://127.0.0.1:8090/_/`

### 3.2 启动业务壳服务与网页层

```bash
bash ./scripts/preflight.sh service
npm start
```

或者：

```bash
./scripts/start_service.sh
```

当前预检会在真正启动前检查：

- `.env` 是否存在
- PocketBase 二进制是否存在
- PocketBase 管理员邮箱与密码是否已填写
- `8090` / `8787` 端口是否已被占用
- PocketBase `/api/health` 是否可达
- 数据目录与工作目录是否可创建

默认监听地址：

- 业务壳 API 根地址：`http://127.0.0.1:8787/api`
- 网页层根地址：`http://127.0.0.1:8787/web`
- 业务壳健康检查：`http://127.0.0.1:8787/api/health`

## 4. 常用关闭命令

当前仓库没有单独的 stop 脚本，关闭方式如下。

### 4.1 前台运行时关闭

如果服务是直接在当前终端前台启动的：

```bash
Ctrl + C
```

### 4.2 按端口关闭

如果你把服务放到别的终端或后台运行，可以按端口查并结束进程。

关闭 PocketBase：

```bash
lsof -iTCP:8090 -sTCP:LISTEN
kill <PID>
```

关闭业务壳服务：

```bash
lsof -iTCP:8787 -sTCP:LISTEN
kill <PID>
```

若进程无响应，再用：

```bash
kill -9 <PID>
```

## 5. 常用检查命令

### 5.1 检查端口监听

```bash
lsof -iTCP:8090 -sTCP:LISTEN
lsof -iTCP:8787 -sTCP:LISTEN
```

### 5.2 检查服务健康

```bash
curl http://127.0.0.1:8090/api/health
curl http://127.0.0.1:8787/api/health
```

### 5.3 跑自动化测试

```bash
node --test
```

当前 fresh 结果：`51/51` 通过。

如果你想先确认仓库层面的冷启动前提，再进入真实服务启动，可先执行：

```bash
bash ./scripts/verify_coldstart_dry_run.sh
```

这个脚本会检查：

- 关键仓库文件与目录是否存在
- 启动脚本语法是否正常
- Node 版本是否满足 `>=20`
- `node --test` 是否通过

它不会替代以下人工步骤：

- 联网下载 PocketBase
- 创建 PocketBase 管理员账号
- 初始化 `users_api` 样例用户

## 6. 访问地址总表

### 6.1 底座与后台

- PocketBase 服务：`http://127.0.0.1:8090`
- PocketBase 管理后台：`http://127.0.0.1:8090/_/`
- PocketBase 健康检查：`http://127.0.0.1:8090/api/health`

### 6.2 业务壳 API

- 健康检查：`http://127.0.0.1:8787/api/health`
- HTML 写入：`http://127.0.0.1:8787/api/write/html`
- 文件写入：`http://127.0.0.1:8787/api/write/file`
- 创建分享：`http://127.0.0.1:8787/api/write/share`
- 撤销分享：`http://127.0.0.1:8787/api/write/share/revoke`
- 删除内容：`http://127.0.0.1:8787/api/write/delete`
- owner 列表：`http://127.0.0.1:8787/api/query/list`
- owner 搜索：`http://127.0.0.1:8787/api/query/search?q=关键词`

### 6.3 网页层地址

- owner 列表页：`http://127.0.0.1:8787/web/list`
- owner 搜索页：`http://127.0.0.1:8787/web/search?q=关键词`
- owner 详情页：`http://127.0.0.1:8787/web/detail/<contentId>`
- public 内容页：`http://127.0.0.1:8787/web/public/content/<contentHash>`
- public 分享页：`http://127.0.0.1:8787/web/public/share/<shareHash>`

说明：

- owner 网页层当前仍依赖 API Key 请求头，更适合用 curl、Postman 或浏览器插件联调。
- public 页面不需要 API Key。

## 7. 初始化数据

先去 PocketBase 管理后台 `users_api` 集合插入一条样例用户记录：

```json
{
  "display_name": "T1 Verify User",
  "api_key": "t1_verify_api_key_0001"
}
```

完整样例见：

- [mvp-sample-data.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P1-MVP/02-after-execution/mvp-sample-data.md)

## 8. 最短手工验证路径

### 8.1 写入一条 HTML 内容

```bash
curl -X POST http://127.0.0.1:8787/api/write/html \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"title":"书童四九 HTML 样例","htmlContent":"<article><h1>静态网页服务演示</h1><p>这是手工联调 HTML 样例。</p></article>"}'
```

记下返回里的：

- `contentId`
- `contentHash`

### 8.2 写入一条文件内容

```bash
curl -X POST http://127.0.0.1:8787/api/write/file \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"title":"架构说明文件","filename":"架构说明.txt","mimeType":"text/plain","contentBase64":"UG9ja2V0QmFzZSArIOS4muWKoeWjsyArIOWvueWkluW/hemXrumXqOWxggo="}'
```

同样记下：

- `contentId`
- `contentHash`

### 8.3 创建分享链接

```bash
curl -X POST http://127.0.0.1:8787/api/write/share \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"contentId":"<contentId>"}'
```

记下返回里的：

- `shareHash`
- `shareUrl`

### 8.4 验证 owner 查询

```bash
curl -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  http://127.0.0.1:8787/api/query/list

curl -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  'http://127.0.0.1:8787/api/query/search?q=架构'

curl -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  http://127.0.0.1:8787/api/query/detail/<contentId>
```

### 8.5 验证网页层

public 页面可直接浏览器打开：

- `http://127.0.0.1:8787/web/public/list`
- `http://127.0.0.1:8787/web/public/search?q=关键词`
- `http://127.0.0.1:8787/web/public/content/<contentHash>`
- `http://127.0.0.1:8787/web/public/share/<shareHash>`

owner 页面当前需要带 API Key 头，建议用带 Header 的客户端访问：

- `http://127.0.0.1:8787/web/list`
- `http://127.0.0.1:8787/web/search?q=架构`
- `http://127.0.0.1:8787/web/detail/<contentId>`

### 8.6 验证撤销分享

```bash
curl -X POST http://127.0.0.1:8787/api/write/share/revoke \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"contentId":"<contentId>"}'
```

然后访问原 `shareUrl`，预期返回 `410 Gone`。

### 8.7 验证删除内容

```bash
curl -X POST http://127.0.0.1:8787/api/write/delete \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"contentId":"<contentId>"}'
```

删除后再查详情或 public 链接，预期应失效。

## 9. 联调时最常见的几个问题

### 9.0 写入接口返回 `PocketBase request failed: 400`

先检查两件事：

- `.env` 中 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 是否正确
- PocketBase 集合字段 `contents.is_shared` 与 `share_links.is_revoked` 是否被误配置成 `required=true`

真实联调已验证：如果这两个布尔字段被设为 required，业务壳写入 `false` 时会被 PocketBase 拒绝。

### 9.1 打不开 `http://127.0.0.1:8090/_/`

通常是 PocketBase 没启动，先检查：

```bash
bash ./scripts/preflight.sh pocketbase
lsof -iTCP:8090 -sTCP:LISTEN
curl http://127.0.0.1:8090/api/health
```

### 9.2 业务壳返回 `401`

通常是：

- 没带 `x-shutong49-api-key`
- `users_api` 集合里没有对应 `api_key`
- 你把 `API_KEY_HEADER` 改了，但请求还在用旧头名

### 9.3 业务壳启动失败

优先检查 `.env` 里的：

- `PB_BASE_URL`
- `PB_ADMIN_EMAIL`
- `PB_ADMIN_PASSWORD`

以及 PocketBase 是否已启动。

建议先直接执行：

```bash
bash ./scripts/preflight.sh service
```

当前最常见失败原因：

- `.env` 不存在
- `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 未填写
- PocketBase 还没启动，导致 `/api/health` 不通
- `8787` 端口已被其他进程占用

### 9.5 想先验证冷启动前提是否齐备

先执行：

```bash
bash ./scripts/verify_coldstart_dry_run.sh
```

若该脚本通过，说明仓库内部可自动确认的前提已经齐备；之后仍需继续完成：

1. PocketBase 二进制下载
2. PocketBase 后台初始化
3. 最小手工 smoke check

### 9.4 owner 页面在浏览器里不好直接打开

这是当前 MVP 的已知取舍。因为 owner 页面依赖 API Key 请求头，裸浏览器不适合直接访问这类页面。手工联调时更建议：

- public 页面用浏览器
- owner 页面用 curl / Postman / 支持 Header 的浏览器插件

## 10. 相关文档

- [README.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/README.md)
- [mvp-sample-data.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P1-MVP/02-after-execution/mvp-sample-data.md)
- [mvp-integration-verification.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P1-MVP/02-after-execution/mvp-integration-verification.md)
