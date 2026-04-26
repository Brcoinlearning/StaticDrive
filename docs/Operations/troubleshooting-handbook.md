# Troubleshooting Handbook

本文档用于日常排查，按“现象 -> 先查什么 -> 再查什么”的顺序组织，不追求覆盖所有理论，只追求先把高频问题定位清楚。

## 1. 总原则

排查顺序固定为：

1. 先看 `PocketBase` 是否在线
2. 再看业务壳是否在线
3. 再看页面或接口具体是哪条链路失败
4. 再判断是否是代码未重启、配置错误、数据脏状态或 VM 同步不一致

## 2. `/api/health` 不通

### 2.1 现象

- `http://127.0.0.1:8787/api/health` 无响应
- 或返回连接失败

### 2.2 先查什么

1. 业务壳进程或 `app` 容器是否在运行
2. 当前端口是否正确
3. 最近代码改动后是否忘了重启业务壳

### 2.3 再查什么

- `.env` 中 `SERVICE_HOST` / `SERVICE_PORT` 是否和当前运行方式一致
- VM 上是否只是代码同步了，但服务没重启

## 3. `PocketBase /api/health` 不通

### 3.1 现象

- `http://127.0.0.1:8090/api/health` 无响应

### 3.2 先查什么

1. PocketBase 是否启动
2. 端口是否变化
3. 数据目录或运行命令是否被改过

### 3.3 说明

如果 PocketBase 本身不通，owner/public 页面后续问题基本都不必先往页面层查。

## 4. owner 登录页打不开

### 4.1 现象

- `/web/auth/login` 不能访问
- 或直接返回 500

### 4.2 先查什么

1. `http://127.0.0.1:8787/api/health`
2. 业务壳是否已按最新代码运行
3. 反向代理是否已把请求转到业务壳

### 4.3 再查什么

- VM 上 Nginx 是否正常
- 是否访问了错误域名、错误端口、错误 IP

## 5. owner 登录提交后失败

### 5.1 现象

- `/web/auth/login` 能打开
- 但提交 API Key 后不能进入 `/web/list`

### 5.2 先查什么

1. `users_api` 里是否真有这条 API Key
2. `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 是否与当前数据目录中的管理员一致
3. PocketBase 是否可被业务壳访问

## 6. `/web/public/list` 返回 500

### 6.1 现象

- owner 登录页能打开
- public list 返回 500

### 6.2 先查什么

1. 业务壳 `api/health` 是否正常
2. PocketBase 管理员配置是否正确
3. 当前数据目录里管理员是否已初始化

### 6.3 经验判断

这类问题很多时候不是 Nginx 坏了，而是 `app -> PocketBase` 的受保护读取链路没有打通。

## 7. owner 列表里有记录，但文件打不开或状态异常

### 7.1 现象

- `/web/list` 有文件记录
- 但对应物理文件已不存在

### 7.2 先查什么

1. 打开 `/web/list?missingLocalFileOnly=1`
2. 看页面是否提示 `本地文件缺失`
3. 确认你是否手工删除过 `workspace/content-files/`

### 7.3 处理方式

- 重新上传替代内容
- 或在 owner 页面用 `清理缺失文件记录` 删除脏记录

## 8. VM 上代码似乎没生效

### 8.1 现象

- 本地已经修好
- VM 上页面或接口仍表现为旧逻辑

### 8.2 先查什么

1. VM 上代码是否已经同步
2. `app` 是否已经重启
3. 是否只改了代码但没重启容器

### 8.3 处理方式

优先按这条最短命令重启 `app`：

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d app
```

## 9. 容器显示 healthy，但业务仍异常

### 9.1 说明

`healthy` 不等于业务链路一定正常。

### 9.2 必做检查

至少继续确认：

1. `curl http://127.0.0.1:8787/api/health`
2. `/web/auth/login`
3. `/web/public/list`

## 10. 页面路由 `curl -I` 返回 405

### 10.1 说明

像 `/web/auth/login`、`/web/public/list` 这类页面路由，如果用 `curl -I` 返回 `405 Method Not Allowed`，不代表页面坏了。

原因通常只是：

- 你发的是 `HEAD`
- 但应用只实现了 `GET`

应改用浏览器或普通 `GET` 验证。

## 11. 遇到问题时最小排查顺序

如果你不确定从哪开始，直接按这个顺序：

1. `curl http://127.0.0.1:8090/api/health`
2. `curl http://127.0.0.1:8787/api/health`
3. 打开 `/web/auth/login`
4. 打开 `/web/public/list`
5. 如果是 owner 文件问题，再打开 `/web/list?missingLocalFileOnly=1`

## 12. 与其他文档关系

- 发布顺序看 [release-and-commit-playbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/release-and-commit-playbook.md)
- 同步与重启规则看 [code-change-sync-and-restart.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/code-change-sync-and-restart.md)
- 目录与数据问题看 [data-and-storage-operations.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/data-and-storage-operations.md)
- 地址速查看 [routes-and-urls-cheatsheet.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/routes-and-urls-cheatsheet.md)
