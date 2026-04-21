# VM Go-Live Short Checklist

本文档不是解释性手册，而是把真实 Linux 虚拟机上线压缩成最短执行清单。

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

## 4. 首次起容器

```bash
APP_ENV_FILE=.env docker compose -p static-content-service --env-file .env build
APP_ENV_FILE=.env docker compose -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d
APP_ENV_FILE=.env docker compose -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps
```

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

## 9. 上线后最小验证

浏览器检查：

- `https://content.example.com/web/auth/login`
- `https://content.example.com/web/public/list`

命令检查：

```bash
curl -I https://content.example.com
curl https://content.example.com/api/health
```

## 10. 故障排查

```bash
APP_ENV_FILE=.env docker compose -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps
APP_ENV_FILE=.env docker compose -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f pocketbase
APP_ENV_FILE=.env docker compose -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f app
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
