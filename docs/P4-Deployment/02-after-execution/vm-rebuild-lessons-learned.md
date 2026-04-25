# VM Rebuild Lessons Learned

本文档记录本次在本地 Multipass 环境中重建 Ubuntu `24.04` VM、重新部署 `PocketBase + app + Nginx` 时踩到的真实问题、定位方式和修正结论。

文档定位：

- 这不是新的标准模板，而是一次真实重建过程的复盘。
- 如果你要在一台新 VM 上从零部署，请配合 [vm-compose-production-template.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-compose-production-template.md) 和 [vm-go-live-short-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-go-live-short-checklist.md) 一起看。
- 如果你要理解最初的部署路线，请看 [vm-and-docker-deployment-guide.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/01-before-execution/vm-and-docker-deployment-guide.md)。

## 1. 本次重建事实

本次不是在原 `ubu2404` 上继续修补，而是先清理旧 Multipass 实例，再新建一台更大的 VM。

本次实际使用的新机器：

- VM 名称：`vm-accept`
- 系统：Ubuntu `24.04.4 LTS`
- 规格：`2 CPU / 4G RAM / 20G disk`
- 局域网 IP：`192.168.2.9`
- 项目目录：`/opt/static-content-service`

重建原因：

1. 历史 Multipass 实例较多，磁盘空间被多个废弃实例占用。
2. 旧 VM 可用磁盘过小，构建镜像时反复出现 `no space left on device`。
3. 原 `ubu2404` 已不适合作为继续验收的稳定基线。

## 2. 这次确认过的关键结论

### 2.1 先清理无用 VM，再重建大盘机器

本次实际看到：旧 Multipass 目录中多个停止实例各自占用约 `1G` 左右，`ubu2404` 单机占用约 `3.9G`，运行中的旧验收机也接近 `2.8G`。

结论：

1. 当 VM 构建容器反复出现磁盘耗尽时，不能只盯 Docker cache，也要检查宿主机上是否积累了多台废弃 VM。
2. 若当前验收目标需要反复 build image，建议直接使用至少 `20G` 磁盘的新 VM，而不是在 `4G` 左右磁盘上硬挤。

## 2.2 VM 内 Docker 拉取能力和项目可用性是两回事

本次实际遇到：

1. VM 可以访问普通外网页面。
2. 但连接 `registry-1.docker.io:443` 超时。
3. 直接 `docker compose up` 时会错误地去拉 `static-content-service-app:latest` 和 `static-content-service-pocketbase:latest`，随后因镜像不存在或镜像站拒绝而失败。

结论：

1. VM 能上网，不等于能稳定访问 Docker Hub。
2. 首轮部署前应优先确认镜像源策略；若环境在中国大陆网络下，通常需要先配置 Docker registry mirror。
3. 这个项目的生产 compose 依赖本地构建镜像，不能把 `compose up` 当成“自动会帮你从公网拿到正确镜像”。

## 2.3 代码同步到 VM 时，不能只传 `deploy/scripts/docs`

本次早期只把 `deploy`、`scripts`、`docs` 复制进 VM，结果 compose 文件虽然存在，但 `docker/app.Dockerfile` 与 `docker/pocketbase.Dockerfile` 不在 VM 内，导致构建报错。

实际报错特征：

- `unable to evaluate symlinks in Dockerfile path`
- `lstat /opt/static-content-service/docker/app.Dockerfile: no such file or directory`

结论：

1. 新 VM 初始化时，应复制完整项目目录，至少包含 `docker/`、`src/`、`pb_migrations/`、`.env.example`、`package*.json`。
2. 如果采用分目录打包复制，复制完成后要先检查关键文件是否存在，再开始构建。

建议最小检查项：

1. `docker/app.Dockerfile`
2. `docker/pocketbase.Dockerfile`
3. `deploy/vm-compose/docker-compose.prod.yml`
4. `scripts/vm_demo_step0_precheck.sh`

## 2.4 Compose 子目录运行时必须显式带 `--project-directory .`

这一点在旧文档已经提过，但本次重建再次证明它不是“可选建议”，而是硬约束。

如果省略 `--project-directory .`，典型后果包括：

1. 相对路径按 `deploy/vm-compose/` 错误解析。
2. `workspace`、`pocketbase/data`、`.env` 挂载位置错位。
3. 明明仓库根目录文件存在，但 compose 执行时仍表现为“找不到文件”或“容器内状态不一致”。

## 2.5 `.env` 至少有两类值不能错

本次确认，VM compose 形态下最关键的是两组变量。

第一组是容器间链路：

```env
PB_BASE_URL=http://pocketbase:8090
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8787
```

第二组是外部入口感知：

```env
PUBLIC_BASE_URL=http://192.168.2.9
```

本次还确认：

```env
PB_HOST=0.0.0.0
PB_PORT=8090
```

也应与容器化部署形态保持一致。

错误表现：

1. `SERVICE_HOST=127.0.0.1` 时，容器健康检查可能通过，但宿主机映射访问会出现连接重置或入口不稳定。
2. `PB_BASE_URL` 写成 `http://127.0.0.1:8090` 时，`app` 容器会把自己容器内的回环地址误当成 PocketBase。
3. `PUBLIC_BASE_URL` 不等于真实 VM IP 时，页面内生成的外链和分享入口会错。

## 2.6 `curl -I` 对页面路由返回 `405` 不等于页面坏了

本次在检查：

- `/web/auth/login`
- `/web/public/list`

时，曾因 `curl -I` 收到 `405 Method Not Allowed` 误以为是页面不可用。后续改用普通 `GET` 请求后确认页面实际可访问。

结论：

1. 页面路由的健康验证应该优先使用 `curl -fsS URL >/dev/null` 或浏览器直接打开。
2. `HEAD` 对页面路由不一定被应用支持，不能把 `405` 直接当成部署失败。

## 2.7 Nginx 这一步最容易被复制断行破坏

本次多次出现：

1. heredoc 因复制断行没有正确闭合。
2. `proxy_pass` 被拆成两行。
3. `proxy_set_header` 指令参数被截断。

最终表现为：

- `unexpected end of file`
- `invalid number of arguments in "proxy_set_header" directive`
- `502 Bad Gateway`

结论：

1. 给终端复制的命令必须尽量短，避免长 heredoc。
2. 改完 Nginx 后必须先 `sudo nginx -t`，通过后再 reload 或 restart。
3. 如果页面出现 `502`，不要先怀疑 Nginx 本身，先确认 `app` 是否真的在宿主机 `127.0.0.1:8787` 正常可读。

## 2.8 `app` 健康与页面真实可用之间仍有一层差异

本次有一个很容易误判的阶段：

1. `docker compose ps` 显示 `app` healthy。
2. `ss -ltnp` 也能看到 `127.0.0.1:8787` 在监听。
3. 但 `curl http://127.0.0.1:8787/api/health` 一度出现 `Recv failure: Connection reset by peer`。

后续修正 `SERVICE_HOST=0.0.0.0` 并重启 compose 后，`/api/health` 才稳定返回 200。

结论：

1. 不要只看 `healthy` 标记。
2. 宿主机 `curl 127.0.0.1:8787/api/health` 必须作为真正的就绪判据之一。

## 2.9 新 PocketBase 数据目录里，管理员账号不是自动对上的

这是本轮最后暴露出来的真实业务问题。

现象：

1. `app` 已经启动。
2. `/web/auth/login` 能打开。
3. `/web/public/list` 返回 `500`。
4. `app` 日志显示 `authenticate_admin` 失败，PocketBase 返回 `400 Failed to authenticate.`。

原因：

1. 这是新的 PocketBase 数据目录。
2. `.env` 中的 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 没有自动变成新库中的真实管理员账号。
3. 应用在访问受保护集合前需要先用这组管理员账号登录 PocketBase，因此 public list 也会被连带拖死。

结论：

1. 新 VM 上第一次起 PocketBase 后，必须先完成管理员初始化或密码重置，再谈业务验收。
2. 不能把“容器 healthy”误认为“业务读写链路可用”。
3. `users_api` 里的 demo API key 也不是自动存在的，必须显式创建一条记录后再跑 VM 验收脚本。

### 2.10 PocketBase CLI 只确认过 `admin create` / `admin update`

本次已用仓库内真实 PocketBase 二进制确认：

```bash
./pocketbase/bin/pocketbase admin --help
```

当前 `admin` 下只有：

1. `create`
2. `delete`
3. `update`

这意味着：

1. 不要假设存在别的 admin 初始化魔法子命令。
2. 如果当前数据目录里还没有管理员，应使用 `admin create <email> <password>` 或直接在 `/_/` 后台首登创建。
3. 如果当前数据目录里已经有同邮箱管理员但密码不一致，应使用 `admin update <email> <password>` 统一到根目录 `.env`。
4. `users_api` 的 demo key 仍需单独创建一条记录，admin CLI 不会顺手替你补这份业务数据。

## 3. 当前可以复用的稳定做法

按本次实战，比较稳的顺序应是：

1. 先清理宿主机上废弃 Multipass 实例。
2. 直接新建 `20G` 级别磁盘的 Ubuntu `24.04` VM。
3. 把完整仓库复制进 VM，而不是只传部署子目录。
4. 先检查关键文件是否齐全。
5. 先配置 Docker registry mirror，再开始首轮 image build。
6. 修改根目录 `.env`，至少确认 `PB_BASE_URL`、`SERVICE_HOST`、`PUBLIC_BASE_URL`。
7. 本地 build 两个镜像。
8. 用 `--project-directory .` 起 compose。
9. 先验证：
   - `http://127.0.0.1:8090/api/health`
   - `http://127.0.0.1:8787/api/health`
10. 再接 Nginx，并用 `GET` 请求验证：
   - `/api/health`
   - `/web/auth/login`
   - `/web/public/list`
11. 最后再处理 PocketBase admin 初始化、`users_api` demo key 和完整业务验收脚本。

补充：在新数据目录上，较稳的最小初始化顺序应为：

1. 先确认根目录 `.env` 中的 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 就是你要保留的最终值。
2. 再在当前数据目录上执行一次 PocketBase admin 初始化或密码统一。
3. 再进入 PocketBase 后台，确认 `users_api` / `contents` / `share_links` 已存在。
4. 再在 `users_api` 中手工创建一条 demo API key 记录。
5. 最后再跑 `scripts/vm_demo_step0_precheck.sh` 与后续业务验收脚本。

## 4. 对 P4 文档的修正建议

本次复盘后，后续阅读 P4 时应遵守以下原则：

1. `ubu2404` 相关文档只能视为一次历史落地记录，不能默认等同于当前真实机器状态。
2. 如果当前实际在维护的是新机器，应以新的 VM 名称、IP 和磁盘规格为准补充验收记录。
3. 所有“能否访问页面”的验证应区分：
   - Nginx 是否工作
   - app 是否能从宿主机访问
   - app 是否能成功认证 PocketBase admin
   - demo API key 是否已初始化

## 5. 当前收口判断

截至本次复盘，可确认已经重新建立的是：

1. 新 VM 基础环境可用。
2. Compose 两容器可构建并启动。
3. Nginx 反向代理链路可接通。
4. `/api/health` 与 `/web/auth/login` 已跑通。

仍未自动成立的部分是：

1. 新 PocketBase 管理员账号与 `.env` 的一致性。
2. `users_api` 演示 key 初始化。
3. `vm_demo_step0/1/2/3` 的完整业务验收闭环。

因此，本次经验教训最重要的一条是：

部署链路跑通，不等于业务验收完成。新 VM 尤其要先补“数据初始化”这一层。
