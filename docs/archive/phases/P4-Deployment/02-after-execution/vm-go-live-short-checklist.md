# VM Go-Live Short Checklist

本文档不是解释性手册，而是把真实 Linux 虚拟机上线压缩成最短执行清单。

文档定位：

- 这是“照着执行”的上线 checklist，不负责解释全部背景。
- 如果你需要理解部署结构和原因，请看 [vm-and-docker-deployment-guide.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/01-before-execution/vm-and-docker-deployment-guide.md)。
- 如果你需要完整模板，请看 [vm-compose-production-template.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-compose-production-template.md)。
- 如果你当前维护的是本轮重建后的真实验收机，请先以 [vm-rebuild-lessons-learned.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-rebuild-lessons-learned.md) 中的 `vm-accept` 事实为准，再结合本文执行。
- 如果你刚经历过旧 VM 失效、磁盘不足、重建新 VM 的场景，请补看 [vm-rebuild-lessons-learned.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-rebuild-lessons-learned.md)。

适用前提：

- 本机 Docker Desktop 已完成通过验收
- 目标机器为 Ubuntu `22.04` 或 `24.04`
- 已准备好域名或至少已有公网 IP

## 1. 装基础依赖

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git curl
sudo systemctl enable docker
sudo systemctl start docker
```

如果 VM 所在网络拉取 Docker Hub 很慢或频繁超时，先为 Docker daemon 配置 registry mirror，再执行后续 `docker compose build` / `up`。否则首轮上线很可能卡在镜像拉取，而不是项目本身。

如果你当前是用 Multipass 一类本地 VM 做演练，还应先检查宿主机上是否堆积了多台废弃实例。否则问题可能不是 Docker cache，而是整台旧 VM 本身磁盘太小。

## 2. 拉代码

```bash
cd /opt
sudo git clone <your-repo-url> static-content-service
sudo chown -R $USER:$USER /opt/static-content-service
cd /opt/static-content-service
```

## 3. 准备生产环境文件

```bash
cp .env.docker.example .env
vi .env
```

至少确认：

- `PB_ADMIN_EMAIL` 是真实管理员
- `PB_ADMIN_PASSWORD` 是真实管理员密码
- `PUBLIC_BASE_URL` 是最终域名，例如 `https://content.example.com`
- `PB_BASE_URL=http://pocketbase:8090`
- `SERVICE_HOST=0.0.0.0`

注意：

- VM 上统一使用仓库根目录 `.env`。
- 不要再创建 `deploy/vm-compose/.env`，否则很容易出现 Compose 读取一份配置、容器内挂载另一份配置的问题。
- 首次在 PocketBase 后台创建管理员账号后，要把同一组 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 回写到根目录 `.env`，否则 `app` 容器虽然能启动，但 owner 登录与受保护集合读取会失败。
- 如果是全新数据目录，`users_api` 里的演示 API key 也不会自动存在，后续跑 VM 验收脚本前要先补一条真实记录。
- 如果当前走的是“IP + HTTP 验收”而不是域名入口，`PUBLIC_BASE_URL` 应直接写成当前真实 VM IP，例如本轮的 `http://192.168.2.9`，不要继续沿用历史 `ubu2404` 的地址。

管理员初始化补充：

- 已用仓库内真实 PocketBase 二进制确认，`pocketbase admin` 当前只有 `create` / `delete` / `update`。
- 如果当前数据目录还没有管理员，可用 `pocketbase admin create <email> <password>`。
- 如果当前数据目录已有同邮箱管理员但密码与 `.env` 不一致，可用 `pocketbase admin update <email> <password>`。
- `users_api` demo key 仍需在后台单独创建记录，不能假设 admin CLI 会自动补齐业务数据。

## 4. 首次起容器

```bash
APP_ENV_FILE=.env docker compose --project-directory . -p static-content-service --env-file .env build
APP_ENV_FILE=.env docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d
APP_ENV_FILE=.env docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps
```

这里必须带 `--project-directory .`，因为 compose 文件位于 `deploy/vm-compose/` 子目录下；不显式指定时，`./workspace`、`./pocketbase/data`、`./.env` 这类相对路径可能会错误地按子目录解析。

另外，不要在关键文件还未同步完整前直接执行 build。至少先确认 `docker/app.Dockerfile`、`docker/pocketbase.Dockerfile`、`deploy/vm-compose/docker-compose.prod.yml` 都已经存在于 VM 内。

## 5. 宿主机健康检查

```bash
curl http://127.0.0.1:8090/api/health
curl http://127.0.0.1:8787/api/health
```

## 6. 配置 Nginx

```bash
sudo cp deploy/vm-compose/nginx.conf.example /etc/nginx/sites-available/static-content-service
sudo vi /etc/nginx/sites-available/static-content-service
sudo ln -s /etc/nginx/sites-available/static-content-service /etc/nginx/sites-enabled/static-content-service
sudo nginx -t
sudo systemctl reload nginx
```

必须改：

- `server_name content.example.com;` 改成你的真实域名

## 7. 配 HTTPS

```bash
sudo certbot --nginx -d content.example.com
```

## 8. 配 systemd 托管 compose

```bash
sudo cp deploy/vm-compose/static-content-compose.service.example /etc/systemd/system/static-content-compose.service
sudo systemctl daemon-reload
sudo systemctl enable static-content-compose
sudo systemctl start static-content-compose
sudo systemctl status static-content-compose
```

## 8.1 标准停机与关机前收尾

如果这台 VM 只是阶段性验收机，关机前不要直接粗暴退出宿主机或直接杀 VM。先按下面顺序收尾：

```bash
cd /opt/static-content-service
sudo systemctl stop static-content-compose
sudo systemctl status static-content-compose --no-pager
sudo systemctl stop nginx
sudo systemctl status nginx --no-pager
sudo shutdown -h now
```

如果只是临时停业务、不关机，则停在 `static-content-compose` 和 `nginx` 即可；下次恢复时按 `systemctl start` 顺序标准化启动，避免留下半关闭状态。

## 9. 上线后最小验证

浏览器检查：

- `https://content.example.com/web/auth/login`
- `https://content.example.com/web/public/list`

命令检查：

```bash
curl -I https://content.example.com
curl https://content.example.com/api/health
```

补充：页面路由不要用 `curl -I` 当成唯一判据。像 `/web/auth/login`、`/web/public/list` 这类页面路由收到 `405`，往往只是应用不支持 `HEAD`，不代表页面损坏。

## 10. 故障排查

```bash
APP_ENV_FILE=.env docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps
APP_ENV_FILE=.env docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f pocketbase
APP_ENV_FILE=.env docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f app
sudo journalctl -u static-content-compose -n 100 --no-pager
sudo nginx -t
```

## 11. 当前上线标准

如果以下都成立，就算首轮上线成功：

1. compose 两个容器稳定运行
2. `/api/health` 可达
3. `/web/auth/login` 可打开
4. `/web/public/list` 可打开
5. owner 可写入内容
6. public 可查看内容并下载文件

如果当前只完成了 `/api/health`、`/web/auth/login`、`/web/public/list` 这类最小检查，则只能说明“部署链路已跑通”，还不能直接视为“全量业务功能验收已完成”。

补充：如果你本轮先按“仅 IP、暂不绑定域名”的方式上线，可参考本次真实落地记录 [vm-ubu2404-ip-http-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-ubu2404-ip-http-closeout.md)。其中包含：

- 当前 IP/HTTP 形态下已经完成的内容
- 如何启动、停止、重启 Compose 与 Nginx
- 如何修改 `.env`、Nginx、systemd 配置
- 如何从 IP/HTTP 平滑迁移到域名/HTTPS
- 本次实战中已经确认过的常见坑位
