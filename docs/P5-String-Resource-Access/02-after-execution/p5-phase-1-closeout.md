# P5 Phase 1 Closeout

本文档记录 P5 第一阶段“字符串资源 / 内容对象接入”的正式收口结果，作为本轮从“approved 准备链 + 隔离 worktree 实现”进入“已完成、可演示、可交接”的执行后证据。

文档定位：

- 这是 P5 第一阶段的收口文档，回答“统一内容对象边界、`content` 语义写查、`rich_text` 公开详情复用和 owner 列表增强是否已经成立”。
- 如果你要查看本轮正式开发前的边界、选型、架构、任务和测试契约，请继续看 `docs/P5-String-Resource-Access/10-requirements/`、`15-tech-selection/`、`20-architecture/`、`25-contract/`。
- 如果你要继续进入下一阶段，例如 `bodyFormat`、Markdown 支持或图片策略，请新开下一轮正式需求与准备链，不要把它们混入本轮收口。

## 1. 本轮目标

P5 第一阶段的目标是：

1. 落定统一内容对象输入输出边界。
2. 落定 `title/body/authorName/createdAt` 与现有 `contents` 记录之间的单一映射规则。
3. 提供 `content` 语义的写入与查询入口。
4. 继续复用现有 public content 主链路展示 `rich_text` 内容。
5. 增强 owner 列表页，使其展示标题、正文摘要、来源用户、创建时间。
6. 保持现有文件上传链路兼容。

## 2. 本轮完成内容

本轮已完成：

1. 落定统一内容对象映射规则：
   - `title -> contents.title`
   - `body -> rich_text 记录的 contents.html_content`
   - `authorName -> owner_user_id 关联用户 display_name 派生`
   - `createdAt -> contents.created`
   - `summary -> body 派生的纯文本摘要`
2. 新增 `POST /api/write/content`。
3. 新增 `GET /api/query/content/:contentId`。
4. 继续复用现有 `/api/public/content/:contentHash` 与 `/web/public/content/:contentHash` 主链路展示 `rich_text` 内容。
5. 增强 `/web/list` owner 列表卡片，展示摘要、作者、创建时间，并支持空标题降级。
6. 更新 `README.md`，补充新增写接口、查询接口和 P5 演示脚本说明。
7. 新增 P5 演示脚本：
   - `scripts/p5_demo_common.sh`
   - `scripts/p5_demo_step1_write_content.sh`
   - `scripts/p5_demo_step2_query_and_share.sh`
   - `scripts/p5_demo_step3_print_access_info.sh`
   - `scripts/p5_demo_step4_cleanup_content.sh`

## 3. 本轮未进入内容

本轮没有进入以下内容：

1. 资源访问密码。
2. 第二套平行内容存储模型。
3. 第二套 `rich_text` 公开访问体系。
4. 全局命名重构。
5. Markdown 转换、`bodyFormat`、图片资源托管等下一阶段内容扩展。

这些不属于 P5 第一阶段收口范围，应在后续阶段单独建模。

## 4. 交付状态

截至本轮收口，P5 第一阶段已形成以下可交付能力：

1. `content` 语义写入：`POST /api/write/content`
2. `content` 语义查询：`GET /api/query/content/:contentId`
3. 统一内容对象输出：`title/body/authorName/createdAt/summary`
4. `rich_text` public API 与 public 页面继续可访问
5. owner 列表页增强：摘要 / 作者 / 创建时间 / 空标题降级
6. P5 专用演示脚本，可用于真实服务下的人工演示与清理

## 5. 自动化验证结果

本轮已完成并通过以下自动化验证：

```bash
npm test -- tests/content.test.js
npm test
bash -n scripts/p5_demo_common.sh \
  scripts/p5_demo_step1_write_content.sh \
  scripts/p5_demo_step2_query_and_share.sh \
  scripts/p5_demo_step3_print_access_info.sh \
  scripts/p5_demo_step4_cleanup_content.sh
```

实际结果：

1. `tests/content.test.js`：`62 passed, 0 failed`
2. `npm test`：`86 passed, 0 failed`
3. 新增演示脚本语法检查通过

说明：

- 本轮新增能力和既有主链路未发生自动化回归。
- 新增 P5 演示脚本至少具备基础语法正确性。

## 6. 人工演示与真实联调结果

本轮已完成真实服务下的人工演示，关键结果如下：

1. `POST /api/write/content` 成功写入内容对象。
2. 空标题写入成功。
3. 空 `body` 写入被正确拒绝，返回 `400`。
4. `GET /api/query/content/:contentId` 成功返回统一内容对象。
5. 不存在内容查询正确返回 `404`。
6. `POST /api/write/share` 成功创建分享。
7. `/api/public/content/:contentHash` 对 `rich_text` 内容可访问。
8. `/web/public/content/:contentHash` 可直接展示内容页面。
9. `/web/list` 已展示摘要、作者、创建时间，并支持空标题降级。
10. P5 演示脚本 `step1`、`step2`、`step3` 已在真实服务环境下执行通过。

## 7. 本轮修正的真实问题

本轮执行过程中，修正了以下实际问题：

1. worktree `.env` 中 `PB_ADMIN_PASSWORD` 末尾字符曾误写为全角 `！`，导致 PocketBase 管理员鉴权失败；现已修正为与主仓库一致的半角 `!`。
2. `GET /api/query/content/:contentId` 在真实运行下，对不存在内容的查询最初会把 PocketBase 底层 `404` 包装成 `502 pocketbase_request_failed`；现已在服务层显式把包装后的 `404` 映射回业务上的 `content_not_found / 404`。
3. P5 演示脚本已纳入文档并完成首轮人工验证，避免“代码有了但演示入口缺失”的交付断层。

## 8. 覆盖的 Contract 项

本轮已覆盖：

1. `MF-1`：`content` 对象写入成功。
2. `MF-2`：`content` 对象查询成功。
3. `MF-3`：`rich_text` 公开详情展示成功。
4. `MF-4`：列表页增强成功。
5. `EF-1`：`title` 为空时写入成功。
6. `EF-4`：列表页在 `title` 为空时仍可展示记录。
7. `EF-5`：列表摘要来自正文派生结果。
8. `FF-1`：`body` 为空写入拒绝。
9. `FF-2/FF-3`：不存在或不可公开访问内容的失败流未回归。
10. `T1`、`T3` 高风险预览后写入要求已满足。

## 9. 残余风险

当前仍需明确保留的风险有：

1. `authorName` 依赖 `owner_user_id` 的 `expand` 结果；后续如果绕开当前适配层直接查询 `contents`，容易再次形成分叉口径。
2. `createdAt` 当前固定采用系统 `contents.created`；写入口虽然接受 `createdAt`，但不会覆盖底层时间，这个口径已经固定，后续若要支持显式发布时间，应走新一轮需求与契约变更。
3. 当前“内容页面直接展示”本质上仍以 HTML 型 `rich_text` 为主，不是通用 Markdown / 图片 / 富内容渲染系统。
4. `/api/write/html` 与 `/api/write/content`、`/api/query/detail/:contentId` 与 `/api/query/content/:contentId` 目前并存；后续若继续演进，建议评估是否需要收敛对外文档心智，避免长期双入口漂移。

## 10. 对下一阶段的建议

P5 第一阶段收口后，更合理的后续方向是：

1. 先明确正文格式声明层，例如 `bodyFormat`。
2. 优先考虑 Markdown 支持，再复用现有 HTML 展示链路。
3. 图片资源先评估“外链引用”边界，再决定是否进入资源托管体系。
4. 如需继续进入下一阶段，请重新开启正式需求、选型、架构与契约链路，不要在本轮收口之后直接顺手扩写实现。
