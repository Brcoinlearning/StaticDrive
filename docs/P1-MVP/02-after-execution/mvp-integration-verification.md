# MVP 集成验证记录

本文档对应当前 MVP 已闭合范围，用于把主链路流程、验证方式与当前证据统一整理出来。

## 1. 当前验证结论

- 当前 worktree 已完成 `T1` 到 `T9`。
- fresh 自动化验证命令为 `node --test`。
- 最近一次全量执行结果为 `51/51` 通过。
- `P2-MVP-1` 已把 public 文件交付从 `JSON + base64` 调整为真实二进制下载响应。
- `P2-MVP-2` 已把公开访客访问流补到 `公开列表 -> 公开搜索 -> 公开详情` 的最小闭环。

## 2. 十条主流程与证据

### 2.1 文件上传成功

- 测试证据：`tests/content.test.js`
- 场景：`write/file persists file and creates unified file content record`
- 证明点：内容记录创建成功，物理文件实际写入 `workspace/content-files/`。

### 2.2 HTML 保存成功

- 测试证据：`tests/content.test.js`
- 场景：`write/html creates unified rich_text content record`
- 证明点：统一 `Content` 模型写入成功，返回 `contentHash` 与访问地址。

### 2.3 发布者查看列表成功

- 测试证据：`tests/content.test.js`
- 场景：`query/list returns owner-scoped content summaries`
- 证明点：默认按 `owner_user_id` 过滤，返回统一内容摘要结构。

### 2.4 发布者搜索成功

- 测试证据：`tests/content.test.js`
- 场景：`query/search returns owner-scoped matches and paging shape`
- 证明点：搜索建立在统一 `Content` 模型上，并保持合法分页结构。

### 2.5 发布者查看详情成功

- 测试证据：`tests/content.test.js`
- 场景：`query/detail returns owner-scoped content detail`
- 证明点：详情按 owner 范围受限，返回 HTML 或文件详情字段。

### 2.6 外部用户访问分享 HTML 成功

- 测试证据：`tests/content.test.js`
- 场景：`public content hash returns rich text payload only when content is shared`
- 证明点：public HTML 访问只在 `is_shared=true` 时成功。

### 2.7 外部用户可在公开列表中找到已发布内容

- 测试证据：`tests/content.test.js`
- 场景：
  - `public list returns only shared content summaries`
  - `web public list renders shared content discovery page`
- 证明点：
  - 公开访客已有列表页入口。
  - 列表结果只返回 `is_shared=true` 的内容。
  - 结果项直接链接到 `/web/public/content/:contentHash` 公开详情页。

### 2.8 外部用户可在公开搜索中找到已发布内容

- 测试证据：`tests/content.test.js`
- 场景：
  - `public search returns shared matches with public detail urls`
  - `web public search renders only public discovery results`
- 证明点：
  - 公开访客已有搜索页入口。
  - 搜索结果只返回 `is_shared=true` 的内容。
  - 结果项直接链接到 `/web/public/content/:contentHash` 公开详情页。

### 2.9 外部用户下载文件成功

- 测试证据：`tests/content.test.js`
- 场景：
  - `public share hash returns binary file download response`
  - `public content hash returns binary bytes identical to stored file`
- 证明点：
  - public 文件接口返回真实文件字节流，而不是 `JSON + base64` 包装。
  - 返回 `content-type`、`content-length`、`content-disposition` 等下载响应头。
  - 下载内容与存储文件字节一致。

### 2.10 删除与撤销分享生效

- 测试证据：`tests/content.test.js`
- 场景：
  - `write/share/revoke revokes active share and public access becomes gone`
  - `write/delete removes file, revokes share links, and deletes metadata`
- 证明点：撤销后 public 入口返回 `410`；删除后物理文件和记录同时消失。

## 3. 前台网页层补充证据

- `web/list renders owner content list page`
- `web/detail renders rich text in sandboxed iframe`
- `web public share page renders downloadable file link`

这些测试说明 `T7` 网页层已经接通业务壳，不需要页面直连 PocketBase。
其中 public 文件页现在只提供“下载原始文件”链接，不再在页面内嵌 base64 数据。

## 4. 手工联调建议

若要在本机做一次可演示联调，建议顺序如下：

1. 启动 PocketBase。
2. 在 PocketBase 后台创建管理员账号与 `users_api` 样例用户。
3. 启动业务壳。
4. 使用 [mvp-sample-data.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P1-MVP/02-after-execution/mvp-sample-data.md) 中的请求依次写入 HTML 和文件。
5. 创建分享链接后访问 `/web/public/list`、`/web/public/search?q=关键词`、`/web/public/content/:contentHash` 或 `/web/public/share/:shareHash`。
6. 访问 `/web/list`、`/web/search`、`/web/detail/:contentId` 验证 owner 页面。
7. 执行撤销分享与删除，确认 public 状态立即变化。

## 5. 残留说明

- 当前 owner 网页层仍使用 API Key 头进行访问，更适合内测与联调，不是最终浏览器鉴权方案。
- PocketBase 集合中的 `contents.is_shared` 和 `share_links.is_revoked` 必须为非 required；真实联调已验证这属于启动新环境时必须检查的底座配置点。
- 当前仓库已具备 `bash ./scripts/verify_coldstart_dry_run.sh` 的冷启动 dry-run 能力，但完整冷启动仍依赖联网下载 PocketBase 与 PocketBase 后台人工初始化。
