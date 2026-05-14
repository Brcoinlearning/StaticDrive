# AGENTS

本文件为进入本仓库工作的 agent 提供项目级执行约定。目标不是解释业务背景，而是减少误判、减少把中间命令转交给用户、提高在本机与 VM 上的直接执行效率。

## 1. 项目定位

本项目是一个 `PocketBase + 业务壳服务 + 网页层` 的静态网页服务。

关键目录：

- `src/`：业务壳服务与网页层源码
- `pb_migrations/`：PocketBase collection 迁移定义
- `scripts/`：本机、Docker、VM 验收与运维脚本
- `tests/`：Node 原生测试
- `docs/Operations/`：运行、同步、重启、排障文档
- `deploy/vm-compose/`：VM 上的 compose 模板
- `pocketbase/data/`：本地 PocketBase 数据目录

## 2. 默认工作方式

### 2.1 先执行，不先讲方案

除非用户明确要求只讨论方案，否则默认应直接做事：

- 先读相关实现
- 直接运行必要命令
- 直接修复
- 直接验证

不要在信息已经足够时把命令拆给用户手工执行。

### 2.2 优先短路径验证

排障时优先找最短证据链，不要一次改多个层。

例如 Markdown/公式渲染问题，应按这类顺序切：

1. API 写入是否收到了正确字段
2. 存储层是否真的持久化了字段
3. 查询接口是否按预期回传
4. 网页层是否基于这些字段进入正确分支

## 3. 本机验证口径

### 3.1 常用命令

优先使用：

```bash
node --test tests/content.test.js
node --test tests/auth.test.js
node --test tests/health.test.js
node --test
```

服务健康检查：

```bash
curl http://127.0.0.1:8090/api/health
curl http://127.0.0.1:8787/api/health
```

### 3.2 与用户交流时的验证原则

不要声称“已修复”或“已完成”，除非你已经拿到新的验证证据。

至少应给出以下之一：

- 测试通过输出
- 健康检查成功
- 真实 API 请求/响应证据
- 页面或接口回归验证结果

## 4. VM 处理规则

### 4.1 不要默认让用户自己 SSH

如果目标 VM 是本机 `Multipass` 实例，agent 应优先直接接管。

在这台开发机上，真实实例为：

- 实例名：`vm-accept`
- VM IP：`192.168.2.9`

看到这个 IP 时，默认先执行：

```bash
multipass list
multipass exec vm-accept -- bash -lc 'pwd && hostname && whoami'
```

只有在以下情况才退回 SSH：

- `multipass` 不可用
- 目标机器不是本机 Multipass 实例
- 用户明确要求走 SSH

### 4.2 VM 上的常用直连方式

查看状态：

```bash
multipass exec vm-accept -- bash -lc 'cd /opt/static-content-service && sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps'
```

只重启 app：

```bash
multipass exec vm-accept -- bash -lc 'cd /opt/static-content-service && sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d app'
```

重启 app 和 pocketbase：

```bash
multipass exec vm-accept -- bash -lc 'cd /opt/static-content-service && sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d pocketbase app'
```

查看 app 日志：

```bash
multipass exec vm-accept -- bash -lc 'cd /opt/static-content-service && sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f app'
```

传文件到 VM：

```bash
multipass transfer /absolute/path/on/host vm-accept:/tmp/target-file
```

### 4.3 不要迷信 systemd unit

文档里存在 `static-content-compose.service`，但真实 VM 不一定已经安装该 unit。

如果 `systemctl restart static-content-compose` 失败，不要停在这里；直接退回：

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d pocketbase app
```

## 5. PocketBase 特别规则

### 5.1 改了 `pb_migrations/` 时，不要按“只重启 app”处理

这类改动属于底座变更，需要单独核查：

- `contents`/其他 collection schema 是否已更新
- 真实 `data.db` 是否已有新列
- `_collections.schema` 是否与仓库迁移一致

### 5.2 先确认“迁移历史”和“真实 schema”是否一致

PocketBase 可能出现“迁移记录已存在，但真实 schema 没补上”的情况。

遇到这类问题，不要只相信：

```bash
pocketbase migrate up
```

必须继续检查：

- 物理表列是否存在
- `_collections.schema` 是否存在对应字段
- 真实写入/查询是否恢复正常

### 5.3 当线上已坏、且 agent 已能接管 VM 时

如果问题已经明确在：

- `PocketBase data.db`
- `_collections.schema`

而且 agent 已经能通过 `multipass exec` 接管 VM，那么优先由 agent 直接完成：

1. 备份数据库
2. 检查真实 schema
3. 修复
4. 重启相关容器
5. 跑真实 API 复测

不要把这些中间命令逐条转交给用户。

### 5.4 数据库修复边界

直接修改 VM 上 `data.db` 属于高风险动作，只在以下条件同时满足时允许：

1. 根因已经被证实是 schema/data 层不一致
2. 已有数据库备份
3. 迁移 CLI 路径已验证不可靠或不可收口
4. 修复后会立即做 API 级复测

## 6. 这类问题的标准复测方式

涉及 `bodyFormat`、Markdown、公式渲染时，优先用 raw API 复测，而不是先点网页：

1. `POST /api/write/content` 写入 `bodyFormat: markdown`
2. `GET /api/query/content/:id` 检查：
   - `bodyFormat === "markdown"`
   - `body` 是原始 Markdown
   - `renderedBodyHtml/htmlContent` 是渲染后的 HTML

只有这一步成立后，再去看网页层的 `iframe sandbox` 和 KaTeX/CDN。

## 7. 文档优先级

涉及运行和运维时，优先参考：

- [docs/Operations/vm-runtime-handbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/vm-runtime-handbook.md)
- [docs/Operations/common-scripts-and-copyable-commands.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/common-scripts-and-copyable-commands.md)
- [docs/Operations/code-change-sync-and-restart.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/code-change-sync-and-restart.md)

如果这些文档和当前真实环境冲突，以真实运行状态为准，并顺手把文档补齐。

## 8. 这个仓库对 agent 的最低要求

进入本仓库后，agent 至少应做到：

1. 不把显然可以自己执行的 VM 命令转给用户手工做。
2. 不在未验证的情况下声称修复完成。
3. 遇到 `192.168.2.9` 时，优先想到 `vm-accept` 和 `multipass`。
4. 遇到 PocketBase schema 问题时，同时检查物理表和 `_collections.schema`。
5. 修改运维路径后，把经验补回 `docs/Operations/` 或本文件。
