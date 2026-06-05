# 业务壳前端功能需求说明

本文档描述业务壳服务需要网页层提供的界面、按钮、表单、状态反馈和跳转行为。它不是视觉设计规范；视觉规范以根目录 `DESIGN.md` 为准。这里关注的是：业务壳有哪些能力，前端必须把这些能力以哪些页面和交互暴露出来。

当前网页层由业务壳直接服务端渲染 HTML，核心实现位于：

- `src/app.js`：路由、鉴权、表单处理、重定向和错误页分发。
- `src/web/page-renderer.js`：页面 HTML、CSS、少量前端交互脚本。
- `src/content/service.js`：内容列表、详情、分享、更新、删除、批量操作、公开访问和密码校验的业务能力。

## 1. 产品边界

### 1.1 前端承担的职责

前端需要让两类用户完成任务：

- Owner：登录、浏览自己写入的内容、搜索内容、查看详情、分享/撤销分享、更新标题/正文/访问模式、删除内容、批量管理、查看凭据与会话信息、通过页面写入 Markdown 字符串。
- Public visitor：浏览公开内容、搜索公开内容、查看公开富文本、下载公开文件、输入访问密码。

前端不负责直接实现存储、鉴权、Markdown 渲染、文件落盘、PocketBase schema 管理或批量业务规则；这些由业务壳和 service 层处理。前端必须把服务端返回的状态、错误和成功结果清楚呈现。

### 1.2 前端必须保留的技术边界

- 保持服务端渲染 HTML 的架构，不要求引入 React/Vue/客户端路由。
- Owner 页面同时支持 session cookie 和 API Key header 进入，浏览器主流程以登录后 session cookie 为主。
- Public 页面不要求登录。
- 富文本公开预览必须继续使用 sandboxed iframe。
- Markdown/KaTeX 支持由现有渲染链路决定，前端不得破坏 `bodyFormat`、`renderedBodyHtml`、`htmlContent` 的展示契约。

## 2. 全局导航与壳层

### 2.1 左侧主导航

网页层需要提供四个主入口：

| 入口 | 路由 | 目标 |
| --- | --- | --- |
| Owner 管理 | `/web/list` | Owner 内容管理主界面 |
| 写入内容 | `/web/write` | 手动写入 Markdown 字符串 |
| 凭据中心 | `/web/credential` | 当前 owner 身份、API Key 摘要、会话信息 |
| 公开发现 | `/web/public/list` | Public 公开内容浏览 |

要求：

- 当前入口必须有明确 active 状态。
- active 状态必须由具体页面决定，而不是只按 owner/public 两类模式粗略判断。
- 导航链接必须是 `<a>`，并在当前页使用 `aria-current="page"`。
- 左侧导航不替代页面内的主操作按钮。

### 2.2 全局搜索

Owner 和 Public 都需要顶部搜索框：

- Owner 模式提交到 `/web/search`。
- Public 模式提交到 `/web/public/search`。
- 查询参数为 `q`。
- 搜索框必须有可访问名称和关联 label。

## 3. Owner 认证与会话

### 3.1 Owner 登录页

路由：

- `GET /web/auth/login`
- `POST /web/auth/login`

页面需要：

- API Key 输入框。
- 登录按钮。
- 登录失败 flash。
- 如果已经有有效 session，访问登录页应重定向到 `/web/list`。

提交行为：

- 表单字段名使用配置中的 API Key header 名，当前默认为 `x-shutong49-api-key`。
- 登录成功后服务端设置 HttpOnly session cookie，并跳转 `/web/list`。
- 登录失败后跳回登录页并显示错误。

### 3.2 退出

路由：

- `POST /web/auth/logout`

页面位置要求：

- 退出功能保留在凭据中心或明确的会话区域。
- 内容列表主工作台不应重复放置“退出”按钮，避免工具区冗余。

提交行为：

- 清除 owner session cookie。
- 跳回 `/web/auth/login` 并显示“已退出”提示。

### 3.3 凭据中心

路由：

- `GET /web/credential`

页面需要展示：

- Display Name。
- Owner ID。
- API Key Header。
- Session Cookie 名称。
- API Key 摘要，不展示完整 API Key。
- 退出当前会话按钮。
- 返回列表按钮。

边界：

- 当前版本不提供 API Key 轮换、设备管理、会话列表等真实操作。
- 如果页面文案提到未来能力，必须明确是后续方向，不能伪装成已可用功能。

## 4. Owner 内容列表与搜索

### 4.1 内容列表

路由：

- `GET /web/list`

支持参数：

- `page`
- `perPage`
- `layout=rows|cards`
- `missingLocalFileOnly=1`

页面目标：

- 这是 owner 侧主工作台。
- 需要让 owner 快速扫描内容、确认公开状态、发现缺失本地文件、进入详情页、开启批量管理。

页面需要展示：

- 内容总览：总数、当前页。
- 内容卡片或横条列表。
- 每条内容至少展示：
  - 类型：Rich Text 或 File。
  - 分享状态：已公开或未公开。
  - 标题或原始文件名。
  - 摘要。
  - 作者。
  - 创建时间。
  - 内容 ID。
  - MIME。
  - 文件大小。
  - 文件缺失警告，若 `localFileExists === false`。
- 空状态：当前没有内容时提示可通过 Open API 或写入页面创建内容。

内容总览右侧工具要求：

- 只放三类工具：
  - 筛选：切换是否只看缺失本地文件；已筛选时显示“查看全部”。
  - 批量管理：一个开关按钮，不默认开启。
  - 视图控制：在横条视图和卡片视图之间切换。
- 不应在列表工作台上重复放置“凭据与会话”和“退出”。
- 不应显示“返回全部内容”这类对主列表无意义的按钮。

### 4.2 Owner 搜索

路由：

- `GET /web/search`

支持参数：

- `q`
- `page`
- `perPage`
- `layout=rows|cards`
- `missingLocalFileOnly=1`

页面需要：

- 显示搜索关键词和命中数量。
- 复用列表页的卡片/横条展示。
- 保留筛选、批量管理、视图切换工具。
- 空状态需要说明没有匹配项，并提供返回或调整关键词的方向。

## 5. 批量管理

### 5.1 批量管理开关

批量管理是列表和搜索页的模式开关，不是默认展开的大面板。

默认状态：

- 页面只显示“批量管理”按钮。
- 内容卡片/横条不显示 checkbox。
- 不展示批量动作按钮，避免占用页面空间。

开启状态：

- 卡片/横条显示 checkbox。
- 已选择的卡片/横条需要有明确视觉状态。
- 批量动作区出现。
- 未选择内容时，批量提交按钮禁用。
- 关闭批量管理时应清空所有已选项。

### 5.2 批量动作

提交路由：

- `POST /web/action/batch`

表单字段：

- `contentIds`：选中的内容 ID，可多个。
- `batchAction`：批量动作。
- `query`：如果当前来自搜索页，需要保留。
- `page`：保留当前页。
- `missingLocalFileOnly=1`：如果当前处于缺失文件筛选，需要保留。

必须支持四个动作：

| 动作 | `batchAction` | 按钮文案 |
| --- | --- | --- |
| 批量分享 | `share` | 批量分享 |
| 批量撤销分享 | `share_revoke` | 批量撤销分享 |
| 清理缺失本地文件记录 | `cleanup_missing_file_records` | 清理缺失 |
| 批量删除 | `delete` | 批量删除 |

行为要求：

- 成功后跳回 `/web/list`，并保留 `query/page/missingLocalFileOnly` 等列表状态。
- 成功后展示 flash，说明完成数量。
- 批量删除是危险动作，需要视觉上区分为 danger。
- 清理缺失文件记录只会真正删除缺失本地文件的文件记录；业务规则由 service 层执行，前端只负责提交当前选择。

## 6. Owner 内容详情

路由：

- `GET /web/detail/:contentId`

页面目标：

- 展示单条内容的完整状态、预览、公开访问能力和 owner 操作。

页面需要展示：

- 摘要区：
  - Content ID。
  - 内容 Hash。
  - Owner。
  - 分享状态。
  - 访问模式：public 或 password。
- 富文本内容：
  - 显示最终展示预览。
  - iframe 使用 sandbox。
  - Markdown 内容应展示渲染后的 HTML，而不是原始 Markdown。
- 文件内容：
  - 文件名。
  - MIME。
  - 大小。
  - 本地文件状态。
  - 已分享时提供公开下载页链接。
  - 本地文件缺失时显示警告。

### 6.1 单内容操作

详情页需要提供：

- 创建分享：`POST /web/action/share`
- 撤销分享：`POST /web/action/share/revoke`
- 删除内容：`POST /web/action/delete`
- 保存更新：`POST /web/action/update`

创建分享/撤销分享：

- 根据当前分享状态只显示当前可用动作。
- 成功后回到当前详情页并显示 flash。

删除：

- 必须放在明确的危险区域。
- 不使用浏览器 `confirm()`。
- 提交前需要让用户看到删除的含义。
- 成功后跳回 `/web/list`。

公开链接：

- 已分享时展示公开访问页和原始接口地址。
- 未分享时说明外部用户无法访问。

### 6.2 内容更新

更新表单字段：

- `contentId`
- `title`
- 富文本内容可编辑：
  - `body`
  - `bodyFormat=html|markdown`
- 文件内容只允许改标题，不支持在浏览器内替换二进制文件。
- 访问模式：
  - `accessMode=public`
  - `accessMode=password`
- 密码模式字段：
  - `accessPassword`
  - `accessHint`

行为要求：

- 访问模式切到 password 时显示密码和提示字段。
- 访问模式切到 public 时隐藏并禁用密码字段，同时清空密码输入。
- 保存成功后回到详情页并显示 flash。
- 更新后公开访问地址保持不变。

## 7. 写入内容页面

路由：

- `GET /web/write`
- `POST /web/write`

页面目标：

- 模拟 agent 通过网页手动写入 Markdown 字符串。

页面需要：

- 标题输入框。
- Markdown 正文 textarea。
- 写入内容库按钮。
- 返回列表按钮。
- 说明区，解释该页面是字符串写入场景。

提交行为：

- 标题和正文必填。
- 当前写入固定走 Markdown：`bodyFormat=markdown`。
- 成功后展示写入结果页。
- 失败时展示错误页或错误提示。

写入结果页需要展示：

- 内容 ID。
- 类型。
- 内容 Hash。
- 公开 API，如果后端返回。
- 查看详情页按钮。
- 继续写入按钮。
- 返回列表按钮。

## 8. Public 公开发现

### 8.1 公开列表

路由：

- `GET /web/public/list`

支持参数：

- `page`
- `perPage`
- `layout=rows|cards`

页面目标：

- 让外部访客浏览已公开内容。

页面需要：

- 公开内容总览。
- 公开内容卡片或横条视图。
- 每条内容展示：
  - 类型：公开富文本或公开文件。
  - 标题。
  - 摘要。
  - 创建/更新时间。
  - MIME。
  - 大小。
  - 查看详情按钮。
- 视图切换。
- 刷新公开列表按钮。

边界：

- Public 列表不展示 owner-only 信息，如 owner ID、批量管理、更新、删除。

### 8.2 公开搜索

路由：

- `GET /web/public/search`

支持参数：

- `q`
- `page`
- `perPage`
- `layout=rows|cards`

页面需要：

- 显示关键词和命中数量。
- 复用公开列表展示。
- 视图切换。
- 返回公开列表按钮。
- 空状态说明没有匹配的公开内容。

## 9. Public 内容访问

路由：

- `GET /web/public/content/:contentHash`
- `GET /web/public/share/:shareHash`

页面目标：

- 让公开访客查看富文本或下载文件。

富文本页面需要：

- 标题。
- 类型 badge。
- sandboxed iframe 预览。
- 正文格式说明。
- 访问方式说明：内容 hash 或分享链接。

文件页面需要：

- 标题或原始文件名。
- 文件名。
- MIME。
- 文件大小。
- 下载原始文件按钮。
- 访问方式说明。

边界：

- Public 页面不得出现 owner 更新、删除、批量、凭据、退出等操作。
- 未公开、无权限、失效分享、内容不存在都应进入明确错误页或密码页。

## 10. Public 密码访问

路由：

- `GET /web/public/content/:contentHash` 遇到密码保护时返回密码页。
- `POST /web/public/content/:contentHash/password`
- `GET /web/public/share/:shareHash` 遇到密码保护时返回密码页。
- `POST /web/public/share/:shareHash/password`

页面需要：

- 密码输入框。
- 验证并访问按钮。
- 可选访问提示。
- 密码错误时，错误文本靠近密码字段。
- 错误输入需要使用 `aria-invalid` 和 `aria-describedby`。

提交行为：

- 成功后设置短期 public access cookie，并跳回原公开页面。
- 密码错误时留在密码页并显示错误。
- 尝试次数过多时显示限制提示。

## 11. 错误与反馈

前端需要统一处理以下反馈：

- 成功 flash：登录成功、分享已创建、分享已撤销、内容已更新、内容已删除、批量操作完成、清理完成、退出完成。
- 信息 flash：请先登录、已退出。
- 错误 flash：登录失败、操作失败、写入失败。
- 错误页：
  - 400 请求参数错误。
  - 401 需要密码或登录。
  - 403 无权访问或不可公开访问。
  - 404 内容不存在。
  - 410 分享已失效。
  - 500 页面加载失败或公开访问失败。

要求：

- 错误信息必须使用用户能理解的中文。
- 不使用 `alert()` 或 `confirm()` 作为主要交互。
- 失败后尽量保留用户所在上下文，例如详情页操作失败回详情页，批量失败回列表页。

## 12. 可访问性要求

- 所有表单字段必须有 label。
- 所有按钮和链接必须有可访问名称。
- icon 作为装饰时使用 `aria-hidden="true"` 和 `focusable="false"`。
- 选中状态、当前页面、错误状态不能只依赖颜色。
- 当前导航项必须有 `aria-current="page"`。
- 批量管理开关使用 `aria-pressed`。
- 密码错误需要和输入框程序化关联。
- 所有主要流程必须支持键盘操作。

## 13. 响应式要求

- 860px 以下左侧栏变为顶部块状导航。
- 640px 以下按钮和表单操作需要自动换行或撑满宽度，避免文字挤压。
- 详情页双栏在窄屏变为单栏。
- 批量管理开启后，checkbox 不应挤压标题到不可读。
- 富文本 iframe 在移动端保持可读，不产生水平溢出。

## 14. 不在当前前端范围内的能力

以下能力不是当前网页层必须提供的功能：

- API Key 轮换。
- 多设备会话管理。
- 文件二进制替换上传。
- Public 页面 SEO/OG 社交分享卡片。
- 复杂权限角色管理。
- 客户端路由、离线缓存、前端状态管理框架。
- 对 PocketBase schema 的管理 UI。

## 15. 验收清单

实现或改造前端时，至少需要验证：

- `GET /web/auth/login` 可以展示登录页。
- `POST /web/auth/login` 成功后进入 `/web/list`。
- `/web/list` 展示内容总览、筛选、批量管理、视图切换和内容项。
- 批量管理默认关闭，开启后才显示 checkbox 和批量动作。
- 四个批量动作都能提交到 `/web/action/batch`。
- `/web/detail/:contentId` 能展示摘要、预览/文件信息、分享、更新、删除。
- `/web/write` 能写入 Markdown 字符串并显示结果。
- `/web/public/list` 和 `/web/public/search` 不展示 owner-only 操作。
- `/web/public/content/:hash` 能展示富文本或下载文件。
- 密码保护公开内容会进入密码页，成功后能访问。
- 运行 `node --test`。
- 对主要浏览器流程运行 `E2E_BASE_URL=http://127.0.0.1:8788 npm run test:e2e`。
