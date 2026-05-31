# P3-T6 Phase 3 Operations And Acceptance

## 1. 目标

本文件收口 Phase 3 的实际运行入口、人工验收入口和自动化验证入口，避免 owner 前端、公开访客前端与运维命令分散在多个 task 文档中。

## 2. 服务启动顺序

### 2.1 PocketBase

```bash
bash ./scripts/preflight.sh pocketbase
./scripts/start_pocketbase.sh
```

通过标准：

```bash
curl http://127.0.0.1:8090/api/health
```

### 2.2 Business Shell

```bash
bash ./scripts/preflight.sh service
./scripts/start_service.sh
```

通过标准：

```bash
curl http://127.0.0.1:8787/api/health
```

## 3. Owner 访问入口

### 3.1 登录页

- `http://127.0.0.1:8787/web/auth/login`

操作方式：

1. 在登录页输入 `users_api` 中有效的 API Key。
2. 提交后，服务端签发 HttpOnly session cookie。
3. 浏览器后续访问 owner 页面不需要再手工注入请求头。

### 3.2 Owner 页面

- 列表页：`http://127.0.0.1:8787/web/list`
- 搜索页：`http://127.0.0.1:8787/web/search?q=试卷`
- 详情页：`http://127.0.0.1:8787/web/detail/<contentId>`
- 凭据页：`http://127.0.0.1:8787/web/credential`

当前 owner 页面能力：

- 列表
- 搜索
- 详情
- 单条分享
- 单条撤销分享
- 单条删除
- rich text 标题与正文更新
- 批量分享
- 批量撤销分享
- 批量删除
- 凭据摘要查看
- 退出会话

## 4. Public 访问入口

- 列表页：`http://127.0.0.1:8787/web/public/list`
- 搜索页：`http://127.0.0.1:8787/web/public/search?q=试卷`
- 内容详情页：`http://127.0.0.1:8787/web/public/content/<contentHash>`
- 分享链接页：`http://127.0.0.1:8787/web/public/share/<shareHash>`
- 文件直链：`http://127.0.0.1:8787/api/public/content/<contentHash>`
- 分享直链：`http://127.0.0.1:8787/api/public/share/<shareHash>`

访问规则：

- 公开访客不需要登录。
- 只有 owner 已分享的内容可被公开访问。
- 撤销分享后，分享 hash 应返回 `410 Gone`。
- 删除内容后，对应公开内容与分享链接均不再可访问。

## 5. 六个核心功能人工演示建议

建议先执行：

```bash
bash ./scripts/demo_step1_write_content.sh
bash ./scripts/demo_step2_share_content.sh
bash ./scripts/demo_step3_print_access_info.sh
```

对应演示链路：

1. 保存文件到应用：查看 `demo_step1` 输出中的 PDF content id。
2. 保存富文本到应用：查看 `demo_step1` 输出中的 HTML content id。
3. 外部用户在页面内容列表中发现内容：打开 `/web/public/list`。
4. 外部用户搜索内容：打开 `/web/public/search?q=试卷`。
5. 外部用户查看内容详情：进入 HTML 公开页或 PDF 公开页。
6. 通过 Open API 保存文件和富文本：`demo_step1` 实际就是走 `/api/write/file` 与 `/api/write/html`。

如果要显式验证文件下载一致性：

1. 打开 PDF 公开详情页。
2. 点击下载链接。
3. 将下载后的文件与源文件做字节比较。

## 6. 自动化验证入口

单元与集成：

```bash
node --test
```

浏览器 E2E：

```bash
npm run test:e2e
```

观察浏览器过程：

```bash
npm run test:e2e:headed
```

注意：

- `node --test` 使用当前本地代码直接运行。
- `npm run test:e2e` 会由 Playwright 额外拉起 `127.0.0.1:8788` 的临时业务服务实例。
- 因此即使你本地已经手工启动了 `8787`，E2E 也不会复用它。

## 7. 异常排查入口

1. 先确认 PocketBase 是否在线：`curl http://127.0.0.1:8090/api/health`
2. 再确认业务服务是否在线：`curl http://127.0.0.1:8787/api/health`
3. 再确认 `.env` 中管理员凭据是否存在。
4. 再确认 `users_api` 中 owner 记录、display name 和 API Key 是否存在。
5. 最后再看 `test-results/` 与 Playwright trace。
