# P5 Phase 1 Closeout

本文档记录 P5 第一阶段补充收口结果：在既有“内容对象接入边界”基础上，继续完成 `bodyFormat + Markdown` 的单一契约闭环，并把写入、更新、查询、owner/public 展示与演示入口统一到同一条 `contents` 主链路。

## 1. 本轮完成目标

本轮完成了以下目标：

1. 固化 `body_source / body_format / html_content` 与 `body / bodyFormat / renderedBodyHtml / htmlContent` 的单一映射规则。
2. 完成 `POST /api/write/content` 对 `html | markdown` 两种正文格式的写入支持。
3. 完成 `POST /api/write/update` 对 `html | markdown` 两种正文格式的更新支持。
4. 完成查询输出与 owner/public 页面对最终展示 HTML 的统一复用。
5. 更新 P5 演示脚本，使 Markdown 主链路可以真实演示。

## 2. 当前统一规则

当前已落定的统一规则如下：

1. `body_source -> body`
2. `body_format -> bodyFormat`
3. `html_content -> renderedBodyHtml`
4. `htmlContent` 作为兼容字段，始终与 `renderedBodyHtml` 等值
5. Markdown 转换只允许发生在写入 / 更新期
6. 查询与页面层只消费最终 HTML，不在页面层动态转换 Markdown

## 3. 本轮完成内容

本轮已完成：

1. `POST /api/write/content` 支持 `bodyFormat=html|markdown`。
2. `POST /api/write/update` 支持 `body + bodyFormat` 更新。
3. 查询对象统一返回 `body / bodyFormat / renderedBodyHtml / htmlContent`。
4. owner 详情页预览统一使用 `renderedBodyHtml`。
5. public 页面预览统一使用 `renderedBodyHtml`。
6. owner 更新表单改为编辑 `body + bodyFormat`，不再停留在旧 `htmlContent` 心智。
7. P5 demo 脚本默认演示 Markdown 写入、查询、owner/public 展示主链路，并覆盖 task list、裸链接、嵌套列表、代码块、表格、标准图片与数学公式样例。

## 4. 范围外仍未进入内容

以下内容仍未进入本轮：

1. 图片上传、托管和清理生命周期。
2. 第二套公开访问体系。
3. 第二套平行内容存储模型。
4. HTML 清洗层。
5. 资源访问密码。
6. 完整 Markdown 规范兼容。

## 5. 自动化验证结果

本轮已完成并通过以下验证：

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

1. `tests/content.test.js`：`124 passed, 0 failed`（含 22 个 Markdown fixture 回归测试 + 2 个 API 集成断言 + 4 个 Web 写入表单测试）
2. P5 demo 脚本语法检查通过

### 5.1 Markdown Fixture 回归体系

已在 `tests/fixtures/markdown/` 下建立输入/输出对（`.md` → `.html`），覆盖 22 个语法点：

| 序号 | Fixture | 语法点 |
|------|---------|--------|
| 1 | `headings` | h1–h6 标题 |
| 2 | `paragraphs` | 多段落 + 段落内强调 |
| 3 | `emphasis` | **粗体** / *斜体* |
| 4 | `ordered-list` | 有序列表 |
| 5 | `unordered-list` | 无序列表（`-` / `*`） |
| 6 | `nested-list` | 多级嵌套无序列表 |
| 7 | `task-list` | task list（`[x]` / `[ ]`） |
| 8 | `nested-task` | 嵌套 task list |
| 9 | `blockquote` | 单行引用 |
| 10 | `multiline-blockquote` | 跨行引用合并 |
| 11 | `inline-code` | 行内代码 |
| 12 | `code-block` | 围栏代码块（含语言标识） |
| 13 | `link` | 链接（含嵌套强调、title、mailto） |
| 14 | `bare-url` | 裸链接自动识别 |
| 15 | `bare-url-punct` | 裸链接标点边界 |
| 16 | `image` | 图片（alt / title） |
| 17 | `table` | 表格 |
| 18 | `table-escaped-pipe` | 表格转义管道符 `\|` |
| 19 | `inline-math` | 行内数学 `$...$` |
| 20 | `block-math` | 块级数学 `$$...$$` |
| 21 | `mixed-list` | 混合列表（有序+无序嵌套） |
| 22 | `hr` | 水平分割线 |

测试策略：
- **parser/渲染输出断言**：每个 fixture 通过 `defaultMarkdownRenderer()` 生成 HTML，与期望 `.html` 逐字比对
- **API 层集成断言**：验证 `body → body_source`、`bodyFormat → body_format`、`renderedBodyHtml → html_content` 的一致性
- **Fixture 生成工具**：`scripts/generate_markdown_fixtures.mjs` 可批量重新生成期望输出

#### 5.1.1 Detail 页渲染样式优化

对 `src/web/page-renderer.js` 中 `buildPreviewSrcdoc()` 的 CSS 做了两处优化：

1. **行内代码可见性**：新增 `body :not(pre)>code{background:rgba(112,79,46,.08);padding:2px 6px;border-radius:5px;color:#8b5a12;}` 规则，使 `` `console.log()` `` 等行内代码有背景色和圆角，与普通文字明确区分。
2. **数学公式字体修复**：从 `.math-inline,.math-block` 中移除 `font-family:"Times New Roman",serif`，避免与 KaTeX 专用数学字体（KaTeX_Main 等）产生渲染冲突。

#### 5.1.2 Demo 展示文件

`tests/fixtures/markdown/demo-showcase.md` 作为 P5 演示脚本的默认正文来源，整合了 22 个 fixture 的所有语法点。其中图片使用 `data:image/png;base64,...` 内嵌真实照片，无网络依赖。

#### 5.1.3 Card/Row 列表信息优化

对 owner 和 public 列表页的卡片视图与横条视图做了信息简化与持久化：

1. **分类型信息展示**：`file` 类型显示源文件名 + 文件大小，`rich_text` 类型不显示无意义的 `0B` 和 MIME 信息。
2. **时间精度**：创建时间从 `2026-05-01 16:00:00.000Z` 截断为 `2026-05-01`。
3. **移除冗余字段**：卡片和横条中不再显示 Content ID、文件类型徽章、"富文本内容无原始文件" 等低价值信息。
4. **作者保留**：owner 和 public 视图均保留作者名展示。
5. **布局持久化**：通过 `localStorage` + 自动重定向脚本实现卡片/横条切换在页面刷新和导航后保持。

#### 5.1.4 Public 页面作者展示修复

Public list/search 页面的作者名此前始终不显示。根因为 `listPublicContents()` 在 PocketBase 查询中缺少 `&expand=owner_user_id` 参数，导致关联用户数据未被返回。修复后 public 页面作者正常显示。

#### 5.2 Web 写入表单（模拟 Agent 字符串写入）

新增 `GET/POST /web/write` 页面，用于直观模拟 Agent 通过 API 传入字符串主体的场景：

- **表单字段**：标题 + 正文（Markdown），必填校验
- **身份处理**：复用现有 owner-page 认证流程（session cookie 或 API Key header），自动以当前登录用户身份写入
- **结果页**：展示 contentId、contentHash、type、公开 API 路径，并提供详情页/继续写入/返回列表快捷链接
- 共 4 个测试用例覆盖正常写入、空字段校验、服务异常等路径

## 6. 本轮覆盖的 Contract 项

本轮已覆盖：

1. `MF-1`：html 正文写入成功。
2. `MF-2`：markdown 正文写入成功，并转换为最终展示 HTML。
3. `MF-3`：markdown 正文更新成功，并同步更新最终展示 HTML。
4. `MF-4`：查询输出与页面展示围绕同一份最终 HTML 工作。
5. `EF-1`：`bodyFormat=html` 时原始正文与最终展示 HTML 关系正确。
6. `EF-2`：`bodyFormat=markdown` 时原文与转换结果并存。
7. `EF-4`：旧 `POST /api/write/html` 继续兼容。
8. `EF-5`：`htmlContent === renderedBodyHtml`。
9. `FF-2`：非法 `bodyFormat` 被拒绝。
10. `FF-3`：Markdown 渲染失败时写入 / 更新被拒绝。
11. `FF-4`：不存在内容查询返回业务 `404`。
12. `FF-5`：页面层未引入 Markdown 动态转换。

## 7. 人工演示入口

当前可用的 P5 演示脚本：

1. `scripts/p5_demo_step1_write_content.sh`
2. `scripts/p5_demo_step2_query_and_share.sh`
3. `scripts/p5_demo_step3_print_access_info.sh`
4. `scripts/p5_demo_step4_cleanup_content.sh`

默认演示顺序：

0. 通过写入表单页面（`/web/write`）模拟 Agent 传入字符串，填写标题和 Markdown 正文，观察写入成功后的结果页。
1. 写入一条 Markdown 内容对象，观察脚本输出里已经声明样例覆盖的能力范围。
2. 查询内容对象，确认 `body / bodyFormat / renderedBodyHtml / htmlContent`，并验证原始 Markdown 与最终 HTML 同时存在。
3. 打开 owner 详情页，重点检查 task list、裸链接、嵌套列表、代码块、表格、图片与公式渲染，同时确认更新表单仍保留原始 `body + bodyFormat`。
4. 打开 public 页面或 share page URL，确认访客侧看到的也是相同的渲染结果，而不是原始 Markdown 文本。
5. 如需排查数据结构，再打开 direct API；演示完成后清理数据。

## 8. 残余风险

当前残余风险主要有：

1. 当前 Markdown renderer 是最小实现，不是完整 Markdown 规范实现（详见第 10 节支持矩阵）。
2. owner 页面目前只提供基础文本域和格式选择，没有更强的富文本 / Markdown 编辑体验。
3. 图片当前只支持正文引用已有可访问 URL，不进入托管责任。
4. Detail 页预览的 CSS 样式硬编码在 `src/web/page-renderer.js` 的 `buildPreviewSrcdoc()` 中（不通过外部样式表），样式变更需重启服务生效，与 demo 正文数据（实时读取文件）的生命周期不同。

### 8.1 已知兼容风险（2026-05 审计）

基于 fixture 回归测试覆盖后的审计，以下兼容风险仍存在：

1. **裸链接 + 中文标点边界**：`https://example.com（首页）` 不会自动链接，因为全角括号 `（）` 不在 URL 结束识别逻辑中；部分中文标点（`；`、`——`）可能被包含在链接文本内而非剥离。
2. **引用块内不支持 Markdown 结构**：引用内容只做行内渲染，不支持引用内嵌套列表、代码块等块级结构。
3. **列表项之间不支持空行**：两段之间若插入空行，会被解析为两个独立列表而非同一个列表的松散段落。
4. **转义覆盖不全**：仅表格管道符 `\|` 支持显式转义，反斜杠转义（`\*`、`\_` 等）在非表格上下文中不生效。
5. **HTML 标签处理**：原始 HTML 标签在 Markdown 中被 `escapeHtml()` 转义为实体，不支持 CommonMark 的 HTML 直通模式；这意味着用户无法在 Markdown 中嵌入 `<details>`、`<kbd>` 等语义标签。

## 9. 下一步建议

P5 第一阶段补充内容完成后，更合理的下一步是：

1. 若继续收口本轮，优先做更完整的演示和人工验证记录。
2. 若进入后续阶段，应单独开启资源访问密码或更强内容格式能力的新准备链。

## 10. Markdown 兼容级别声明与支持矩阵

### 10.1 兼容级别

**Phase-1 Practical Compatibility（实用兼容）**，非完整 CommonMark / GFM 规范实现。

本阶段的目标是为 LLM / agent 生成的技术内容（项目文档、技术笔记、任务清单）提供可用渲染，而非支持所有 Markdown 规范的边界场景。任何不在支持矩阵中的语法点应视为**暂不支持**，不建议依赖。

### 10.2 已支持语法（✅）

| 分类 | 语法点 | 状态 | 说明 |
|------|--------|------|------|
| 标题 | ATX 标题 `#`–`######` | ✅ | 支持行内格式 |
| 段落 | 多段落、段内换行 `<br>` | ✅ | |
| 强调 | `**粗体**` / `__粗体__` | ✅ | |
| 强调 | `*斜体*` / `_斜体_` | ✅ | 仅非单词内部匹配 |
| 列表 | 有序列表 `1.` | ✅ | |
| 列表 | 无序列表 `-` / `*` | ✅ | |
| 列表 | 多级嵌套 | ✅ | 空格 / Tab 缩进 |
| 列表 | Task list `- [x]` / `- [ ]` | ✅ | 含嵌套子列表 |
| 引用 | 单行 / 跨行合并 | ✅ | 多行 `>` 合并 |
| 代码 | 行内代码 `` ` `` | ✅ | |
| 代码 | 围栏代码块 ` ``` ` | ✅ | 含语言标识 |
| 链接 | `[label](url)` | ✅ | 含嵌套强调、title 属性 |
| 链接 | 裸 URL 自动识别 | ✅ | 基础 ASCII 断句 |
| 图片 | `![alt](url)` | ✅ | 含 title 属性 |
| 表格 | 管道表格 | ✅ | 含转义 `\|` |
| 分割线 | `---` / `***` / `___` | ✅ | 仅独立行 |
| 数学 | 行内 `$...$` | ✅ | KaTeX 渲染就绪 |
| 数学 | 块级 `$$...$$` | ✅ | KaTeX 渲染就绪 |
| 混合 | 有序+无序嵌套 | ✅ | 跨类型子列表 |

### 10.3 暂不支持语法（❌）

| 语法点 | 状态 | 备注 |
|--------|------|------|
| Setext 标题（`===` / `---`） | ❌ | 仅支持 ATX |
| 引用内嵌套块级结构 | ❌ | 引用内仅行内渲染 |
| 松散列表（空行分隔） | ❌ | 空行打断列表解析 |
| 缩进代码块（4空格） | ❌ | 仅支持围栏 |
| 删除线 `~~text~~` | ❌ | |
| 脚注 `[^1]` | ❌ | |
| 定义列表 | ❌ | |
| HTML 直通（inline/block） | ❌ | HTML 标签被转义 |
| 自动链接（`<url>` / `<email>`） | ❌ | |
| 反斜杠转义（非表格上下文） | ❌ | 仅表格 `\|` 支持 |
| 链接引用定义 `[id]: url` | ❌ | |
| Emoji 短码 `:smile:` | ❌ | |
