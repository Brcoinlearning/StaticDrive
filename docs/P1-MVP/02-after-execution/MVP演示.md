# MVP 演示

本文档用于现场人工演示当前 MVP 的 6 个核心功能，对应原始业务目标：

1. 保存文件到应用中，并允许外部用户通过 HTTP 访问
2. 保存富文本到应用中，并允许外部用户通过 HTTP 查看
3. 外部用户可以在页面内容列表中找到已发布内容
4. 外部用户可以在页面中搜索已发布内容
5. 外部用户可以查看已发布内容详情
6. 我可以通过 Open API 保存文件或富文本

## 1. 启动准备

进入仓库根目录：

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
```

终端 1 启动 PocketBase：

```bash
bash ./scripts/preflight.sh pocketbase
./scripts/start_pocketbase.sh
```

终端 2 启动业务壳：

```bash
set -a
source ./.env
set +a
./scripts/start_service.sh
```

浏览器确认：

- `http://127.0.0.1:8090/_/`
- `http://127.0.0.1:8787/api/health`

## 2. 初始化样例用户

在 PocketBase 后台 `users_api` 集合中创建一条记录：

```json
{
  "display_name": "T1 Verify User",
  "api_key": "t1_verify_api_key_0001"
}
```

说明：

- `api_key` 字段当前最小长度为 `16`
- 历史文档中的 `demo-key-001` 不再满足约束，不能继续使用

## 3. 演示脚本

本仓库已提供按链路拆分的演示脚本：

- `scripts/demo_step1_write_content.sh`
  覆盖功能 1、2、6 的“保存内容”部分
- `scripts/demo_step2_share_content.sh`
  为 PDF 和 HTML 创建公开分享，给功能 1、2、3、4、5 准备公开数据
- `scripts/demo_step3_print_access_info.sh`
  输出浏览器访问地址和直接下载地址，方便现场演示功能 1、2、3、4、5
- `scripts/demo_step4_cleanup_demo_content.sh`
  演示结束后清理本次演示生成的数据

推荐执行顺序：

```bash
./scripts/demo_step1_write_content.sh
./scripts/demo_step2_share_content.sh
./scripts/demo_step3_print_access_info.sh
```

演示结束后可执行：

```bash
./scripts/demo_step4_cleanup_demo_content.sh
```

## 4. 演示功能 1 和 6：Open API 保存文件

```bash
curl -X POST http://127.0.0.1:8787/api/write/file \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"title":"架构说明文件","filename":"架构说明.txt","mimeType":"text/plain","contentBase64":"UG9ja2V0QmFzZSArIOS4muWKoeWjsyArIOWvueWkluW/hemXrumXqOWxggo="}'
```

说明要点：

- 这是通过 Open API 保存文件
- 返回里会有 `contentId`、`contentHash`、`accessUrl`
- 这同时证明“功能 6 的文件写入”已经成立

记下返回里的文件 `contentId` 和 `contentHash`。

## 5. 演示功能 2 和 6：Open API 保存富文本

```bash
curl -X POST http://127.0.0.1:8787/api/write/html \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"title":"书童四九 HTML 样例","htmlContent":"<article><h1>静态网页服务演示</h1><p>这是人工演示的富文本样例。</p></article>"}'
```

说明要点：

- 这是通过 Open API 保存富文本
- 返回里同样会有 `contentId`、`contentHash`、`accessUrl`
- 这同时证明“功能 6 的富文本写入”已经成立

记下返回里的 HTML `contentId` 和 `contentHash`。

## 6. 先发布内容

为了让外部用户可访问，需要先分享。

分享文件：

```bash
curl -X POST http://127.0.0.1:8787/api/write/share \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"contentId":"<文件contentId>"}'
```

分享 HTML：

```bash
curl -X POST http://127.0.0.1:8787/api/write/share \
  -H 'content-type: application/json' \
  -H 'x-shutong49-api-key: t1_verify_api_key_0001' \
  -d '{"contentId":"<HTML contentId>"}'
```

## 7. 演示功能 1：外部用户通过 HTTP 访问文件

浏览器打开：

- `http://127.0.0.1:8787/web/public/content/<文件contentHash>`

或命令行直接下载：

```bash
curl -L http://127.0.0.1:8787/api/public/content/<文件contentHash> -o /tmp/demo-file.txt
cat /tmp/demo-file.txt
```

说明要点：

- 外部用户不需要 API Key
- 文件已可通过 HTTP 访问和下载
- 下载后的内容应与上传内容一致

## 8. 演示功能 2：外部用户通过 HTTP 查看富文本

浏览器打开：

- `http://127.0.0.1:8787/web/public/content/<HTML contentHash>`

说明要点：

- 外部用户可直接查看已发布富文本
- 页面会显示你刚刚写入的标题和正文

## 9. 演示功能 3：外部用户在列表中找到内容

浏览器打开：

- `http://127.0.0.1:8787/web/public/list`

说明要点：

- 这里是公开访客列表页
- 只能看到已经分享的内容
- 你刚刚分享的 HTML 和文件应都能看到

## 10. 演示功能 4：外部用户在页面中搜索内容

浏览器打开：

- `http://127.0.0.1:8787/web/public/search?q=样例`
- `http://127.0.0.1:8787/web/public/search?q=架构`

说明要点：

- 搜索范围是公开内容
- 搜索结果会返回刚刚发布的内容
- 点击结果可进入详情页

## 11. 演示功能 5：外部用户查看内容详情

直接从以下任一入口点击进入：

- `/web/public/list`
- `/web/public/search?q=...`

目标页面会是：

- `http://127.0.0.1:8787/web/public/content/<contentHash>`

说明要点：

- 公开访客可以从公开发现流进入详情
- 不是只有拿到 hash 才能访问

## 12. 最短演示顺序

建议现场按以下顺序：

1. 启动 PocketBase 和业务壳
2. 用 `write/file` 演示 Open API 保存文件
3. 用 `write/html` 演示 Open API 保存富文本
4. 对两个内容执行 `write/share`
5. 打开 `/web/public/list`
6. 打开 `/web/public/search?q=样例`
7. 点击进入公开详情页
8. 用 `curl -L /api/public/content/<文件hash>` 演示真实下载

## 13. 六个功能的归纳话术

- 功能 1：文件已通过 HTTP 可访问和下载
- 功能 2：富文本已通过 HTTP 可查看
- 功能 3：公开列表页可发现已发布内容
- 功能 4：公开搜索页可检索已发布内容
- 功能 5：公开访客可进入内容详情页
- 功能 6：Open API 已支持文件和富文本保存
