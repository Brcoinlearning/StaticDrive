# Linux VM Deployment Playbook

> 新机器部署默认入口：如果你的目标是“把当前项目部署到一台新的 Linux 机器”，请从本文开始，不要先跳到历史机器文档。

本文档给出一套面向“下一台新 Linux 机器”的可重复部署范式，目标不是解释所有背景，而是把当前仓库已经验证过的结构、顺序和硬约束压缩成一套可以照着执行的标准路线。

本文档严格沿用当前 P4 已确认的部署结构，不重新发明新流程。

关联文档：

- 最短执行清单见 [vm-go-live-short-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-go-live-short-checklist.md)
- 生产 compose 模板见 [vm-compose-production-template.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-compose-production-template.md)
- 重建教训见 [vm-rebuild-lessons-learned.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-rebuild-lessons-learned.md)
- 本次真实新机结果见 [vm-accept-acceptance-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-accept-acceptance-closeout.md)

## 1. 适用范围

这套范式适用于：

1. 一台新的 Ubuntu `22.04` 或 `24.04` Linux 虚拟机。
2. 当前项目仍沿用 `PocketBase + app + Nginx` 结构。
3. 当前项目仍沿用 `deploy/vm-compose/docker-compose.prod.yml` 作为生产 compose 文件。

## 2. 不可变约束

在任何新机器上，都必须先接受这几条约束：

1. 所有 VM compose 命令必须显式带 `--project-directory .`
2. VM 上统一只使用仓库根目录 `.env`
3. 不要创建 `deploy/vm-compose/.env`
4. 不要把历史机器名、IP、磁盘状态当成当前事实
5. 不要把“容器 healthy”直接等同于“业务验收完成”

## 3. 标准目录与配置结构

推荐固定目录：

```text
/opt/static-content-service
```

至少保证新机器上有这些内容：

```text
/opt/static-content-service
  ├── .env
  ├── docker-compose.yml
  ├── deploy/vm-compose/docker-compose.prod.yml
  ├── docker/
  ├── pb_migrations/
  ├── scripts/
  ├── src/
  ├── pocketbase/data/
  ├── pocketbase/public/
  └── workspace/
```

关键提醒：

1. 新机器初始化时，不能只同步 `deploy/`、`scripts/`、`docs/`。
2. `docker/` 和 `pb_migrations/` 缺失时，容器和业务链路都可能表现为“局部能启动、业务仍报错”的假象。

## 4. 标准执行顺序

### 4.1 先准备基础依赖

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git curl
sudo systemctl enable docker
sudo systemctl start docker
```

### 4.2 再同步完整仓库

```bash
cd /opt
sudo git clone <your-repo-url> static-content-service
sudo chown -R $USER:$USER /opt/static-content-service
cd /opt/static-content-service
```

同步后先检查：

```bash
ls docker
ls pb_migrations
ls deploy/vm-compose
ls scripts
```

### 4.3 再准备根目录 `.env`

```bash
cp .env.docker.example .env
vi .env
```

至少确认：

```env
PB_BASE_URL=http://pocketbase:8090
SERVICE_HOST=0.0.0.0
PUBLIC_BASE_URL=http://<your-vm-ip>
PB_ADMIN_EMAIL=<real-admin-email>
PB_ADMIN_PASSWORD=<real-admin-password>
```

### 4.4 先本地 build 镜像，再起生产 compose

原因：

1. 生产 compose 使用的是本地镜像名，不直接带 `build:`。
2. 如果直接在生产 compose 上 `up`，Docker 往往会尝试从外部拉 `static-content-service-app:latest` 和 `static-content-service-pocketbase:latest`。

正确顺序：

```bash
cd /opt/static-content-service
APP_ENV_FILE=.env docker compose --project-directory . --env-file .env build
APP_ENV_FILE=.env docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d
APP_ENV_FILE=.env docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps
```

## 5. 首次启动后的最小验证顺序

必须按层验证，不要跳步：

### 5.1 先验证宿主机本地 health

```bash
curl http://127.0.0.1:8090/api/health
curl http://127.0.0.1:8787/api/health
```

### 5.2 再验证 Nginx 入口

```bash
curl http://<your-vm-ip>/api/health
curl http://<your-vm-ip>/web/auth/login
curl http://<your-vm-ip>/web/public/list
```

### 5.3 页面路由不要只用 `curl -I`

像 `/web/auth/login`、`/web/public/list` 这类页面路由，`HEAD` 收到 `405` 不代表页面坏了，优先用普通 `GET`。

## 6. 首次启动后必须完成的两项初始化

### 6.1 PocketBase admin 对齐

当前仓库已确认真实 CLI 为：

```bash
./pocketbase/bin/pocketbase admin --help
```

`admin` 只有：

1. `create`
2. `delete`
3. `update`

含义是：

1. 如果当前数据目录里没有管理员，创建一条与根目录 `.env` 完全一致的 admin。
2. 如果当前数据目录里已有同邮箱管理员但密码不一致，更新到根目录 `.env` 的同一组值。
3. 不要猜测不存在的 PocketBase admin 子命令。

### 6.2 `users_api` demo key 初始化

如果要跑 VM 验收脚本，必须先在 `users_api` 中补一条真实记录。

如果你沿用当前仓库的旧样例，建议使用：

```json
{
  "display_name": "T1 Verify User",
  "api_key": "t1_verify_api_key_0001"
}
```

## 7. 标准业务验收顺序

先导出旧样例 key：

```bash
cd /opt/static-content-service
export DEMO_API_KEY='t1_verify_api_key_0001'
```

再按顺序执行：

```bash
bash ./scripts/vm_demo_step0_precheck.sh
bash ./scripts/vm_demo_step1_write_and_share.sh
bash ./scripts/vm_demo_step2_print_and_verify.sh
```

当前这套 VM 验收脚本验证的是现版本主线的字符串内容展示链路，而不再只是早期 MVP 的文件上传演示，重点包括：

1. `bodyFormat=markdown` 的字符串内容写入。
2. `query/content` 返回原始 `body` 与 `renderedBodyHtml`。
3. public content 与 share 两条链路都能展示新的 Markdown 样例内容。
4. VM 上跑的是新的展示样例，而不是旧文件样例。

如需清理演示数据：

```bash
bash ./scripts/vm_demo_step3_cleanup.sh
```

### 7.1 外部调用方验证入口

如果你要验证的不是“登录 VM 内部 shell 跑脚本”，而是“像书童四九这样的外部调用方直接通过 Open API 上传或删除文件”，可直接在外部机器执行：

上传文件：

```bash
bash ./scripts/external_upload_file.sh '/absolute/path/to/your-file.pdf' '自定义标题'
```

删除内容：

```bash
bash ./scripts/external_delete_content.sh '<contentId>'
```

说明：

1. 这两个脚本默认使用旧样例 API key `t1_verify_api_key_0001`
2. 这两个脚本默认把目标入口解析到 `DEMO_SERVICE_BASE_URL -> PUBLIC_BASE_URL -> http://192.168.2.9`
3. 它们适合做“外部客户端通过 Open API 写入 / 删除”的人工验证，不替代 `vm_demo_step0` 到 `vm_demo_step3` 这套完整收口流程

## 8. 高风险坑位

新机器部署时，优先防这几类问题：

1. `pb_migrations/` 缺失，导致 admin 修好后仍然因为集合不存在而继续报 `404`。
2. 新数据目录中的 admin 与根目录 `.env` 不一致，导致 `/web/public/list` 返回 `500`。
3. 只看 compose `healthy`，没有继续验证宿主机 health、Nginx 入口和实际业务脚本。
4. 直接粗暴关闭 VM，没有先停 `static-content-compose` 和 `nginx`。

## 9. 标准停机与恢复

如果本轮结束后需要停机，先标准停业务，再关机：

```bash
cd /opt/static-content-service
sudo systemctl stop static-content-compose
sudo systemctl status static-content-compose --no-pager
sudo systemctl stop nginx
sudo systemctl status nginx --no-pager
sudo shutdown -h now
```

恢复时：

```bash
sudo systemctl start nginx
sudo systemctl start static-content-compose
```

## 10. 何时才算“新 Linux 机器业务已跑通”

只有在以下都成立时，才可以表述为“新 Linux 机器核心业务链路已跑通”：

1. `/api/health` 可达
2. `/web/auth/login` 可达
3. `/web/public/list` 可达
4. `vm_demo_step0_precheck.sh` 通过
5. `vm_demo_step1_write_and_share.sh` 通过
6. `vm_demo_step2_print_and_verify.sh` 通过

在此之前，最多只能说：

`部署链路部分跑通`

而不能直接说：

`业务验收完成`
