# Release And Commit Playbook

本文档把“本地改代码 -> 跑验证 -> 更新文档 -> 同步到 VM -> 重启服务 -> 做最小验收”整理成固定动作，避免后续每次发布都靠临时判断。

## 1. 适用范围

适用于以下场景：

- 本机开发后准备继续本机联调
- 本机开发后准备同步到 VM
- 代码和文档都已基本完成，准备收口

## 2. 推荐发布顺序

### 2.1 先在本机完成代码与文档

先确保以下内容都在本地工作区完成：

1. 代码改动
2. 对应测试改动
3. 对应运维/使用文档改动

原则：

- 不要只改代码不改文档
- 不要先把旧文档同步到 VM，再临时口头补充操作步骤

### 2.2 运行验证

最小建议：

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
node --test tests/content.test.js
```

如果改动范围更大，可追加：

```bash
node --test
```

如果是页面行为或真实浏览器流程改动，可再跑：

```bash
npm run test:e2e
```

## 3. 提交前检查

### 3.1 检查改动范围

建议至少确认：

- 是否只改了 `src/` 还是同时改了 `.env`、部署文件、迁移文件
- 是否补了对应 `docs/Operations/` 文档
- 是否有不应该一起带上的临时文件

### 3.2 提交信息建议

提交信息应直接说明“做了什么”和“为什么重要”，避免过泛。

例如：

- `mark and clean missing local file records for owner views`
- `add operations docs for local vm sync and restart flow`
- `document release checklist and troubleshooting flow`

## 4. 推荐提交流程

如果这次改动同时涉及代码和运维文档，建议作为同一个提交收口。

原因：

- 代码版本和运维说明版本保持一致
- VM 上同步代码时，文档也同步到位
- 后续追查问题时更容易回溯

## 5. 同步到 VM 的固定顺序

### 5.1 先同步代码

常见方式：

1. `git pull`
2. 你的自定义发布同步方式

同步完成后，先确认 VM 上的仓库内容确实已经是最新版本，再执行服务操作。

### 5.2 再决定重启哪一层

通用判断：

- 只改 `src/`：重启 `app`
- 改了 `.env` 中 app 配置：重启 `app`，必要时整套 Compose
- 改了 Compose 模板、镜像、公共环境：重启整套 Compose
- 改了 PocketBase 底座：单独处理 PocketBase，不要直接套用 `app` 重启流程

### 5.3 VM 上最短重启动作

如果只是业务壳代码变更：

```bash
cd /opt/static-content-service
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml up -d app
```

## 6. 发布后最小验收

本机或 VM 都建议至少做这组检查：

1. `api/health` 正常
2. owner 登录页能打开
3. owner 列表页能打开
4. public 列表页能打开

如果本次改动涉及文件状态、删除、分享、查询：

5. 再验证 `/web/list?missingLocalFileOnly=1`

## 7. 不建议的发布方式

以下做法风险较高：

- 本地代码已改，但 VM 直接手改一部分文件，不保留统一版本来源
- 先重启 VM 服务，再确认代码是否同步完整
- 代码改动已上线，但文档仍停留在旧口径
- 改了底座类内容却只重启 `app`

## 8. 推荐的最短清单

如果你之后只想照着做，最短就是：

1. 本地改代码
2. 本地跑测试
3. 本地补文档
4. 提交或至少固定本地最终版本
5. VM 同步代码
6. 按改动类型重启服务
7. 打开关键页面做最小验收
