# P5 VM 验收 Checklist

本文档用于在 VM 上验收 P5 当前主线能力。

文档定位：

- `scripts/vm_demo_step0_precheck.sh`、`scripts/vm_demo_step1_write_and_share.sh`、`scripts/vm_demo_step2_print_and_verify.sh` 负责跑通脚本链路。
- 本文负责补齐脚本之外的人工验收，尤其是页面展示与密码访问闭环。
- 当前默认验收样例是 `markdown` 字符串内容，不再以旧文件上传样例作为 P5 主链路。

## 1. 验收范围

本轮重点确认以下能力：

1. 新增字符串内容写入与查询链路。
2. Markdown 内容在 owner/public/share 页面可正确展示。
3. 列表页显示项与视图切换符合当前产品化预期。
4. 资源访问密码能力可在 VM 上手工走通。

## 2. 执行前提

在 VM 上确认：

1. 项目目录为 `/opt/static-content-service`。
2. 根目录 `.env` 已填写真实 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD`。
3. `PUBLIC_BASE_URL` 指向当前真实 VM 入口。
4. `PB_BASE_URL=http://pocketbase:8090`。
5. `users_api` 中存在一条真实可用的 `DEMO_API_KEY`。
6. 当前数据目录已执行最新 migration，至少包含：
   - `1700000003_add_content_body_fields.js`
   - `1700000004_add_content_access_mode_fields.js`

建议先在 VM shell 中准备一组当前会话变量：

```bash
cd /opt/static-content-service
export DEMO_API_KEY='<replace-with-real-users-api-key>'
export BASE_URL='http://<your-vm-ip-or-domain>'
```

如果当前接口 header 不是默认值，再额外覆盖：

```bash
export DEMO_API_HEADER='x-shutong49-api-key'
```

如果想先确认部署基础状态，可先执行：

```bash
curl -sS http://127.0.0.1:8090/api/health
curl -sS http://127.0.0.1:8787/api/health
curl -sS "$BASE_URL/api/health"
curl -sS "$BASE_URL/web/auth/login" >/dev/null
curl -sS "$BASE_URL/web/public/list" >/dev/null
```

## 2.1 直接可复制命令

如果你现在只是想照着跑，不想先看长说明，直接按下面顺序执行。

### 2.1.1 当前这台 VM 的会话变量

```bash
cd /opt/static-content-service
export DEMO_API_HEADER='x-shutong49-api-key'
export DEMO_API_KEY='t1_verify_api_key_0001'
export BASE_URL='http://192.168.2.9'
```

### 2.1.2 三个主脚本

```bash
bash ./scripts/vm_demo_step0_precheck.sh
bash ./scripts/vm_demo_step1_write_and_share.sh
bash ./scripts/vm_demo_step2_print_and_verify.sh
```

### 2.1.3 验收结束后清理演示数据

```bash
bash ./scripts/vm_demo_step3_cleanup.sh
```

### 2.1.4 如果你想直接看本次生成的 ID 和 URL

```bash
cat .demo-state/p5_content_demo.env

. ./.demo-state/p5_content_demo.env
echo "$P5_CONTENT_ID"
echo "$P5_CONTENT_HASH"
echo "$P5_SHARE_HASH"
echo "$P5_SHARE_URL"

# 如果尚未创建内容，你可以直接访问 /web/write 页面手动写入
```

### 2.1.5 如果你想直接打开这次要验的几个页面

```bash
. ./.demo-state/p5_content_demo.env
echo "$BASE_URL/web/auth/login"
echo "$BASE_URL/web/list"
echo "$BASE_URL/web/write"
echo "$BASE_URL/web/detail/$P5_CONTENT_ID"
echo "$BASE_URL/web/detail/$P5_CONTENT_ID   # owner 侧浏览器写入/更新表单入口"
echo "$BASE_URL/web/public/list"
echo "$BASE_URL/web/public/content/$P5_CONTENT_HASH"
echo "$P5_SHARE_URL"
```

## 3. 先跑脚本链路

### 3.1 预检

```bash
cd /opt/static-content-service
export DEMO_API_KEY='<replace-with-real-users-api-key>'
bash ./scripts/vm_demo_step0_precheck.sh
```

预期：

- 输出 `precheck passed`
- `/api/health`、`/web/auth/login`、`/web/public/list` 可达

如果预检失败，优先检查：

```bash
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml ps
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -n 100 app
sudo docker compose --project-directory . -p static-content-service --env-file .env -f deploy/vm-compose/docker-compose.prod.yml logs -n 100 pocketbase
```

### 3.2 写入字符串内容并创建 share

```bash
bash ./scripts/vm_demo_step1_write_and_share.sh
```

预期：

- 成功写入一条 `bodyFormat=markdown` 的字符串内容
- 成功查询该内容
- 成功创建 share

脚本会把本次演示状态写入：

```bash
cat .demo-state/p5_content_demo.env
```

如果你想在 shell 里直接拿到 `contentId`、`contentHash`、`shareHash`，可执行：

```bash
. ./.demo-state/p5_content_demo.env
echo "$P5_CONTENT_ID"
echo "$P5_CONTENT_HASH"
echo "$P5_SHARE_HASH"
echo "$P5_SHARE_URL"
```

### 3.3 打印入口并完成基础验证

```bash
bash ./scripts/vm_demo_step2_print_and_verify.sh
```

预期：

- `query/content` 返回 `body`
- `query/content` 返回 `renderedBodyHtml`
- `public content` 返回 `htmlContent`
- `public share` 返回 `htmlContent`
- 输出 owner/public/share 访问地址

如果你想手工复查脚本验证过的 API，可直接执行：

```bash
. ./.demo-state/p5_content_demo.env

curl -sS "$BASE_URL/api/query/content/$P5_CONTENT_ID" \
  -H "${DEMO_API_HEADER:-x-shutong49-api-key}: $DEMO_API_KEY" | jq .

curl -sS "$BASE_URL/api/public/content/$P5_CONTENT_HASH" | jq .

curl -sS "$BASE_URL/api/public/share/$P5_SHARE_HASH" | jq .
```

如果 VM 没有安装 `jq`，也可以先直接看原始 JSON：

```bash
curl -sS "$BASE_URL/api/query/content/$P5_CONTENT_ID" \
  -H "${DEMO_API_HEADER:-x-shutong49-api-key}: $DEMO_API_KEY"
```

## 4. 人工页面验收

以下 `{BASE}` 为当前 VM 服务地址，例如 `http://192.168.2.9`。

建议先在本地浏览器准备：

1. 一个正常窗口，用于 owner 登录和 owner 页面操作。
2. 一个无痕窗口，用于 public/share 访客视角验证。

如果你希望直接从 shell 打印本次页面地址，可执行：

```bash
. ./.demo-state/p5_content_demo.env
echo "$BASE_URL/web/auth/login"
echo "$BASE_URL/web/list"
echo "$BASE_URL/web/detail/$P5_CONTENT_ID"
echo "$BASE_URL/web/public/list"
echo "$BASE_URL/web/public/content/$P5_CONTENT_HASH"
echo "$P5_SHARE_URL"
```

Owner 登录步骤：

1. 打开 `{BASE}/web/auth/login`
2. 在输入框中填入 `DEMO_API_KEY`
3. 提交后进入 owner 列表页

### 4.1 Owner 列表页

打开：`{BASE}/web/list`

建议操作顺序：

1. 打开 owner 列表页
2. 找到刚刚脚本写入的字符串内容
3. 点一次视图切换
4. 刷新页面
5. 再确认视图状态是否保持

检查项：

- [ ] 可看到脚本写入的字符串内容
- [ ] 卡片/列表视图可切换
- [ ] 标题、摘要、作者、日期显示正常
- [ ] 字符串内容不显示旧文件链路才有的无意义文件信息

### 4.2 Owner 详情页

从列表进入刚写入内容的详情页。

建议操作顺序：

1. 点击“查看详情”进入 owner 详情页
2. 对照 `query/content` 返回结果，确认正文展示不是原始 Markdown
3. 滚动到更新区域，确认 `title`、`body`、`bodyFormat` 可见
4. 暂时不要先改密码，先完成展示检查

检查项：

- [ ] Markdown 被渲染为 HTML，而不是原始 Markdown 文本
- [ ] 标题、正文、作者、创建时间显示正常
- [ ] 更新区域可编辑 `title`、`body`、`bodyFormat`
- [ ] 分享 / 撤销分享 / 删除操作区可见

### 4.3 Public 列表页

打开：`{BASE}/web/public/list`

建议操作顺序：

1. 在无痕窗口打开 public 列表页
2. 找到刚刚分享出的字符串内容
3. 点击内容标题进入 public 详情页

检查项：

- [ ] 已分享的字符串内容可见
- [ ] 作者显示正常
- [ ] 列表展示风格与 owner 侧一致

### 4.4 Public 详情页

打开脚本输出的 public detail 页面。

可直接访问：

```text
{BASE}/web/public/content/{contentHash}
```

检查项：

- [ ] 访客侧正文渲染结果与 owner 详情页一致
- [ ] 访客看到的是渲染后的内容，而不是原始 Markdown

### 4.5 Share 页面

打开脚本输出的 share 页面 URL。

可直接从 shell 再打印一次：

```bash
. ./.demo-state/p5_content_demo.env
echo "$P5_SHARE_URL"
```

检查项：

- [ ] share 页面可正常访问
- [ ] share 页面渲染结果与 public detail 一致

## 5. 密码访问人工验收

当前密码访问能力以人工验收为主，不依赖 `vm_demo_step2_print_and_verify.sh` 自动覆盖。

### 5.1 Owner 设置密码保护

在 owner 详情页：

1. 将访问模式切到 `password`
2. 设置访问密码
3. 可选填写提示
4. 保存更新

建议实际操作：

1. 回到 owner 详情页 `{BASE}/web/detail/{contentId}`
2. 在访问模式中选 `password`
3. 在密码框输入一个临时测试密码，例如 `p5-demo-pass-123`
4. 在提示框输入 `vm acceptance hint`
5. 点击保存

检查项：

- [ ] 保存成功后刷新页面，访问模式仍显示为 `password`
- [ ] 提示内容正确回显

### 5.2 Public 密码页

使用无痕窗口打开 public detail 页面。

建议实际操作：

1. 在无痕窗口重新打开 public detail 页面
2. 第一次故意输入错误密码，例如 `wrong-pass`
3. 观察是否仍停留在密码页
4. 再输入正确密码 `p5-demo-pass-123`
5. 观察是否进入详情页

检查项：

- [ ] 未验证前显示密码输入页
- [ ] 输入错误密码后，页面仍保留密码表单
- [ ] 密码输入框下方显示红色错误提示
- [ ] 输入正确密码后可访问内容

### 5.3 Share 密码页

使用无痕窗口打开 share 页面。

建议实际操作：

1. 在另一个无痕标签页打开 share URL
2. 第一次故意输入错误密码
3. 第二次输入正确密码
4. 确认进入 share 页面内容

检查项：

- [ ] 未验证前显示密码输入页
- [ ] 输入错误密码后可重试
- [ ] 输入正确密码后可访问内容

### 5.4 切回 Public

回到 owner 详情页，将访问模式从 `password` 切回 `public` 并保存。

建议实际操作：

1. 回到 owner 详情页
2. 访问模式改回 `public`
3. 保存
4. 刷新 owner 详情页确认模式已变更
5. 回到无痕窗口重新打开 public detail 与 share 页面

检查项：

- [ ] 刷新后访问模式显示为 `public`
- [ ] public detail 页面恢复为直接可访问
- [ ] share 页面恢复为直接可访问

## 6. API 补充检查

如需直接确认接口返回结构，可在 VM 上执行：

```bash
. ./.demo-state/p5_content_demo.env

curl -sS "$BASE_URL/api/query/content/$P5_CONTENT_ID" \
  -H "${DEMO_API_HEADER:-x-shutong49-api-key}: $DEMO_API_KEY" | jq .

curl -sS "$BASE_URL/api/public/content/$P5_CONTENT_HASH" | jq .
```

检查项：

- [ ] `body` 保留原始正文
- [ ] `bodyFormat` 为 `markdown` 或 `html`
- [ ] `renderedBodyHtml` 存在
- [ ] `htmlContent` 存在
- [ ] 缺失内容返回业务 404

## 7. 通过标准

以下全部满足，可视为 P5 当前主线在 VM 上验收通过：

- [ ] 脚本预检通过
- [ ] 字符串内容写入、查询、分享脚本链路通过
- [ ] owner/public/share 展示新 Markdown 样例正常
- [ ] owner/public 列表显示项符合当前预期
- [ ] owner/public/share 详情页渲染一致
- [ ] 资源访问密码闭环手工验收通过
- [ ] `query/content` 与 `public content` 返回结构符合预期

## 8. 清理演示数据

验收结束后，如果你希望清理本轮演示内容，可执行：

```bash
cd /opt/static-content-service
bash ./scripts/vm_demo_step3_cleanup.sh
```

如果你想先确认状态文件是否还在：

```bash
ls .demo-state
cat .demo-state/p5_content_demo.env
```
