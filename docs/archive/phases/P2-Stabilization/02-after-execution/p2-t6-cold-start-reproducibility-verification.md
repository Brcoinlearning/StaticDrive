---
doc_id: "p2_t6_cold_start_reproducibility_verification"
phase: "executing-plans"
artifact: "verification"
status: "draft"
derived_from:
  - "phase_2_tasks"
  - "p2_t2_startup_preflight_verification"
  - "p2_t5_runtime_diagnostics_verification"
updated_at: "2026-04-19"
---

# P2-T6 Cold Start Reproducibility Verification

## 1. 目标

验证当前仓库在接近空环境的前提下，是否具备“被重新搭起并完成最小验收”的可重复性基础，并明确：

- 哪些步骤已经可以在仓库内自动验证
- 哪些步骤仍然必须人工完成
- 当前执行环境下无法自动闭合的阻塞点是什么

## 2. 结论口径

本次 `P2-T6` 的结论是：

1. 当前仓库已经具备冷启动 dry-run 能力，可自动验证关键仓库前提、脚本语法和自动化测试通过状态。
2. 当前仓库尚不具备“完全无人值守冷启动到服务可用”的闭环，因为仍依赖：
   - 联网下载 PocketBase 二进制
   - 人工创建 PocketBase 管理员账号
   - 人工插入 `users_api` 样例用户
3. 因此本任务不宣称“完整冷启动自动跑通”，而是把真实可复现边界明确沉淀下来。

## 3. 本次新增

- `scripts/verify_coldstart_dry_run.sh`

该脚本用于验证仓库内部可自动确认的冷启动前提，不负责联网安装、不负责启动真实 PocketBase 服务，也不负责替代 PocketBase 后台人工初始化。

## 4. Dry-Run 覆盖项

`bash ./scripts/verify_coldstart_dry_run.sh` 当前覆盖：

1. 关键仓库文件存在：
   - `package.json`
   - `.env.example`
   - `README.md`
   - `scripts/install_pocketbase.sh`
   - `scripts/preflight.sh`
   - `scripts/start_pocketbase.sh`
   - `scripts/start_service.sh`
2. 关键目录存在：
   - `pb_migrations/`
   - `src/`
   - `tests/`
3. Shell 脚本语法有效
4. Node 版本满足 `>=20`
5. `node --test` 通过

## 5. 当前无法自动闭合的步骤

以下步骤仍然需要人工或外部环境能力：

### 5.1 PocketBase 下载

`scripts/install_pocketbase.sh` 依赖外网下载 GitHub Release 二进制，因此不能在无网络或受限沙箱里被视为可自动闭环。

### 5.2 `.env` 实际凭据填写

业务壳运行依赖：

- `PB_ADMIN_EMAIL`
- `PB_ADMIN_PASSWORD`

这些值必须对应真实 PocketBase 管理员账号，不能由仓库默认静态提供。

### 5.3 PocketBase 管理后台初始化

首次启动后仍需人工完成：

1. 创建管理员账号
2. 确认迁移集合已建立
3. 在 `users_api` 中插入可用 API Key 样例用户

### 5.4 真服务级联调

即使 dry-run 通过，仍需人工启动：

1. PocketBase
2. 业务壳服务
3. 再执行最小手工 smoke check

## 6. 建议的冷启动顺序

推荐顺序：

1. `cp .env.example .env`
2. 填写 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD`
3. `./scripts/install_pocketbase.sh`
4. `bash ./scripts/verify_coldstart_dry_run.sh`
5. `./scripts/start_pocketbase.sh`
6. 完成 PocketBase 后台初始化
7. `./scripts/start_service.sh`
8. 按 `docs/archive/phases/P1-MVP/02-after-execution/manual-check-guide.md` 执行最小验收

## 7. 当前执行环境中的实际阻塞

本次执行环境里，无法把完整冷启动自动跑到服务可用，原因有两类：

1. 当前环境不能把“联网下载 PocketBase 二进制”视为已完成的自动步骤。
2. 当前环境不能替代 PocketBase 后台的人工作业步骤。

因此本次验证采用的是“dry-run + 人工步骤边界”口径，而不是伪造一次并不成立的全自动冷启动成功结论。

## 8. 验证方式

执行：

```bash
bash ./scripts/verify_coldstart_dry_run.sh
```

同时确认：

- `node --test` 通过
- 冷启动必须人工完成的步骤已经在文档中显式列出
- 预检脚本与联调手册已能承接这些人工步骤

## 9. 结果口径

`P2-T6` 完成后，项目具备了“仓库内部可自动确认 + 外部人工步骤清晰列出”的冷启动复现说明，不再依赖隐性知识。

本次未覆盖：

- 完整无人值守环境搭建
- PocketBase 后台自动建 admin
- 样例用户自动灌库
- 浏览器级 E2E 冷启动验收
