# Local Runtime Handbook

本文档用于本机开发与联调场景，重点回答：

1. 本机服务怎么启动、停止、重启。
2. 常用访问地址是什么。
3. 改代码后通常要重启哪一层。

## 1. 本机运行结构

本机运行时包含三层：

1. `PocketBase`：底座存储服务。
2. `Node 业务壳服务`：承接 Open API、owner 页面、public 页面。
3. `workspace/content-files/`：业务壳本地落盘目录。

当前仓库默认口径：

- 先启动 `PocketBase`
- 再启动 `Node 业务壳`

## 2. 常用目录

- 仓库根目录：`/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理`
- PocketBase 数据目录：`pocketbase/data/`
- PocketBase 公开目录：`pocketbase/public/`
- 业务壳工作目录：`workspace/`
- 文件落盘目录：`workspace/content-files/`

## 3. 本机启动

### 3.1 启动 PocketBase

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
bash ./scripts/preflight.sh pocketbase
./scripts/start_pocketbase.sh
```

### 3.2 启动业务壳

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
bash ./scripts/preflight.sh service
npm start
```

或使用：

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
./scripts/start_service.sh
```

## 4. 常用访问地址

默认本机地址：

- PocketBase 健康检查：`http://127.0.0.1:8090/api/health`
- 业务壳健康检查：`http://127.0.0.1:8787/api/health`
- owner 登录页：`http://127.0.0.1:8787/web/auth/login`
- owner 列表页：`http://127.0.0.1:8787/web/list`
- owner 缺失文件筛选页：`http://127.0.0.1:8787/web/list?missingLocalFileOnly=1`
- public 列表页：`http://127.0.0.1:8787/web/public/list`
- PocketBase 后台：`http://127.0.0.1:8090/_/`

## 5. 本机常用检查命令

```bash
curl http://127.0.0.1:8090/api/health
curl http://127.0.0.1:8787/api/health
node --test tests/content.test.js
```

如果你只想快速确认“代码改动是否已生效”，优先访问：

- `http://127.0.0.1:8787/web/list`
- `http://127.0.0.1:8787/web/list?missingLocalFileOnly=1`

## 6. 改代码后要不要重启

通用规则：

- 改了 `src/`、`tests/`、`README.md`、`docs/`：通常只需要重启业务壳，PocketBase 不需要因为这类改动而重启。
- 改了 `.env` 中业务壳读取的配置：需要重启业务壳。
- 改了 `pb_migrations/`、PocketBase 二进制、PocketBase 端口或数据目录配置：需要单独处理 PocketBase。

最常见场景是改 `src/`，这时直接停掉当前 `npm start`，再重新启动即可。

## 7. 本机重启建议

### 7.1 仅重启业务壳

适用于：

- 改了 `src/app.js`
- 改了 `src/content/service.js`
- 改了 `src/web/page-renderer.js`
- 改了鉴权、页面、接口逻辑

做法：

1. 停掉当前 `npm start` 进程。
2. 重新执行 `npm start` 或 `./scripts/start_service.sh`。

### 7.2 PocketBase 一般不用重启

适用于当前这类业务逻辑改动。

除非你同时改了以下内容，否则不要因为普通代码修改去重启 PocketBase：

- `pb_migrations/`
- PocketBase 可执行文件
- PocketBase 端口/路径配置
- PocketBase 管理员账号配置联调问题

## 8. 本机排障顺序

如果页面异常，按这个顺序查：

1. `curl http://127.0.0.1:8090/api/health`
2. `curl http://127.0.0.1:8787/api/health`
3. 确认业务壳是否已经按最新代码重启
4. 确认 `.env` 是否仍与当前本机运行方式一致
5. 再去看页面路径是否返回预期内容

## 9. 当前 owner 缺失文件运维入口

如果你手工删除过 `workspace/content-files/` 下的文件，owner 页面现在提供两种处理方式：

1. 打开 `http://127.0.0.1:8787/web/list?missingLocalFileOnly=1` 只看异常记录。
2. 在 owner 列表页使用批量动作 `清理缺失文件记录` 删除这些脏记录。
