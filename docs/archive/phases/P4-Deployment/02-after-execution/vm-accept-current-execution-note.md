# VM Accept Current Execution Note

本文档只服务当前这台重建后的验收机 `vm-accept`，用于把“当前事实、最小执行顺序、标准停机方式”固定下来，避免继续误用历史 `ubu2404` 信息。

本文档不是“已完成验收”的结论文档。

## 1. 当前事实

- VM 名称：`vm-accept`
- 系统：Ubuntu `24.04.4 LTS`
- 局域网 IP：`192.168.2.9`
- 项目目录：`/opt/static-content-service`
- 当前目标：先完成新数据目录上的 PocketBase admin 对齐、`users_api` demo key 初始化，再推进 VM 全量业务验收

当前已知运行状态：

1. Docker、Compose、Nginx 已在 `vm-accept` 上跑起来。
2. `app` 和 `pocketbase` 镜像已在 VM 内本地构建成功。
3. Nginx 转发链路已通。
4. `http://192.168.2.9/api/health` 已通。
5. `http://192.168.2.9/web/auth/login` 已通。
6. `http://192.168.2.9/web/public/list` 之前返回 `500`，当前已知根因是 PocketBase admin 认证失败，而不是 Nginx 故障。

## 2. 当前硬约束

1. 所有 VM compose 命令都必须显式带 `--project-directory .`
2. VM 上统一使用仓库根目录 `.env`
3. 不要创建 `deploy/vm-compose/.env`
4. 不要把 `ubu2404` 的机器名和 IP 当成当前事实
5. 不要把“容器 healthy”直接视为“业务验收完成”

## 3. 当前最小执行顺序

### 3.1 先核对根目录 `.env`

至少确认：

```env
PB_BASE_URL=http://pocketbase:8090
SERVICE_HOST=0.0.0.0
PUBLIC_BASE_URL=http://192.168.2.9
PB_ADMIN_EMAIL=<real-admin-email>
PB_ADMIN_PASSWORD=<real-admin-password>
```

### 3.2 再对齐 PocketBase admin

已用仓库内真实 PocketBase 二进制确认：

```bash
./pocketbase/bin/pocketbase admin --help
```

当前只支持：

1. `create`
2. `delete`
3. `update`

因此：

1. 如果当前数据目录里还没有管理员，用 `admin create`。
2. 如果当前数据目录里已有同邮箱管理员但密码与 `.env` 不一致，用 `admin update`。
3. 不要继续猜测不存在的 admin 子命令。

### 3.3 再补 `users_api` demo key

进入 PocketBase 后台后，确认迁移后的集合已存在：

1. `users_api`
2. `contents`
3. `share_links`

然后在 `users_api` 中手工补一条记录，例如：

```json
{
  "display_name": "VM Accept Demo User",
  "api_key": "vm_accept_demo_api_key_0001"
}
```

### 3.4 再跑 VM 验收脚本

顺序：

1. `scripts/vm_demo_step0_precheck.sh`
2. `scripts/vm_demo_step1_write_and_share.sh`
3. `scripts/vm_demo_step2_print_and_verify.sh`
4. `scripts/vm_demo_step3_cleanup.sh`

在这之前必须先导出真实 `DEMO_API_KEY`。

### 3.5 从 VM 外部直接通过 Open API 上传文件

如果你要模拟“书童四九”作为外部调用方上传新文件，而不是登录 VM 内部 shell 手工上传，可直接在外部机器执行：

```bash
bash ./scripts/external_upload_file.sh '/absolute/path/to/your-file.pdf' '自定义标题'
```

默认约定：

1. 目标入口取 `DEMO_SERVICE_BASE_URL`，未设置时回退到 `PUBLIC_BASE_URL`，再回退到 `http://192.168.2.9`
2. API key 默认取 `DEMO_API_KEY`，未设置时回退到旧样例 `t1_verify_api_key_0001`
3. 执行完成后会直接打印 `contentId`、`contentHash`、detail URL 与 direct URL

### 3.6 从 VM 外部直接删除内容

如果你是通过 VM 外部 Open API 单独上传了一条内容，而不是通过 `vm_demo_step1_write_and_share.sh` 写入的演示内容，那么清理时不能只依赖 `vm_demo_step3_cleanup.sh`。

可直接在外部机器执行：

```bash
bash ./scripts/external_delete_content.sh '<contentId>'
```

默认约定：

1. 目标入口取 `DEMO_SERVICE_BASE_URL`，未设置时回退到 `PUBLIC_BASE_URL`，再回退到 `http://192.168.2.9`
2. API key 默认取 `DEMO_API_KEY`，未设置时回退到旧样例 `t1_verify_api_key_0001`
3. 该脚本只按 `contentId` 删除一条内容，不会自动清理由 `vm_demo_step1_write_and_share.sh` 生成的整套 demo state

## 4. VM 上可直接执行的最小命令

```bash
cd /opt/static-content-service
grep -E '^(PB_ADMIN_EMAIL|PB_ADMIN_PASSWORD|PB_BASE_URL|SERVICE_HOST|PUBLIC_BASE_URL)=' .env
```

如需创建 admin：

```bash
cd /opt/static-content-service
./pocketbase/bin/pocketbase admin create '<email>' '<password>' --dir ./pocketbase/data
```

如需更新 admin 密码：

```bash
cd /opt/static-content-service
./pocketbase/bin/pocketbase admin update '<email>' '<password>' --dir ./pocketbase/data
```

对齐后重启服务：

```bash
cd /opt/static-content-service
APP_ENV_FILE=.env docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d
```

执行验收前预检：

```bash
cd /opt/static-content-service
export DEMO_API_KEY='vm_accept_demo_api_key_0001'
bash ./scripts/vm_demo_step0_precheck.sh
```

## 5. 标准停机方式

如果本轮结束后需要停这台 VM，先按标准顺序停业务，再停机：

```bash
cd /opt/static-content-service
sudo systemctl stop static-content-compose
sudo systemctl status static-content-compose --no-pager
sudo systemctl stop nginx
sudo systemctl status nginx --no-pager
sudo shutdown -h now
```

如果只是暂停验收，不关机：

```bash
cd /opt/static-content-service
sudo systemctl stop static-content-compose
sudo systemctl stop nginx
```

下次恢复时：

```bash
sudo systemctl start nginx
sudo systemctl start static-content-compose
```

这样做的目的不是追求形式，而是避免在 Compose、Nginx、PocketBase 数据目录仍处于工作状态时直接粗暴关闭 VM，给下一轮验收留下不一致状态。
