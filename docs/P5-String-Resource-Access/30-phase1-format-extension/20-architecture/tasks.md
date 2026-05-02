---
doc_id: "tasks"
phase: "architecture-and-tasking"
artifact: "tasks"
status: "approved"
derived_from:
  - "business_rules_memo"
  - "tech_selection"
updated_at: "2026-05-02"
---

# 任务拆解文档

## 1. Task 列表

1. T1：正文格式字段与统一适配边界落定
2. T2：写入链路支持 `bodyFormat + markdown`
3. T3：更新链路支持 `bodyFormat + markdown`
4. T4：查询输出与 owner/public 展示兼容接入
5. T5：回归验证与演示脚本更新

## 2. 各 Task 说明

### T1：正文格式字段与统一适配边界落定

目标：

1. 落定 `body_source`、`body_format`、`html_content` 的单一职责。
2. 落定 `body/bodyFormat/renderedBodyHtml/htmlContent` 的统一查询映射规则。
3. 明确 Markdown 转换只发生在写入 / 更新期。

输入依赖：

1. `business_rules_memo.md`
2. `tech-selection.md`

输出结果：

1. 单一字段映射规则。
2. 正文格式适配边界。

关系：

1. 必须最先完成。
2. T2、T3、T4 均依赖该 task。

风险标记：高风险 task

不允许进入实现期临时假设：

1. 不允许在写入、更新、查询、页面层各自临时决定字段口径。

### T2：写入链路支持 `bodyFormat + markdown`

目标：

1. 扩展 `content` 写入入口支持 `bodyFormat`。
2. 当 `bodyFormat=markdown` 时，在服务端写入期完成 Markdown -> HTML。
3. 保持 `POST /api/write/html` 兼容可用。

输入依赖：

1. T1 输出的字段映射与适配规则。

输出结果：

1. 支持 HTML 与 Markdown 的内容写入。
2. 原始正文、格式声明、最终展示 HTML 的写入结果。

关系：

1. 依赖 T1。
2. 与 T3 高相关，但可以先后独立推进。

风险标记：中风险 task

不允许进入实现期临时假设：

1. 不允许把 Markdown 支持实现成只写入格式声明、不做真实转换。

### T3：更新链路支持 `bodyFormat + markdown`

目标：

1. 扩展更新接口支持 `body + bodyFormat`。
2. 对 Markdown 更新同步完成 Markdown -> HTML。
3. 保持现有 HTML 更新兼容。

输入依赖：

1. T1 输出的字段映射与适配规则。
2. 最好复用 T2 的转换能力。

输出结果：

1. Markdown 内容可按统一语义更新。
2. 更新后展示链路继续复用最终展示 HTML。

关系：

1. 依赖 T1。
2. 可在 T2 之后紧接推进。

风险标记：中风险 task

不允许进入实现期临时假设：

1. 不允许让更新链路长期停留在旧 `htmlContent` 心智而不支持 Markdown。

### T4：查询输出与 owner/public 展示兼容接入

目标：

1. 查询输出支持 `body/bodyFormat/renderedBodyHtml/htmlContent`。
2. owner 页面与 public 页面继续复用最终展示 HTML。
3. 列表摘要继续从最终展示 HTML 派生。

输入依赖：

1. T1 输出的字段映射规则。
2. T2 / T3 稳定后的写入与更新结果。

输出结果：

1. 统一查询对象输出。
2. owner / public 页面兼容 HTML 与 Markdown 内容。

关系：

1. 依赖 T1。
2. 最好在 T2、T3 主链路稳定后推进。

风险标记：高风险 task

不允许进入实现期临时假设：

1. 不允许页面层自行动态转换 Markdown 或重新发明展示逻辑。

### T5：回归验证与演示脚本更新

目标：

1. 补齐 HTML / Markdown 两种格式的回归验证。
2. 更新演示脚本，覆盖 Markdown 主链路。
3. 验证 owner/public 页面在 Markdown 内容下的展示结果。

输入依赖：

1. T2、T3、T4 完成后的主链路。

输出结果：

1. 自动化验证与人工演示入口。
2. Markdown 场景的执行后证据。

关系：

1. 依赖 T2、T3、T4。
2. 作为正式开发收口 task。

风险标记：中低风险 task

不允许进入实现期临时假设：

1. 不允许只验证 HTML 路径而忽略 Markdown 路径。

## 3. 串行 / 并行关系

1. T1 必须最先完成。
2. T2、T3 依赖 T1，其中 T3 最好复用 T2 的转换能力。
3. T4 依赖 T1，且最好在 T2、T3 主链路稳定后推进。
4. T5 依赖 T2、T3、T4。

推荐执行顺序：

`T1 -> T2 -> T3 -> T4 -> T5`

## 4. 风险 Task 标记

1. T1：高风险。原因是它决定原始正文、格式声明和最终展示 HTML 的共享口径。
2. T4：高风险。原因是它同时影响查询输出、owner 页面和 public 页面展示一致性。

## 5. 不允许进入实现期临时假设的说明

1. 不允许在不同 task 中各自决定 `body/bodyFormat/renderedBodyHtml/htmlContent` 的映射口径。
2. 不允许让页面层自行做 Markdown 转换。
3. 不允许为了 Markdown 展示另起第二套 public 页面或第二套内容模型。
4. 不允许把图片引用能力偷扩成资源托管能力。
