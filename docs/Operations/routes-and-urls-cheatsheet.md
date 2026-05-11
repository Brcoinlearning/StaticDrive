# Routes And URLs Cheatsheet

本文档是日常开发、联调、验收、运维时的快速入口表，不解释背景，只给常用地址与用途。

## 1. 本机常用地址

### 1.1 健康检查

- PocketBase：`http://127.0.0.1:8090/api/health`
- 业务壳：`http://127.0.0.1:8787/api/health`

### 1.2 PocketBase 后台

- `http://127.0.0.1:8090/_/`

### 1.3 owner 页面

- 登录页：`http://127.0.0.1:8787/web/auth/login`
- 凭据页：`http://127.0.0.1:8787/web/credential`
- 列表页：`http://127.0.0.1:8787/web/list`
- 仅看缺失本地文件：`http://127.0.0.1:8787/web/list?missingLocalFileOnly=1`
- 搜索页：`http://127.0.0.1:8787/web/search?q=关键词`
- 详情页：`http://127.0.0.1:8787/web/detail/<contentId>`

### 1.4 public 页面

- 公开列表：`http://127.0.0.1:8787/web/public/list`
- 公开搜索：`http://127.0.0.1:8787/web/public/search?q=关键词`
- 公开详情：`http://127.0.0.1:8787/web/public/content/<contentHash>`
- 分享详情：`http://127.0.0.1:8787/web/public/share/<shareHash>`

## 2. VM 常用地址

把下面的 `<vm-ip-or-domain>` 替换成当前真实入口。

### 2.1 健康检查

- `http://<vm-ip-or-domain>/api/health`

### 2.2 owner 页面

- `http://<vm-ip-or-domain>/web/auth/login`
- `http://<vm-ip-or-domain>/web/list`
- `http://<vm-ip-or-domain>/web/list?missingLocalFileOnly=1`

### 2.3 public 页面

- `http://<vm-ip-or-domain>/web/public/list`
- `http://<vm-ip-or-domain>/web/public/search?q=关键词`

## 3. Open API 速查

### 3.1 写接口

- `POST /api/write/html`
- `POST /api/write/file`
- `POST /api/write/share`
- `POST /api/write/share/revoke`
- `POST /api/write/update`
- `POST /api/write/batch`
- `POST /api/write/delete`

### 3.2 查询接口

- `GET /api/query/list`
- `GET /api/query/list?missingLocalFileOnly=1`
- `GET /api/query/search?q=关键词`
- `GET /api/query/search?q=关键词&missingLocalFileOnly=1`
- `GET /api/query/detail/<contentId>`

### 3.3 public 接口

- `GET /api/public/content/<contentHash>`
- `GET /api/public/share/<shareHash>`
- `POST /api/public/content/<contentHash>/password`
- `POST /api/public/share/<shareHash>/password`

说明：

- 当内容为 `password` 访问模式且尚未验证时，`GET /api/public/*` 会返回 `401 public_password_required`。
- 成功调用 `POST /api/public/*/password` 后会建立短期访问态（cookie）。

### 3.4 public 网页密码入口

- `POST /web/public/content/<contentHash>/password`
- `POST /web/public/share/<shareHash>/password`

说明：

- 公开页密码错误时，页面会在密码输入框下方显示红色错误提示，并可继续重试。

## 4. 当前高频用法

### 4.1 查看 owner 全部内容

- 页面：`/web/list`
- API：`/api/query/list`

### 4.2 查看缺失本地文件的脏记录

- 页面：`/web/list?missingLocalFileOnly=1`
- API：`/api/query/list?missingLocalFileOnly=1`

### 4.3 清理缺失本地文件记录

方式一：在 owner 列表页使用批量动作 `清理缺失文件记录`

方式二：调用批量写接口：

```json
{
  "action": "cleanup_missing_file_records",
  "contentIds": ["content_1", "content_2"]
}
```

### 4.4 owner 登录后最短检查路径

1. 打开 `/web/auth/login`
2. 登录后进入 `/web/list`
3. 如需排查异常文件，再打开 `/web/list?missingLocalFileOnly=1`

## 5. 常见说明

- 页面路由不要只用 `curl -I` 判断是否正常，因为部分页面可能对 `HEAD` 返回 `405`。
- `/web/list` 能打开，不代表本地文件一定存在；如果文件被手工删除，需要看页面上的“本地文件缺失”提示或直接用 `missingLocalFileOnly=1` 过滤。
