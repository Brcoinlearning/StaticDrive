# VM ubu2404 Full Business Acceptance

> 归档说明：本文档只保留为 `ubu2404` 阶段的历史业务验收执行单，不再作为当前 P4 的默认执行单。当前真实验收基线请优先看 [vm-accept-acceptance-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-accept-acceptance-closeout.md) 与 [linux-vm-deployment-playbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/linux-vm-deployment-playbook.md)。

本文档用于承接 `ubu2404` 当前“IP + HTTP”阶段的下一步工作：基于 `http://192.168.2.2` 完成全量业务验收，并把结果沉淀为正式记录。

文档定位：

- 这不是新的部署文档，而是当前 VM 运行形态下的业务验收执行单。
- 当前目标不是公网化，而是先确认 owner/public/share/download 等业务能力已经在 VM 对外入口上可用。

关联文档：

- 当前机器运行事实与运维方式见 [vm-ubu2404-ip-http-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-ubu2404-ip-http-closeout.md)
- 最短上线清单见 [vm-go-live-short-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-go-live-short-checklist.md)
- 本机 Docker 六项能力验收基线见 [docker-six-capability-acceptance.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/docker-six-capability-acceptance.md)
- 如果当前已不再维护 `ubu2404`，而是迁移到新 VM，请同时参考 [vm-rebuild-lessons-learned.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/vm-rebuild-lessons-learned.md)，并把机器名、IP、磁盘规格和验收结果按新机器事实重写。

## 1. 当前边界

当前已经确认的是：

1. `Docker Compose + Nginx + systemd` 已在 `ubu2404` 跑通。
2. 当前统一外部入口是 `http://192.168.2.2`。
3. `api/health`、`/web/auth/login`、`/web/public/list` 已通过最小访问验证。

当前还没有确认的是：

1. owner 写入是否能完整走通。
2. public 搜索、详情、share、文件下载是否都能从 VM 对外入口走通。
3. 当前 VM 是否已经达到“业务全量验收完成”的标准。

因此，本轮验收完成前，不应把当前状态表述为“已完成最终上线验收”。

## 2. 验收目标

本轮需要在 `http://192.168.2.2` 下确认以下能力：

1. owner 可通过 Open API 写入文件。
2. owner 可通过 Open API 写入富文本。
3. public list 页面可看到新写入内容。
4. public search 页面可搜索到新写入内容。
5. public detail 页面可打开文件与富文本详情。
6. share 页面可访问。
7. 文件 direct public content 可下载。

## 3. 执行前提

在 `ubu2404` 已登录 shell 中确认：

1. 当前仓库目录是 `/opt/static-content-service`
2. 根目录 `.env` 已填写真实 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD`
3. `PUBLIC_BASE_URL=http://192.168.2.2`
4. `PB_BASE_URL=http://pocketbase:8090`
5. `users_api` 中已经存在一条可用的 API Key

额外约束：

1. 不要创建 `deploy/vm-compose/.env`
2. 如果需要跑 compose 命令，必须显式带 `--project-directory .`
3. 这轮只做 VM 全量业务验收，不进入域名、HTTPS、公网入口改造
4. 如果是全新 PocketBase 数据目录，必须先确认当前管理员账号已初始化且与根目录 `.env` 一致，否则 `/web/public/list` 可能直接因 `authenticate_admin` 失败而返回 `500`
5. 如果要跑 `vm_demo_step0_precheck.sh` 等脚本，必须先准备真实 `DEMO_API_KEY`，不能假设 `users_api` 中已经自动存在演示 key

## 4. VM Shell 执行命令

以下命令设计为在 `ubu2404` 的已登录 shell 中执行。

### 4.1 进入仓库并设置 API Key

```bash
cd /opt/static-content-service
export DEMO_API_KEY='<replace-with-real-users-api-key>'
```

如果 API header 不是默认值，也一并覆盖：

```bash
export DEMO_API_HEADER='x-shutong49-api-key'
```

### 4.2 预检

```bash
bash ./scripts/vm_demo_step0_precheck.sh
```

预期：

- `http://192.168.2.2/api/health` 可达
- `http://192.168.2.2/web/auth/login` 可达
- `http://192.168.2.2/web/public/list` 可达

### 4.3 写入文件与富文本并创建 share

```bash
bash ./scripts/vm_demo_step1_write_and_share.sh
```

说明：

- 该脚本默认上传仓库内样例文件 [vm-acceptance-sample.txt](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/assets/vm-acceptance-sample.txt)
- 如果你希望在演示中使用 PDF，可在执行前额外导出 `DEMO_FILE_PATH=/absolute/path/to/your.pdf`
- 同时会写入一条 HTML 富文本，并为两条内容创建 share
- 结果会保存到 `.demo-state/mvp_demo.env`

### 4.4 打印访问地址并做命令行验证

```bash
bash ./scripts/vm_demo_step2_print_and_verify.sh
```

该步骤会验证：

- owner query surface 可读
- 文件 public content 可读
- 富文本 public content 可读
- 文件 share 可读
- 富文本 share 可读

同时会输出：

- public list 页面地址
- public search 页面地址
- 文件 detail 页面地址
- 富文本 detail 页面地址
- 文件 share 地址
- 富文本 share 地址
- 文件 direct download 地址

### 4.5 人工页面验收

按 `vm_demo_step2_print_and_verify.sh` 输出的地址逐项检查：

1. 打开 `public list`，确认能看到刚刚写入的文件和富文本。
2. 打开 `public search?q=试卷`，确认搜索命中。
3. 打开富文本 detail，确认正文可读。
4. 打开文件 detail，确认页面可访问。
5. 打开文件 direct download，确认浏览器可下载文件。
6. 分别打开文件 share 与 HTML share，确认 share 可访问。

建议记录：

- 实际访问时间
- 访问人
- 页面表现是否正常
- 若失败，失败 URL 与报错现象

### 4.6 清理演示数据

```bash
bash ./scripts/vm_demo_step3_cleanup.sh
```

## 5. 结果记录模板

执行完成后，至少补充以下结果：

```text
执行时间：
执行机器：ubu2404
执行入口：http://192.168.2.2

预检结果：PASS / FAIL
owner 写入文件：PASS / FAIL
owner 写入富文本：PASS / FAIL
public list：PASS / FAIL
public search：PASS / FAIL
public detail：PASS / FAIL
share：PASS / FAIL
文件下载：PASS / FAIL

样例 contentId / contentHash：
样例 shareHash：

异常记录：
后续动作：
```

## 6. 本轮完成标准

只有在以下全部成立时，才可以把 `ubu2404` 当前阶段推进到“VM 全量业务验收完成”：

1. 预检通过。
2. owner 文件写入通过。
3. owner 富文本写入通过。
4. public list / search / detail 全通过。
5. share 通过。
6. 文件 direct download 通过。
7. 结果已回填到正式文档。

在此之前，不应提前进入域名、HTTPS 或非局域网访问推进。
