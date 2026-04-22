# P4 Docker Acceptance Closeout

本文档记录当前仓库在本机 `Docker Desktop` 环境下完成的部署与业务验收结果，作为从“可本地运行”进入“可迁移上线”的收口证据。

文档定位：

- 这是 P4 在本机 Docker 阶段的收口文档，回答“本机容器化基线是否已经成立”。
- 如果你要上线新 VM，请继续看 [vm-compose-production-template.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-compose-production-template.md) 和 [vm-go-live-short-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-go-live-short-checklist.md)。
- 如果你要维护已经落地的 `ubu2404`，请直接看 [vm-ubu2404-ip-http-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-ubu2404-ip-http-closeout.md)。

## 1. 本轮目标

本轮目标是确认：

1. 当前项目可在 Docker 形态下稳定启动。
2. `PocketBase + business shell` 两个容器可进入健康状态。
3. 六个核心能力可在 Docker 环境下完成首轮真实验收。
4. 当前 Docker 形态可以作为后续 Linux 虚拟机上线的前置基线。

## 2. 完成情况

本轮已完成：

1. 补齐 Docker 运行文件：
   - `docker-compose.yml`
   - `docker/app.Dockerfile`
   - `docker/pocketbase.Dockerfile`
   - `.dockerignore`
   - `.env.docker.example`
2. 完成本机 Docker Desktop 的真实 build / up / health 验证。
3. 确认宿主机可访问：
   - `http://127.0.0.1:8090/api/health`
   - `http://127.0.0.1:8787/api/health`
4. 完成 Docker 首次启动检查单和六项核心能力验收文档。
5. 完成 Docker 验收辅助脚本：
   - `scripts/docker_demo_step0_precheck.sh`
   - `scripts/docker_demo_step1_write_and_share.sh`
   - `scripts/docker_demo_step2_print_and_verify.sh`
   - `scripts/docker_demo_step3_cleanup.sh`

## 3. 真实验收结果

### 3.1 Docker 层

已真实确认：

- Docker Desktop 可连接。
- `pocketbase` 镜像可构建。
- `app` 镜像可构建。
- 两个容器均可进入 `healthy`。

### 3.2 接口层

已真实确认：

- `PocketBase /api/health` 返回 200。
- `business shell /api/health` 返回 200。
- owner 查询面在 Docker 环境下可读。
- public content 与 public share 在 Docker 环境下可读。

### 3.3 六项核心能力

已完成首轮真实验收：

1. 允许保存文件并允许外部用户通过 http 访问该文件。
2. 允许保存富文本并允许外部用户通过 http 查看该文本。
3. 外部用户可以在公开内容列表中找到已发布内容。
4. 外部用户可以在公开搜索页面中搜索到已发布内容。
5. 外部用户可以查看已发布内容的详情。
6. owner 可通过 Open API 保存文件或富文本。

## 4. 验收数据样例

本轮实际验收过程中，已成功创建并验证：

- PDF contentId: `i7tj6wnl4diumx3`
- PDF contentHash: `7ccc99a128714983fcc2ba636daca7b6`
- HTML contentId: `ndsdlq9yv6v6fk0`
- HTML contentHash: `44a7c0ef0435b488ace5adbe0121fd9b`
- PDF shareHash: `3f37cd7c3e7923f2157cb6bac21f3a1b`
- HTML shareHash: `65d93d6227026303a9b9f0a5f9d56ed7`

说明：

- 这些值属于一次真实演示样例，不应被当作长期固定测试数据依赖。
- 可通过清理脚本删除本轮演示内容。

## 5. 本轮发现并修正的问题

本轮执行过程中，修正了以下实际问题：

1. Docker 环境下 `app` 镜像缺少 `curl`，导致预检脚本把“缺少 curl”误判为“PocketBase 不可达”。
2. Docker 环境下需要显式区分 `.env` 与 `.env.docker.example`，否则容易误读开发环境配置。
3. 演示脚本最初会吞掉 API 错误响应，导致失败时仍写入空状态；现已改为在关键 JSON 字段缺失时直接失败。
4. Docker 验收过程中确认：若 `users_api` 中不存在当前脚本使用的 API Key，业务壳会返回 `invalid_api_key`，该前置条件现已被文档明确。

## 6. 当前结论

当前项目已经具备：

- 本机 Docker Desktop 可重复启动
- 首次初始化可操作
- 六项核心能力可演示
- 可继续迁移到 Linux 虚拟机

因此，P4 当前可以认为已经完成“本机容器化部署基线 + 首轮业务验收”这一子目标。

## 7. 后续建议

后续优先级建议如下：

1. 使用 `deploy/vm-compose/` 模板进入真实 Ubuntu 虚拟机部署。
2. 在虚拟机上完成 `Nginx + HTTPS + systemd/compose` 接入。
3. 在真实公网域名下再做一轮最小上线验收。
4. 如后续有需要，再考虑自动初始化、备份策略和部署脚本进一步产品化。

补充：在真实 VM 执行 `deploy/vm-compose/docker-compose.prod.yml` 时，后续已经确认需要额外遵守三条运行约束：

1. 所有 `docker compose` 命令统一显式追加 `--project-directory .`，避免子目录 compose 文件把 `./workspace`、`./pocketbase/data`、`./.env` 解析到错误位置。
2. 生产环境统一只维护仓库根目录 `.env`，不要额外创建 `deploy/vm-compose/.env`。
3. 若所在网络拉取 Docker Hub 不稳定，应先完成 Docker registry mirror 配置，再执行首轮 `build` / `up`。
