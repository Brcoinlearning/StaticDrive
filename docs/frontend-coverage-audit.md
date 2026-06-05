# 前端功能覆盖审计

审计日期：2026-06-06

本审计基于 `docs/business-shell-frontend-requirements.md`，对照当前 `src/app.js`、`src/web/page-renderer.js`、`tests/content.test.js` 和 `e2e/p3-owner-public.spec.js` 的实现情况。目标是确认业务壳要求前端承担的页面、按钮、状态和交互是否已经被覆盖，并给出下一轮优先级。

## 1. 总体结论

当前前端已经覆盖业务壳的主要功能面：

- Owner 登录与 session。
- Owner 内容列表、搜索、筛选、批量管理、视图切换。
- Owner 内容详情、分享、撤销分享、更新、删除。
- Owner 手动写入 Markdown 字符串。
- Public 公开列表、搜索、内容访问、文件下载。
- Public 密码访问。
- Flash、错误页、基础可访问性和响应式布局。

我对功能覆盖的判断是：主流程可用，核心契约基本清楚；但前端代码组织和若干细节状态还没有到长期维护舒服的程度。当前最值得继续做的不是大规模重设计，而是把页面能力、样式和测试边界继续收紧。

## 2. 已确认覆盖

### 2.1 全局导航

已覆盖：

- 左侧导航包含 Owner 管理、写入内容、凭据中心、公开发现。
- 当前页使用独立 `activeNav` 控制 active 状态。
- 当前导航项带 `aria-current="page"`。
- icon 为装饰图标，使用 `aria-hidden="true"` 和 `focusable="false"`。

风险：

- 当前 icon helper、导航、CSS 都在 `page-renderer.js` 中，长期维护成本会升高。

### 2.2 Owner 登录与会话

已覆盖：

- `/web/auth/login` 登录页。
- API Key 表单。
- 成功后设置 owner session cookie 并跳转 `/web/list`。
- 已登录访问登录页会跳转列表。
- `/web/auth/logout` 清 session 并返回登录页。
- 凭据中心展示 owner 身份、API Key 摘要、header 名、cookie 名。

已修正：

- 内容列表页不再重复放置“凭据与会话”和“退出”，避免主工作台工具区冗余。

### 2.3 Owner 内容列表与搜索

已覆盖：

- `/web/list` 与 `/web/search`。
- 卡片视图和横条视图。
- 内容类型、分享状态、标题、摘要、作者、创建时间、内容 ID、MIME、大小。
- 本地文件缺失警告。
- 搜索关键词和命中数量。
- 空状态。

已修正：

- Owner 工具栏固定为三类工具：筛选、批量管理、视图控制。
- 空列表时也保持这套工具结构，不回退到“返回全部内容”。
- 空列表时批量管理按钮禁用。
- 在缺失文件筛选下切换视图，会保留 `missingLocalFileOnly=1`。

### 2.4 批量管理

已覆盖：

- 批量管理默认关闭。
- 开启后卡片/横条显示 checkbox。
- 关闭后清空选择。
- 未选择内容时批量动作按钮禁用。
- 支持四个动作：
  - `share`
  - `share_revoke`
  - `cleanup_missing_file_records`
  - `delete`
- 批量动作提交到 `/web/action/batch`。
- 提交时保留 `query`、`page`、`missingLocalFileOnly`。

已新增验证：

- HTML 测试覆盖批量工具栏、清理缺失动作、缺失文件筛选状态保留。
- E2E 覆盖批量管理开关、checkbox 显示/隐藏、选中后批量分享按钮启用。

风险：

- 批量删除目前只有 danger 视觉区分，没有二次确认。需求文档只要求危险视觉区分；如果后续实际内容更敏感，可以加“输入确认”或 inline danger confirmation。

### 2.5 Owner 内容详情

已覆盖：

- `/web/detail/:contentId`。
- 摘要区展示 Content ID、Hash、Owner、分享状态、访问模式。
- 富文本使用 iframe 预览。
- 文件展示文件名、MIME、大小、本地文件状态、公开下载页链接。
- 分享/撤销分享。
- 更新标题、正文、正文格式、访问模式、访问密码、访问提示。
- 删除使用 inline danger zone，不使用浏览器 `confirm()`。

风险：

- 更新表单比较密，下一轮视觉上可以把“内容更新”和“访问控制”拆成更清楚的两个区域。

### 2.6 写入内容

已覆盖：

- `/web/write` GET/POST。
- 标题输入。
- Markdown 正文 textarea。
- 写入内容库按钮。
- 返回列表按钮。
- 成功结果页展示内容 ID、类型、内容 Hash、公开 API、查看详情、继续写入、返回列表。

风险：

- 当前页面更像测试入口，还不是很像正式写作/发布界面。下一轮可以提升编辑器 affordance，比如正文格式说明、写入后的下一步更清晰。

### 2.7 Public 公开发现与内容访问

已覆盖：

- `/web/public/list`。
- `/web/public/search`。
- `/web/public/content/:contentHash`。
- `/web/public/share/:shareHash`。
- 公开富文本 iframe 展示。
- 公开文件下载按钮。
- 公开列表/搜索不展示 owner-only 操作。

风险：

- Public 页面仍使用同一套通用 `renderToolbar` 标题“内容总览”。功能上没问题，但文案可更贴合公开发现，例如“公开内容总览”。

### 2.8 Public 密码访问

已覆盖：

- 内容 hash 和 share hash 的密码页。
- 密码输入框。
- 验证并访问按钮。
- 访问提示。
- 密码错误时 `aria-invalid` 和 `aria-describedby`。
- 成功后设置短期 public access cookie 并返回公开页。

风险：

- 密码页错误、次数限制、访问提示的视觉层级还可以继续强化。

## 3. 当前测试覆盖

已有验证：

- `node --test` 覆盖 API、service、web HTML、owner/public 路由、批量动作、密码访问、Markdown 渲染。
- `npm run test:e2e` 覆盖 owner 登录、内容详情、分享状态管理、凭据页、退出、public 列表/搜索/下载/iframe。
- 新增 E2E 覆盖批量管理开关基础交互。

测试缺口：

- 尚未覆盖访问模式 public/password 在浏览器内切换时字段显示/禁用行为。
- 尚未覆盖批量删除按钮的 danger 视觉/禁用状态之外的确认体验。
- 尚未覆盖移动端响应式截图或布局断言。

## 4. 下一轮建议

### P1：拆分前端渲染文件

当前 `src/web/page-renderer.js` 过重，包含：

- icon 字典。
- layout。
- 全局 CSS。
- 每个页面的 HTML。
- 批量管理脚本。
- 更新表单脚本。

建议拆成：

- `src/web/icons.js`
- `src/web/layout-renderer.js`
- `src/web/styles.js`
- `src/web/owner-pages.js`
- `src/web/public-pages.js`

目标不是重构成框架，而是让服务端渲染继续轻量，同时让后续 UI 改造不必在一个大文件里穿行。

### P2：详情页信息架构二次整理

建议把详情页右侧区域整理为：

- 访问控制。
- 分享状态。
- 危险操作。

把内容更新表单里的访问模式拆出去，降低视觉密度。

### P3：Public 页面文案和视觉独立性

Public 页面不需要 owner 管理味那么重。建议：

- Toolbar 文案从“内容总览”改为“公开内容总览”。
- Public 文件下载页加强主下载按钮和文件元信息。
- Public 富文本页更像阅读页，而不是管理页预览。

### P4：补浏览器端交互测试

建议新增或扩展 E2E：

- Owner 详情页切换 `accessMode=password` 后密码字段出现。
- 切回 `public` 后密码字段隐藏且禁用。
- 批量管理全选、清空选择按钮。
- 移动端 viewport 下列表和详情不水平溢出。

## 5. 当前不建议做的事

- 不建议现在引入 React/Vue/Tailwind。
- 不建议为了拆文件改变路由或业务行为。
- 不建议继续大量加视觉装饰，先把现有工作台的信息架构稳定住。
- 不建议把 Public SEO/OG 当作当前优先级，除非外部分享预览成为真实需求。
