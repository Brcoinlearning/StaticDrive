---
doc_id: "tech_selection"
phase: "tech-selection"
artifact: "tech_selection"
status: "approved"
derived_from:
  - "business_rules_memo"
updated_at: "2026-05-02"
---

# 技术选型文档

## 1. 本轮技术目标

在不重构现有内容主链路的前提下，为内容对象正文增加格式声明能力，支持 `html` 与 `markdown` 两种输入格式，并保证 Markdown 写入后能够转换为最终展示 HTML，继续沿用现有 owner / public 展示骨架。

## 2. 已确认的输入约束

1. 上游输入为 `docs/P5-String-Resource-Access/30-phase1-format-extension/10-requirements/business_rules_memo.md`。
2. 正文格式当前仅考虑 `html | markdown`。
3. `markdown` 不是只做声明，而是必须真正转换并可展示。
4. 系统同时保留原始正文、格式声明和最终展示 HTML。
5. 查询结果必须能同时提供原始正文、格式声明和最终展示 HTML。
6. 页面与公开详情继续消费最终展示 HTML。
7. 图片和外部资源只支持引用已有可访问 URL，不进入托管体系。
8. 现有 `POST /api/write/html` 继续保留，新能力主路径通过统一 `content` 语义承载。

## 3. 候选方案列表

### 方案 A：最小兼容增强路线

继续复用现有 `contents.html_content` 字段承载“最终展示 HTML”，新增少量字段用于保存原始正文与格式声明，在服务端写入时完成 Markdown 转 HTML。

### 方案 B：并行语义清晰字段路线

新增一组平行字段，例如 `raw_body`、`body_format`、`rendered_body_html`，从存储层开始明确区分原始正文与展示正文。

### 方案 C：读取时动态转换路线

存储原始 Markdown 或 HTML，查询、详情和 public 页面访问时再动态进行 Markdown 转 HTML。

## 4. 方案契合度与代价分析

### 方案 A：最小兼容增强路线

契合点：

1. 与当前项目现状最契合，改动集中在现有内容主链路。
2. 可以继续复用 owner 详情页、public 页面、列表页和 `htmlContent` 兼容心智。
3. Markdown 转换发生在服务端写入期，避免查询和展示阶段再分叉。
4. 满足“同时保留原始正文、格式声明、最终展示 HTML”的需求，同时不需要新建第二套展示体系。

代价：

1. `html_content` 的语义将从“原始 HTML”进一步收敛为“最终展示 HTML”。
2. 需要为原始正文和格式声明补充新的底层承载字段。
3. 需要继续处理现有 `htmlContent` 字段与未来 `renderedBodyHtml` 的兼容关系。

结论：本轮主选方案。

### 方案 B：并行语义清晰字段路线

契合点：

1. 语义最清晰，原始正文与最终展示正文从底层即完全分离。
2. 更利于未来进一步演进编辑和格式体系。

代价：

1. 明显放大 schema、兼容和迁移成本。
2. 更接近一次内容模型扩容，而不是当前目标下的最小增强。
3. 会增加 owner/public 展示链路的适配复杂度。

结论：本轮不采用。

### 方案 C：读取时动态转换路线

契合点：

1. 存储更贴近原始输入。
2. 若未来渲染策略变化，重新渲染更灵活。

代价：

1. 每次查询、详情和 public 访问都要重复转换。
2. 容易让查询输出、owner 页面和 public 页面各自形成不同渲染口径。
3. 与当前“同时保留最终展示 HTML”的边界相冲突。

结论：本轮不采用。

## 5. 对现有项目结构的沿用策略

1. 继续沿用现有 `contents` 统一模型和 `rich_text` 类型心智。
2. 继续沿用 `contentService` 作为内容适配与业务主骨架。
3. 继续沿用 owner 页面与 public 页面现有展示骨架。
4. 继续沿用现有 `POST /api/write/html` 兼容入口，不在本轮立即废弃。
5. 新能力主路线继续通过统一 `content` 语义写入、查询和更新接口承载。

## 6. 可复用开源仓库 / 公开实现检查结果

整体复用对象：无。

判断理由：

1. 当前需求只是为现有内容主链路增加正文格式声明与 Markdown 转 HTML 转换，不需要引入完整内容平台。
2. 类似 Wiki.js、Memos 等系统虽然在内容平台能力上更完整，但其整体对象模型、资产体系和权限设计都明显超出本轮范围。
3. 当前更合理的复用粒度是“局部依赖”，即引入轻量 Markdown 解析库，而不是整体借鉴外部系统架构。

局部复用对象：轻量 Markdown 解析库。

复用结论：

1. 可以引入轻量 Node 侧 Markdown 解析库，服务端写入时完成 Markdown 转 HTML。
2. 不引入更重的内容处理框架或平台级外部系统。
3. 下一阶段先不额外引入 HTML 清洗库。

## 7. 明确采用项

1. 采用“最小兼容增强路线”。
2. 继续复用 `contents.html_content` 作为最终展示 HTML 主字段。
3. 新增原始正文存储字段和 `bodyFormat` 字段。
4. 采用服务端写入时 Markdown 转 HTML 的路线。
5. 采用“查询同时返回原始正文、格式声明、最终展示 HTML”的输出策略。
6. 采用 owner 更新接口同步升级策略，使 Markdown 内容也能按 `body + bodyFormat` 语义更新。
7. 采用“外部资源仅引用、不托管”的图片边界。
8. 采用“局部引入轻量 Markdown 解析库”策略。

## 8. 明确不采用项

1. 不采用新建平行内容存储字段体系作为本轮主路线。
2. 不采用读取时动态 Markdown 转换路线。
3. 不采用新的 public 访问体系。
4. 不采用图片上传、图片托管和资源生命周期管理。
5. 不采用下一阶段立即下线 `POST /api/write/html` 的路线。
6. 不采用下一阶段直接引入 HTML 清洗层的路线。
7. 不采用整体复用大型外部内容平台的路线。

## 9. 带入 Architecture 的技术约束

1. 架构必须继续复用现有 `contents` 统一模型。
2. 架构必须明确原始正文、格式声明和最终展示 HTML 的底层字段映射关系。
3. Markdown 转换必须在服务端写入或更新阶段完成，而不是在读取时动态分散执行。
4. owner 页面、public 页面和查询接口必须共享同一最终展示 HTML 来源。
5. 更新接口必须与写入接口保持同一正文格式语义。
6. 现有 `htmlContent` 兼容字段与未来 `renderedBodyHtml` 的关系必须在架构阶段明确，避免双字段语义漂移。
7. 图片边界必须维持“只渲染已有可访问 URL”，不得隐式引入资源托管责任。

## 10. 待确认事项

1. 原始正文和 `bodyFormat` 的底层字段具体命名尚未固化。
2. `renderedBodyHtml` 是否作为新正式字段输出，还是以现有 `htmlContent` 兼容字段延续，尚待架构阶段明确。
3. 轻量 Markdown 解析库的具体选型尚未固化。
4. Markdown 转换失败时的错误结构是否沿用现有 `bad_request` / `write failed` 体系，尚待后续契约阶段明确。
