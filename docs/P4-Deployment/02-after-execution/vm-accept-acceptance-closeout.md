# VM Accept Acceptance Closeout

本文档记录本次在新 VM `vm-accept` 上完成的真实验收结果，作为 P4 当前“新 Linux 机器业务链路已跑通”的正式收口记录。

本文档定位：

- 这不是新的部署模板，而是 `vm-accept` 这台真实验收机的结果记录。
- 如果你要在另一台新 Linux 机器上重复落地，请优先看 [linux-vm-deployment-playbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/linux-vm-deployment-playbook.md)。
- 如果你要理解本次重建过程中踩过的坑，请看 [vm-rebuild-lessons-learned.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-rebuild-lessons-learned.md)。

## 1. 本次机器事实

- VM 名称：`vm-accept`
- 系统：Ubuntu `24.04.4 LTS`
- 局域网 IP：`192.168.2.9`
- 项目目录：`/opt/static-content-service`

本次执行时统一遵守：

1. VM 上统一使用仓库根目录 `.env`
2. 不创建 `deploy/vm-compose/.env`
3. 所有 VM compose 命令显式带 `--project-directory .`

## 2. 本次实际修复了什么

本次在 `vm-accept` 上真实修复了两类阻塞：

1. `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 对应的 PocketBase admin 在当前数据目录中不存在，导致 `app` 调 `POST /api/admins/auth-with-password` 返回 `400 Failed to authenticate.`
2. `vm-accept` 工作区中的 `pb_migrations/` 目录为空，导致 `users_api`、`contents`、`share_links` 集合没有随当前数据目录正确初始化，进而使 `/web/public/list` 在 admin 对齐后继续暴露出 `404`。

本次处理方式：

1. 沿用根目录 `.env` 中已有的旧管理员账号密码，在当前 PocketBase 数据目录中补建同一组 admin。
2. 把缺失的 `pb_migrations/*.js` 文件补回 `vm-accept` 工作区，并同步进运行中的 `pocketbase` 容器。
3. 沿用旧样例数据，在 `users_api` 中创建：

```json
{
  "display_name": "T1 Verify User",
  "api_key": "t1_verify_api_key_0001"
}
```

## 3. 本次实际验证结果

### 3.1 最小入口验证

已真实确认：

- `http://192.168.2.9/api/health`
- `http://192.168.2.9/web/auth/login`
- `http://192.168.2.9/web/public/list`

三者在本次收口时均可访问，其中 `/web/public/list` 已从历史的 `500` 恢复为 `200`。

### 3.2 脚本化业务验收

本次已真实执行并通过：

```bash
bash ./scripts/vm_demo_step0_precheck.sh
bash ./scripts/vm_demo_step1_write_and_share.sh
bash ./scripts/vm_demo_step2_print_and_verify.sh
```

本次已真实执行并通过清理：

```bash
bash ./scripts/vm_demo_step3_cleanup.sh
```

### 3.3 业务链路结论

本次已真实确认以下能力在 `vm-accept` 对外入口下可用：

1. owner 可通过 Open API 写入文件。
2. owner 可通过 Open API 写入富文本。
3. public list 页面可查看已发布内容。
4. public search 页面可搜索已发布内容。
5. public detail 页面可打开文件与富文本内容。
6. 文件 direct public content 可读。
7. 文件 share 与 HTML share 可访问。

## 4. 本次样例结果

本次真实验收过程中，曾成功创建并验证：

- 文件 contentId：`0dsbgn8r3j32v62`
- 文件 contentHash：`183a1e10a11af8edf720d8db58281d71`
- HTML contentId：`rqu11mrd7il335z`
- HTML contentHash：`945022b5f9f0107fa08105826a4a8486`
- 文件 shareHash：`33583fcae8c42f281f876c888269aa2e`
- HTML shareHash：`7f1033f75ed0ba872888b0f82fbb41dc`

说明：

1. 这些值属于本次真实演示样例，不应被当作长期固定依赖。
2. 本轮已执行 `scripts/vm_demo_step3_cleanup.sh`，演示数据已清理。

## 5. 本次收口时的运行状态

本次收口时，已真实确认：

1. `app` 容器为 `healthy`
2. `pocketbase` 容器为 `healthy`
3. 清理后 `api/health` 与 `web/public/list` 仍可访问

这说明当前 `vm-accept` 已达到“核心业务链路已跑通”的状态。

## 6. 当前结论

截至本次收口，P4 在 `vm-accept` 上已经完成：

- 新 VM 管理员认证对齐
- 新 VM 集合初始化修复
- 旧样例 owner key 对齐
- owner/public/share/download 关键业务链路验证
- 演示数据标准清理

因此，当前可以把 `vm-accept` 明确表述为：

`新 Linux 虚拟机上的核心业务链路已真实跑通。`

但仍需保持表述边界：

- 这不等于已经完成域名、HTTPS、公网入口那一层上线工作。
- 后续若迁移到另一台新机器，仍应按标准部署范式重走一次，而不是把 `vm-accept` 的当前容器状态当成普适模板。
