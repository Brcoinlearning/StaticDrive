# P3-T5 Browser E2E Manual Check

## 1. 本轮目标

为 Phase 3 已形成的关键浏览器主链补自动化回归门禁，覆盖：

- owner API Key 登录浏览器会话
- owner 列表进入详情
- 单条撤销分享与重新分享
- owner 凭据页与退出
- public 列表 / 搜索 / 详情
- public 文件下载字节一致性
- public 富文本详情渲染

## 2. 前置条件

1. `.env` 已存在且 PocketBase 管理员账号可用。
2. PocketBase 已启动：`./scripts/start_pocketbase.sh`
3. 业务服务可不手工启动；E2E 会自行拉起独立测试实例。
4. 本机已安装可供 Playwright 调起的 Chrome。

## 3. 执行命令

```bash
npm run test:e2e
```

如需观察浏览器过程：

```bash
npm run test:e2e:headed
```

## 4. 执行前置数据

测试启动时会由 `e2e/helpers.js` 直接调用业务服务 API 创建一套唯一的 PDF 与 HTML 演示数据，并分别创建分享链接。

当前实现不再依赖 demo shell 脚本，因此：

- 不要求先手工执行 `demo_step1` / `demo_step2`
- 不依赖 `.demo-state/mvp_demo.env`
- 每次运行都会生成带时间戳后缀的新数据，避免与人工演示数据互相污染

## 5. 通过标准

命令通过后，表示以下链路至少被浏览器真实访问并断言：

- owner 从 `/web/auth/login` 输入 API Key 登录
- owner 可从列表进入 PDF 详情
- owner 可撤销分享并重新创建分享
- owner 可进入 `/web/credential` 并退出会话
- public 可在 `/web/public/list` 与 `/web/public/search` 发现已分享内容
- public 可进入 PDF 公开页并下载出与源文件完全一致的文件
- public 可进入 HTML 公开页并看到 iframe 内的富文本内容

## 6. 失败排查顺序

1. 先看 PocketBase 是否仍在线：
   - `curl http://127.0.0.1:8090/api/health`
   - 如需确认 E2E 自起服务实例，也可查看 `http://127.0.0.1:8788/api/health`
2. 再看 `.env` 中管理员凭据是否正确。
3. 再看 `users_api` 中 demo API Key 对应 owner 是否存在。
4. 最后查看 Playwright 失败截图 / trace：
   - `test-results/`
