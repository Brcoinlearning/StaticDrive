# Code Change Sync And Restart

本文档解决一个高频问题：

代码改了以后，本机和虚拟机分别要做什么，哪些服务要重启，哪些通常不用动。

## 1. 先判断你改了哪一类内容

### 1.1 只改了业务壳源码

典型目录：

- `src/`
- `tests/`
- `docs/`
- `README.md`

结论：

- 本机：通常只需要重启业务壳
- VM：同步代码后通常只需要重启 `app`
- PocketBase：通常不用重启

这次“缺失本地文件筛选/清理”功能就属于这一类。

### 1.2 改了业务壳配置

典型内容：

- `.env` 里的 `PUBLIC_BASE_URL`
- `.env` 里的 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD`
- `.env` 里的 session/cookie 相关项

结论：

- 本机：重启业务壳
- VM：重启 `app`，必要时整套 Compose

### 1.3 改了 PocketBase 底座相关内容

典型内容：

- `pb_migrations/`
- PocketBase 可执行文件
- PocketBase 数据目录/端口/运行方式

结论：

- 不能再按“只重启 app”处理
- 需要单独安排 PocketBase 侧操作
- 必要时应先备份数据目录再动底座

## 2. 本机改代码后的通用步骤

### 2.1 只改 `src/` 的标准动作

1. 运行相关测试。
2. 停掉当前业务壳进程。
3. 重新启动业务壳。
4. 访问关键页面或接口确认变更已生效。

最短命令路径：

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
node --test tests/content.test.js
npm start
```

建议至少验证：

- `http://127.0.0.1:8787/api/health`
- `http://127.0.0.1:8787/web/list`

如果本次改动与缺失文件相关，再补看：

- `http://127.0.0.1:8787/web/list?missingLocalFileOnly=1`

## 3. VM 改代码后的通用步骤

### 3.1 代码同步

先把本地已确认的代码同步到 VM。具体同步方式由你的仓库管理方式决定，常见方式只有两类：

1. 在 VM 项目目录里执行 `git pull`
2. 用你自己的发布方式把最新代码覆盖到 `/opt/static-content-service`

关键原则：

- VM 上必须和你本地准备上线的代码版本一致
- 不要一边本地调新逻辑，一边让 VM 继续跑旧代码

### 3.2 只改业务壳代码时的最短步骤

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d app
```

然后验证：

```bash
curl http://127.0.0.1:8787/api/health
```

再打开：

- `http://<vm-ip>/web/list`
- `http://<vm-ip>/web/list?missingLocalFileOnly=1`

### 3.3 改了 Compose、公共配置或镜像构建内容

这时不要只重启 `app`，而应按整套 Compose 处理：

```bash
cd /opt/static-content-service
sudo systemctl restart static-content-compose
```

## 4. 哪些情况通常不需要重启 PocketBase

以下场景通常都不需要：

- 改了页面 HTML
- 改了 owner/public 路由
- 改了业务壳鉴权逻辑
- 改了缺失文件判断逻辑
- 改了列表、搜索、详情渲染逻辑

## 5. 哪些情况要提高警惕

以下场景不要直接套“重启 app 即可”：

- 你改了 `pb_migrations/`
- 你改了 PocketBase 管理员口径或初始化方式
- 你改了容器挂载路径
- 你改了 `WORKSPACE_DIR`
- 你改了 Nginx 反向代理路径

## 6. 推荐的发布前检查

无论本机还是 VM，建议每次代码变更后至少确认：

1. `api/health` 正常
2. owner 登录页能打开
3. owner 列表页能打开
4. public 列表页能打开
5. 如果本次涉及文件逻辑，额外验证缺失文件筛选页

## 7. 当前建议的提交收口方式

如果一次改动同时包含代码和操作说明，建议把它们放在同一个提交里。这样能保证：

- VM 上更新代码时，文档也同步更新
- 后续自己或别人回看提交记录时，能同时看到“代码怎么变”和“上线后该怎么做”

## 8. 这份文档的目的

这不是为了描述一次临时修复，而是为了给后续所有代码变更提供统一口径：

- 先判断改动类型
- 再决定本机和 VM 要重启什么
- 最后做最小验证
