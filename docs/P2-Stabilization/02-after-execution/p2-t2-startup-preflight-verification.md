---
doc_id: "p2_t2_startup_preflight_verification"
phase: "executing-plans"
artifact: "verification"
status: "draft"
derived_from:
  - "phase_2_tasks"
  - "p2_t1_mvp_scope_freeze"
updated_at: "2026-04-19"
---

# P2-T2 Startup Preflight Verification

## 1. 目标

验证 `P2-T2` 已把启动前自检接入 PocketBase 与业务壳启动链路，并且覆盖本项目实际踩过的主要问题：

- `.env` 缺失
- 管理员账号密码未配置
- PocketBase 未启动
- 业务壳端口占用
- PocketBase 二进制或目录缺失

## 2. 本次实现

本次新增或调整：

- `scripts/preflight.sh`
- `scripts/preflight_check.js`
- `scripts/start_pocketbase.sh`
- `scripts/start_service.sh`
- `src/config.js`
- `tests/config.test.js`

## 3. 预检覆盖项

### 3.1 `pocketbase` 模式

检查项：

1. `.env` 存在
2. `PB_PORT` 为合法端口
3. PocketBase 二进制存在且可执行
4. `pb_migrations/` 存在
5. 数据目录、公开目录、工作目录可创建
6. `PB_PORT` 未被占用

### 3.2 `service` 模式

检查项：

1. `.env` 存在
2. `SERVICE_PORT` 为合法端口
3. `PB_ADMIN_EMAIL` 已填写
4. `PB_ADMIN_PASSWORD` 已填写
5. 工作目录可创建
6. `SERVICE_PORT` 未被占用
7. `PB_BASE_URL/api/health` 可访问
8. Node 配置层再次校验管理员凭据

## 4. 验证方式

执行：

```bash
node --test tests/config.test.js
node --test
```

手工检查点：

1. `bash ./scripts/preflight.sh pocketbase`
2. `bash ./scripts/preflight.sh service`
3. `./scripts/start_pocketbase.sh`
4. `./scripts/start_service.sh`

预期行为：

- 预检失败时脚本直接退出，并给出明确修复提示。
- 预检通过时才进入真正启动。
- 业务壳启动前必须确认 PocketBase 健康检查可达。

## 5. 结果口径

`P2-T2` 完成后，项目不再要求用户先碰到 `EADDRINUSE`、缺失凭据或 PocketBase 未启动这类运行期错误，启动脚本应在前置阶段就阻断并提示。

本次未覆盖：

- 守护进程化 stop/restart 管理
- PocketBase 集合结构自动修复
- 远程部署环境下的进程编排
