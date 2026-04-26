# VM Runtime Handbook

本文档用于维护“代码已经部署在 Linux 虚拟机上”的运行环境，重点回答：

1. VM 上服务跑在哪里。
2. 常用启动、停止、重启命令是什么。
3. 常用检查地址是什么。

如果你是第一次从零部署 VM，请优先结合 [vm-go-live-short-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-go-live-short-checklist.md)。

## 1. VM 运行结构

当前推荐的 VM 运行方式是：

1. `PocketBase` 容器
2. `app` 容器
3. `Nginx` 作为宿主机反向代理
4. `systemd` 托管 Compose

## 2. 常用路径

以当前部署口径为准：

- 项目目录：`/opt/static-content-service`
- 根目录环境文件：`/opt/static-content-service/.env`
- Compose 文件：`/opt/static-content-service/deploy/vm-compose/docker-compose.prod.yml`
- Nginx 配置：`/etc/nginx/sites-available/static-content-service`
- systemd service：`/etc/systemd/system/static-content-compose.service`

## 3. 常用服务操作

### 3.1 查看状态

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps
sudo systemctl status static-content-compose --no-pager
sudo systemctl status nginx --no-pager
```

### 3.2 启动 Compose

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d
```

### 3.3 停止 Compose

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml down
```

### 3.4 重启 app 容器

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d app
```

这个命令适用于“只改了业务壳代码或业务壳配置”的场景。

### 3.5 重启整套 Compose

```bash
sudo systemctl restart static-content-compose
```

### 3.6 重启 Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 4. 常用检查地址

宿主机本机检查：

- `http://127.0.0.1:8090/api/health`
- `http://127.0.0.1:8787/api/health`

对外入口检查：

- `http://<vm-ip>/api/health`
- `http://<vm-ip>/web/auth/login`
- `http://<vm-ip>/web/list`
- `http://<vm-ip>/web/list?missingLocalFileOnly=1`
- `http://<vm-ip>/web/public/list`

如果已经切到域名，则把 `<vm-ip>` 替换为正式域名。

## 5. 常用日志命令

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f app
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f pocketbase
sudo journalctl -u static-content-compose -n 100 --no-pager
```

## 6. 日常维护原则

- 改了业务壳代码：优先只重启 `app`
- 改了 Nginx 配置：只 reload/restart `nginx`
- 改了 Compose 模板或公共环境：重启整套 Compose
- 改了 PocketBase 相关底座配置：单独评估是否要处理 `pocketbase` 容器

## 7. 与历史文档关系

如果你需要更多真实 VM 落地上下文，可继续看：

- [vm-go-live-short-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-go-live-short-checklist.md)
- [vm-ubu2404-ip-http-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-ubu2404-ip-http-closeout.md)

但日常维护时，优先以本文档作为“常用命令入口”。
