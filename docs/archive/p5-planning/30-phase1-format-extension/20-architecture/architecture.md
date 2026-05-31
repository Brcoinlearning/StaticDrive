---
doc_id: "architecture"
phase: "architecture-and-tasking"
artifact: "architecture"
status: "approved"
derived_from:
  - "business_rules_memo"
  - "tech_selection"
updated_at: "2026-05-02"
---

# 架构设计文档

## 1. 本轮架构目标

在不重构现有内容主链路的前提下，为内容对象正文增加格式声明和 Markdown 支持，形成“原始正文 + 格式声明 + 最终展示 HTML”三者清晰分离但沿用现有展示骨架的结构边界。

## 2. 本轮明确不采用的方向

1. 不新建第二套平行内容存储模型。
2. 不新建第二套 `rich_text` 公开访问体系。
3. 不采用读取时动态 Markdown 转换路线。
4. 不引入图片上传、托管和资源生命周期管理。
5. 不在本轮立即废弃现有 `POST /api/write/html` 或 `htmlContent` 兼容心智。
6. 不在本轮引入额外 HTML 清洗层。

## 3. 结构边界

本轮架构边界分为五个能力块：

### 3.1 底层内容记录层

继续以现有 `contents` 模型为底座。

字段职责边界：

1. `html_content`：继续保留，但语义明确收敛为“最终展示 HTML”。
2. `body_source`：新增，用于保存原始正文。
3. `body_format`：新增，用于保存正文格式声明，当前仅允许 `html | markdown`。

### 3.2 正文格式适配层

在现有 `contentService` 之上新增一层统一正文格式适配边界。

它负责：

1. 接收 `body + bodyFormat`。
2. 根据 `bodyFormat` 决定是否需要 Markdown -> HTML 转换。
3. 统一生成：原始正文、格式声明、最终展示 HTML。
4. 对外整理统一查询对象：`body`、`bodyFormat`、`renderedBodyHtml`、`htmlContent`。

它不负责：

1. 页面渲染。
2. 图片托管。
3. 公开访问路由分发。

### 3.3 写入与更新接入层

该能力块负责把正文格式适配结果接入现有 `content` 写入和更新主链路。

它负责：

1. 扩展 `POST /api/write/content` 支持 `bodyFormat`。
2. 保持 `POST /api/write/html` 兼容可用。
3. 扩展更新接口，使 Markdown 内容也能按 `body + bodyFormat` 语义更新。

### 3.4 查询输出层

该能力块负责把底层记录重组为统一内容对象输出。

它负责：

1. 返回原始正文 `body`。
2. 返回格式声明 `bodyFormat`。
3. 返回最终展示 HTML `renderedBodyHtml`。
4. 在过渡期保留 `htmlContent` 兼容字段，并使其与 `renderedBodyHtml` 等值。

### 3.5 展示兼容层

该能力块继续复用 owner 页面和 public 页面现有展示骨架。

它负责：

1. owner 详情页继续展示最终展示 HTML。
2. public 页面继续展示最终展示 HTML。
3. 列表摘要继续从最终展示 HTML 派生。

它明确不负责：

1. 自己重新解释 Markdown 原文。
2. 自己动态执行 Markdown 转换。

## 4. 模块职责

### 4.1 持久化层

职责：

1. 承载 `body_source`、`body_format`、`html_content` 三类正文数据。
2. 保持与现有 `contents` 记录骨架兼容。

### 4.2 正文格式适配层

职责：

1. 定义 `html` 与 `markdown` 的统一输入约束。
2. 在写入 / 更新期完成 Markdown -> HTML 转换。
3. 对查询和展示输出提供统一格式语义。

### 4.3 接口接入层

职责：

1. 扩展 `content` 写入接口。
2. 扩展更新接口。
3. 保持 `write/html` 兼容入口可用。

### 4.4 查询输出层

职责：

1. 返回原始正文、格式声明和最终展示 HTML。
2. 统一 `renderedBodyHtml` 与 `htmlContent` 的兼容输出边界。

### 4.5 页面展示层

职责：

1. 继续消费最终展示 HTML。
2. 不在页面层重复做 Markdown 转换或格式推断。

## 5. 依赖方向

必须保持如下依赖关系：

1. 写入与更新接入层依赖正文格式适配层。
2. 正文格式适配层依赖持久化层。
3. 查询输出层依赖正文格式适配层与持久化层。
4. 页面展示层依赖查询输出层，不得自行重建正文格式逻辑。

明确禁止的依赖关系：

1. 页面展示层不得自行动态转换 Markdown。
2. 查询输出层不得绕开正文格式适配层直接发明另一套字段语义。
3. 持久化层不得反向依赖页面层或接口层。

## 6. 与现有项目骨架的衔接方式

1. 继续沿用 `PocketBase + Node 业务壳 + Web 页面层` 现有结构。
2. 继续沿用 `contentService` 作为内容业务主骨架。
3. 继续沿用 owner/public 页面现有 iframe / HTML 展示骨架。
4. 通过“新增最小字段 + 服务层适配 + 页面层复用”方式扩展，而不是进行平台级重构。

## 7. 风险点与控制策略

### 风险 1：原始正文与最终展示 HTML 语义再次混淆

风险描述：

如果 `body`、`bodyFormat`、`renderedBodyHtml`、`htmlContent` 之间关系不清晰，后续写入、查询、更新、页面展示会再次分叉。

控制策略：

1. 在服务层定义单一字段映射规则。
2. 在过渡期保留 `htmlContent` 兼容字段，但要求其始终与 `renderedBodyHtml` 等值。

### 风险 2：Markdown 转换分散到读取或页面层

风险描述：

如果 Markdown 转换不集中在写入 / 更新期，而是分散到查询或页面访问时执行，会迅速产生多套口径。

控制策略：

1. 明确 Markdown 转换只能发生在服务端写入 / 更新期。
2. owner 页面和 public 页面只消费最终展示 HTML。

### 风险 3：更新链路滞后于写入链路

风险描述：

如果 Markdown 只支持新建不支持更新，会造成内容生命周期断层。

控制策略：

1. 将更新接口同步升级列为正式 task。
2. 不允许把“更新以后再补”留到实现期临时假设。

