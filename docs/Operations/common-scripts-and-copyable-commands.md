# Common Scripts And Copyable Commands

本文档只解决两个问题：

1. 仓库里哪些 `scripts/` 最常用。
2. 日常维护时，哪些命令可以直接复制执行。

如果你需要完整背景说明，配合以下文档一起看：

- [local-runtime-handbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/local-runtime-handbook.md)
- [vm-runtime-handbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/vm-runtime-handbook.md)
- [code-change-sync-and-restart.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/code-change-sync-and-restart.md)

## 1. 本机最常用脚本

### 1.1 启动前预检

用途：在真正启动前，先检查端口、目录、配置和依赖是否明显异常。

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
bash ./scripts/preflight.sh pocketbase
bash ./scripts/preflight.sh service
```

### 1.2 启动 PocketBase

用途：本机启动底座存储服务。

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
./scripts/start_pocketbase.sh
```

### 1.3 启动业务壳

用途：本机启动 Node 业务服务与网页层。

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
./scripts/start_service.sh
```

如果你要直接走 Node 默认入口，也可以：

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
npm start
```

### 1.4 冷启动 dry-run

用途：检查仓库是否具备基础冷启动条件，但不等于完成真正部署。

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
bash ./scripts/verify_coldstart_dry_run.sh
```

### 1.5 演示数据写入与清理

用途：快速生成一套演示内容、分享链接、访问地址，再在结束后清理。

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
bash ./scripts/demo_step1_write_content.sh
bash ./scripts/demo_step2_share_content.sh
bash ./scripts/demo_step3_print_access_info.sh
bash ./scripts/demo_step4_cleanup_demo_content.sh
```

### 1.6 外部文件上传与删除

用途：从仓库外部拿一个现成文件直接上传，或者按 `contentId` 删除内容。

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
bash ./scripts/external_upload_file.sh '/absolute/path/to/your-file.pdf' '自定义标题'
bash ./scripts/external_delete_content.sh '<contentId>'
```

## 2. 本机最常复制的命令

### 2.1 健康检查

```bash
curl http://127.0.0.1:8090/api/health
curl http://127.0.0.1:8787/api/health
```

### 2.2 打开常用页面

直接在浏览器打开：

- `http://127.0.0.1:8090/_/`
- `http://127.0.0.1:8787/web/auth/login`
- `http://127.0.0.1:8787/web/list`
- `http://127.0.0.1:8787/web/list?missingLocalFileOnly=1`
- `http://127.0.0.1:8787/web/public/list`

### 2.3 跑核心测试

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
node --test tests/content.test.js
```

### 2.4 只改了业务代码后的最短动作

用途：改了 `src/` 后，最常见的最短验证路径。

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
node --test tests/content.test.js
```

然后重启业务壳，再刷新：

- `http://127.0.0.1:8787/web/list`
- `http://127.0.0.1:8787/web/list?missingLocalFileOnly=1`

## 3. VM 最常用脚本

以下脚本适合在 VM 已部署完成、代码已同步到 VM 后使用。

### 3.1 VM 预检与演示验收

```bash
cd /opt/static-content-service
bash ./scripts/vm_demo_step0_precheck.sh
bash ./scripts/vm_demo_step1_write_and_share.sh
bash ./scripts/vm_demo_step2_print_and_verify.sh
bash ./scripts/vm_demo_step3_cleanup.sh
```

说明：当前 VM 验收链路默认覆盖新的 `markdown` 字符串内容写入、查询和 public/share 展示，不再依赖旧文件演示样例。

### 3.2 VM 外部上传与删除

```bash
cd /opt/static-content-service
bash ./scripts/external_upload_file.sh '/absolute/path/to/your-file.pdf' '自定义标题'
bash ./scripts/external_delete_content.sh '<contentId>'
```

## 4. VM 最常复制的命令

### 4.0 agent 直连 VM 的首选入口

如果宿主机安装了 `multipass`，并且目标 VM 就是本机实例，不要优先让用户自己 SSH 到 VM。先由 agent 或维护者在宿主机上执行：

```bash
multipass list
multipass exec vm-accept -- bash -lc 'pwd && hostname && whoami'
```

当前项目的真实实例名就是 `vm-accept`，对应 IP 为 `192.168.2.9`。

常用直连动作：

```bash
multipass exec vm-accept -- bash -lc 'cd /opt/static-content-service && sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps'
multipass exec vm-accept -- bash -lc 'cd /opt/static-content-service && sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d app'
multipass exec vm-accept -- bash -lc 'cd /opt/static-content-service && sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f app'
```

如果需要把宿主机文件直接送进 VM，可用：

```bash
multipass transfer /absolute/path/on/host vm-accept:/tmp/target-file
```

这个路径适用于：

- agent 直接接管 VM 排障
- 需要快速投递临时脚本到 VM
- SSH key 不通，但 `multipass` 可用

### 4.1 查看 Compose 与 systemd 状态

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps
sudo systemctl status static-content-compose --no-pager
sudo systemctl status nginx --no-pager
```

### 4.2 只重启 app 容器

用途：只改了业务壳代码或业务壳配置时，优先使用这个命令。

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d app
```

### 4.3 重启整套 Compose

```bash
sudo systemctl restart static-content-compose
```

如果 `static-content-compose.service` 不存在，直接退回 Compose：

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d pocketbase app
```

### 4.4 检查和重启 Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4.5 查看日志

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f app
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -f pocketbase
sudo journalctl -u static-content-compose -n 100 --no-pager
```

### 4.6 对外入口检查

把 `<vm-ip>` 换成真实 IP 或域名：

```bash
curl http://<vm-ip>/api/health
```

浏览器常用入口：

- `http://<vm-ip>/web/auth/login`
- `http://<vm-ip>/web/list`
- `http://<vm-ip>/web/list?missingLocalFileOnly=1`
- `http://<vm-ip>/web/public/list`

## 5. 推荐使用方式

如果你只是日常维护，建议按下面顺序使用：

1. 先看当前环境是“本机”还是“VM”。
2. 如果是本机 `Multipass` VM，优先走 `multipass exec`，不要先把命令转交给用户手工执行。
3. 再从本文复制对应命令。
4. 如果命令背后的原因不清楚，再回到运行手册看解释。

这样可以减少每次都去翻长文档找命令。
