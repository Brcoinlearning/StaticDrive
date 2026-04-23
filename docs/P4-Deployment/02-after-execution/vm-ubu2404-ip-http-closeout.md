# VM ubu2404 IP/HTTP Deployment Closeout

本文档记录本次在 Ubuntu `24.04` 虚拟机 `ubu2404` 上完成的真实部署结果，覆盖当前已完成状态、后续日常运维方式、配置更新方法、升级到域名 HTTPS 的迁移路径，以及排障时应优先检查的点。

本文档的定位不是模板，而是这次真实落地的运行事实与后续操作手册。

关联文档：

- 如果你要在另一台新 VM 上重做一遍，请优先看 [vm-compose-production-template.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-compose-production-template.md)。
- 如果你只想看最短执行步骤，请看 [vm-go-live-short-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-go-live-short-checklist.md)。

## 1. 本次完成了什么

本次已经在 `ubu2404` 上完成以下工作：

1. 通过 Docker Compose 跑通 `PocketBase + app` 两容器生产形态。
2. 修正并确认 Compose 运行时必须使用仓库根目录 `.env`。
3. 修正并确认 Compose 命令必须显式带 `--project-directory .`，避免 `deploy/vm-compose/` 子目录导致相对路径解析错误。
4. 确认 `PB_BASE_URL=http://pocketbase:8090` 是容器内正确链路。
5. 完成 PocketBase admin 账号创建，并将同一组账号回写到根目录 `.env`。
6. 完成 Nginx 反向代理接入，对外通过 VM IP 的 `80` 端口提供服务。
7. 完成 `static-content-compose.service` systemd 托管，可在系统启动后自动执行 `docker compose up -d`。
8. 完成最小运行验收：
   - `http://127.0.0.1:8090/api/health`
   - `http://127.0.0.1:8787/api/health`
   - `http://192.168.2.2/api/health`
   - `http://192.168.2.2/web/auth/login`
   - `http://192.168.2.2/web/public/list`

## 2. 当前运行状态

当前部署不是“域名 + HTTPS”形态，而是“局域网 IP + HTTP”形态。

这里需要明确区分两件事：

1. 当前已经确认“部署链路可运行”，也就是 VM 上的 `Docker Compose + Nginx + systemd` 已经落地并可访问。
2. 当前还没有完成“所有业务能力在 VM 对外入口上的全量验收”，因此不能把本次结果表述为“VM 上所有功能均已完成最终验收”。

换句话说，本次已经完成的是“可运行部署”，下一步应优先完成“全量业务验收”，再决定是否继续推进公网域名与 HTTPS。

当前真实访问入口：

- `http://192.168.2.2/api/health`
- `http://192.168.2.2/web/auth/login`
- `http://192.168.2.2/web/public/list`

当前机器与环境事实：

- 主机名：`ubu2404`
- 系统：Ubuntu `24.04.4 LTS`
- SSH 用户：`ubuntu`
- 当前局域网 IP：`192.168.2.2`
- 项目目录：`/opt/static-content-service`

当前 `.env` 的关键运行值：

```env
PB_HOST=0.0.0.0
PB_PORT=8090
PB_BASE_URL=http://pocketbase:8090
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8787
PUBLIC_BASE_URL=http://192.168.2.2
```

当前生产 Compose 暴露方式：

- `pocketbase` 仅绑定宿主机 `127.0.0.1:8090`
- `app` 仅绑定宿主机 `127.0.0.1:8787`
- Nginx 监听宿主机 `80`
- 外部访问统一通过 Nginx 进入 `app`

## 3. 当前配置文件位置

本次真实运行依赖以下文件：

- 仓库根目录环境文件：`/opt/static-content-service/.env`
- Compose 文件：`/opt/static-content-service/deploy/vm-compose/docker-compose.prod.yml`
- Nginx 站点文件：`/etc/nginx/sites-available/static-content-service`
- Nginx 启用链接：`/etc/nginx/sites-enabled/static-content-service`
- systemd service：`/etc/systemd/system/static-content-compose.service`

约束：

1. VM 上统一只维护仓库根目录 `.env`。
2. 不要创建 `deploy/vm-compose/.env`。
3. 不要省略 `docker compose` 命令里的 `--project-directory .`。

## 4. 当前 Nginx 配置

本次真实生效的 Nginx 配置可等价表示为：

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

说明：

- 这是为了“先用 IP 跑通”而采用的最小配置。
- `server_name _;` 表示当前先接受默认主机头。
- 后续切换到域名时，需要把这里替换成真实域名，再执行 `certbot`。

## 5. 日常启动与重启

### 5.1 查看服务状态

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps
sudo systemctl status static-content-compose --no-pager
sudo systemctl status nginx --no-pager
```

### 5.2 手工启动 compose

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d
```

### 5.3 手工停止 compose

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml down
```

### 5.4 重启 app 容器

适用于只修改 `.env` 中站点地址、cookie、管理员账号等 app 侧配置的场景。

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d app
```

### 5.5 重启整套 Compose

```bash
cd /opt/static-content-service
sudo systemctl restart static-content-compose
```

### 5.6 重启 Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 6. 修改配置时怎么做

### 6.1 修改根目录 `.env`

编辑：

```bash
cd /opt/static-content-service
sudo vi .env
```

改完后按变更类型执行：

- 如果只改 `PUBLIC_BASE_URL`、`PB_ADMIN_EMAIL`、`PB_ADMIN_PASSWORD`、cookie 名称、session 时间等 app 配置：

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d app
```

- 如果改了可能影响两容器的公共配置，直接重启整套：

```bash
cd /opt/static-content-service
sudo systemctl restart static-content-compose
```

### 6.2 修改 Nginx 配置

```bash
sudo vi /etc/nginx/sites-available/static-content-service
sudo nginx -t
sudo systemctl reload nginx
```

### 6.3 修改 systemd compose service 模板

如果仓库里的 `deploy/vm-compose/static-content-compose.service.example` 有更新，需要重新复制并 reload：

```bash
sudo cp /opt/static-content-service/deploy/vm-compose/static-content-compose.service.example /etc/systemd/system/static-content-compose.service
sudo systemctl daemon-reload
sudo systemctl restart static-content-compose
```

## 7. 以后怎么升级到域名 + HTTPS

当前建议顺序不是立刻公网化，而是：

1. 先在当前 `192.168.2.2` 入口上完成 owner 写入、public 查看、public 下载等全量业务验收。
2. 确认 VM 上业务链路完整可用后，再进入域名、HTTPS 和非局域网访问。

当前已确认“IP + HTTP”可用。后续切换到域名时，按下面顺序做。

### 7.1 先完成域名解析

把你的域名 A 记录解析到这台 VM 的真实公网 IP。

### 7.2 改 `.env`

把：

```env
PUBLIC_BASE_URL=http://192.168.2.2
```

改成：

```env
PUBLIC_BASE_URL=https://your-domain.example.com
```

### 7.3 改 Nginx 站点配置

把当前：

```nginx
server_name _;
```

改成：

```nginx
server_name your-domain.example.com;
```

### 7.4 应用变更

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d app
sudo nginx -t
sudo systemctl reload nginx
```

### 7.5 申请证书

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example.com
```

### 7.6 验证

```bash
curl -I https://your-domain.example.com
curl -fsS https://your-domain.example.com/api/health
```

说明：

- `certbot` 不能为裸 IP 申请公网证书，所以本次 IP 形态不做 HTTPS。
- 即使后续切到域名，也不等于自动具备非局域网访问能力；域名必须解析到真实公网入口，或由路由器/宿主机完成端口映射。

## 8. 当前未完成项

截至本文档落地时，以下事项仍未完成，应作为后续工作继续推进：

1. 在当前 VM 对外入口上完成六项核心业务能力的全量验收。
2. 确认 owner 写入、public 查看、文件下载、share 访问等链路在 VM 入口下全部可用。
3. 准备公网入口条件，例如真实公网 IP 或路由器端口映射。
4. 绑定真实域名并切换到 `domain + HTTPS` 形态。

建议顺序：先验收，再公网化。
- 域名切换完成后，建议重新验证 `/web/auth/login` 和 `/web/public/list`。

## 8. 更新代码时怎么做

### 8.1 拉取代码

```bash
cd /opt/static-content-service
git status
git pull
```

说明：

- 如果仓库中有本地未提交改动，先确认是否需要保留。
- 不要在不理解改动来源的情况下直接覆盖 `.env`、Nginx 配置或 systemd 文件。

### 8.2 重新构建镜像

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env build
```

### 8.3 重启容器

```bash
cd /opt/static-content-service
sudo systemctl restart static-content-compose
```

### 8.4 升级后检查

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps
curl -fsS http://127.0.0.1:8090/api/health
curl -fsS http://127.0.0.1:8787/api/health
curl -fsS http://127.0.0.1/api/health
curl -fsS http://192.168.2.2/api/health
```

## 9. 常用排障命令

### 9.1 看 Compose 状态

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps
```

### 9.2 看 app 日志

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f app
```

### 9.3 看 PocketBase 日志

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f pocketbase
```

### 9.4 看 systemd 托管日志

```bash
sudo journalctl -u static-content-compose -n 100 --no-pager
```

### 9.5 看 Nginx 状态与测试配置

```bash
sudo systemctl status nginx --no-pager
sudo nginx -t
```

### 9.6 直接验证关键接口

```bash
curl -fsS http://127.0.0.1:8090/api/health
curl -fsS http://127.0.0.1:8787/api/health
curl -fsS http://127.0.0.1/api/health
curl -fsS http://192.168.2.2/api/health
```

## 10. 本次实战中确认过的坑

本次不是只验证“理论流程”，而是已经真实踩到并修正过以下问题：

1. `PB_BASE_URL` 在 Compose 内部必须写 `http://pocketbase:8090`，不能沿用 `127.0.0.1:8090`。
2. VM 环境必须统一使用仓库根目录 `.env`，不要额外创建 `deploy/vm-compose/.env`。
3. `docker compose` 执行 `deploy/vm-compose/docker-compose.prod.yml` 时，必须显式带 `--project-directory .`。
4. PocketBase admin 首次创建后，要把同一组账号回写到 `.env`，否则业务壳无法读取受保护集合。
5. 若 VM 网络访问 Docker Hub 不稳定，需先配置 Docker registry mirror，再执行首轮 build / up。
6. 当前用户若没有加入 Docker 组，直接执行 `docker compose` 会报 `permission denied while trying to connect to the Docker daemon socket`；可以先用 `sudo`，也可以后续补 `sudo usermod -aG docker ubuntu`。
7. 用 `curl -I` 访问 `/web/auth/login`、`/web/public/list` 这类页面路由时，返回 `405 Method Not Allowed` 不代表页面坏了；因为这是 `HEAD` 请求，应用可能只实现了 `GET`。
8. Nginx 配置若用 heredoc 写入，中途断开会导致配置文件残缺；应在 `sudo nginx -t` 通过后再 reload/restart。

## 11. 当前结论

截至本次收口，`ubu2404` 已经具备以下可用状态：

1. 以 Docker Compose 生产形态稳定运行。
2. 以 Nginx 作为入口提供局域网 IP 访问。
3. 以 systemd 托管 Compose，具备基本自恢复和开机启动能力。
4. owner 登录页与 public 列表页均可通过 VM IP 正常访问。
5. 后续只需补域名解析与 Certbot，即可升级为正式 `HTTPS` 形态。

因此，这一轮可以视为：`VM Docker 主链 + Nginx + systemd + IP/HTTP 访问` 已完成。
