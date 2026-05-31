---
doc_id: "test_contract"
phase: "contract-solidification"
artifact: "test_contract"
status: "approved"
derived_from:
  - "business_rules_memo"
  - "tech_selection"
  - "architecture"
  - "tasks"
updated_at: "2026-05-02"
---

# 测试契约文档

## 1. 四阶段准备链放行契约

在进入正式开发前，必须同时满足以下条件：

1. `business_rules_memo.md`、`tech-selection.md`、`architecture.md`、`tasks.md` 均已存在且内容可用于正式开发。
2. 下一阶段范围仍然仅限：正文格式声明、Markdown 输入支持、原始正文与最终展示 HTML 并存、owner/public 展示兼容。
3. 未把图片托管、附件生命周期、第二套公开访问体系或平台级重构带入本轮。

结构化放行块：

```yaml
release_gate:
  require_documents:
    - business_rules_memo: approved
    - tech_selection: approved
    - architecture: approved
    - tasks: approved
  block_if:
    - "字段映射口径仍存在实现期猜测"
    - "Markdown 转换发生时机仍存在实现期猜测"
    - "图片托管或第二套公开访问体系被混入当前范围"
```

## 2. using-git-worktrees 前置放行契约

在进入正式开发或 `using-git-worktrees` 前，必须确认：

1. 当前要执行的 task 已在 `tasks.md` 中存在明确编号与目标。
2. implementer 已说明该 task 的输入依赖、计划输出和验证口径。
3. 若执行的是高风险 task（T1、T4），必须先给出高风险改动预览说明。
4. 未经文档回写，不允许临时改动 `body/bodyFormat/renderedBodyHtml/htmlContent` 口径。

结构化放行块：

```yaml
worktree_gate:
  require_task_declaration: true
  require_dependency_statement: true
  require_verification_plan: true
  require_preview_for_high_risk_tasks:
    - T1
    - T4
  block_if:
    - "task 未在 tasks 文档中落定"
    - "高风险 task 未先说明改动边界和验证方式"
```

## 3. 正式开发主流程契约

后续正式开发必须覆盖以下主流程，任一未验证都不得视为完成：

1. `html` 正文写入成功。
2. `markdown` 正文写入成功，并能转换为最终展示 HTML。
3. `markdown` 正文更新成功，并能同步更新最终展示 HTML。
4. 查询输出与页面展示对同一份最终展示 HTML 保持一致。

结构化主流程块：

```yaml
main_flows:
  - id: MF-1
    name: "html 正文写入成功"
    pass_when:
      - "bodyFormat=html"
      - "body 被保留为原始 HTML"
      - "renderedBodyHtml 正确生成"
  - id: MF-2
    name: "markdown 正文写入成功"
    pass_when:
      - "bodyFormat=markdown"
      - "body 保留 Markdown 原文"
      - "renderedBodyHtml 为转换后的 HTML"
  - id: MF-3
    name: "markdown 正文更新成功"
    pass_when:
      - "更新接口接受 body + bodyFormat"
      - "更新后原始正文、格式声明、最终展示 HTML 同步变化"
  - id: MF-4
    name: "查询输出与页面展示一致"
    pass_when:
      - "查询返回 body + bodyFormat + renderedBodyHtml"
      - "htmlContent 与 renderedBodyHtml 等值"
      - "owner/public 页面展示来自同一份最终 HTML"
  require_both_api_and_ui_evidence: true
```

## 4. 边界流契约

后续必须验证以下边界流：

1. `bodyFormat=html` 时，原始正文与最终展示 HTML 的关系正确。
2. `bodyFormat=markdown` 时，原始正文保留为 Markdown，最终展示 HTML 为转换结果。
3. HTML 与 Markdown 中引用已有可访问资源时，系统不拦截。
4. 旧 `POST /api/write/html` 继续成功。
5. 兼容字段 `htmlContent` 继续存在并与 `renderedBodyHtml` 等值。

结构化边界流块：

```yaml
edge_flows:
  - id: EF-1
    scenario: "bodyFormat=html"
    expected: "body 保留原始 HTML，renderedBodyHtml 可直接展示"
  - id: EF-2
    scenario: "bodyFormat=markdown"
    expected: "body 保留 Markdown 原文，renderedBodyHtml 为转换后的 HTML"
  - id: EF-3
    scenario: "正文中引用已有可访问资源"
    expected: "系统不拦截，不承担托管责任"
  - id: EF-4
    scenario: "继续调用 POST /api/write/html"
    expected: "兼容成功，且内部等价于统一 html 主链路"
  - id: EF-5
    scenario: "兼容字段 htmlContent"
    expected: "继续存在且与 renderedBodyHtml 等值"
```

## 5. 失败流契约

后续必须验证以下失败流：

1. `bodyFormat` 缺失时，写入拒绝。
2. `bodyFormat` 不是 `html | markdown` 时，写入拒绝。
3. Markdown 转换失败时，写入或更新拒绝。
4. 不存在内容查询时，返回业务 `404`，不得退化为底层 `502`。
5. 若实现试图在页面层自行做 Markdown 动态转换，视为越界失败。

结构化失败流块：

```yaml
failure_flows:
  - id: FF-1
    scenario: "bodyFormat 缺失"
    expected: "写入拒绝"
    blocking: true
  - id: FF-2
    scenario: "bodyFormat 非法"
    expected: "写入拒绝"
    blocking: true
  - id: FF-3
    scenario: "Markdown 转换失败"
    expected: "写入或更新拒绝"
    blocking: true
  - id: FF-4
    scenario: "不存在内容查询"
    expected: "返回业务 404，而不是 pocketbase_request_failed/502"
    blocking: true
  - id: FF-5
    scenario: "页面层自行动态转换 Markdown"
    expected: "直接判定越界失败"
    blocking: true
```

## 6. 透明度检查点契约

每个正式开发 task 开始前，必须显式说明：

1. 当前 task 编号与目标。
2. 依赖的上游 task 或契约前置。
3. 计划如何验证主流程、边界流或失败流。

每个正式开发 task 完成后，必须显式汇报：

1. 实际改动了哪些边界。
2. 验证了哪些契约项。
3. 还有哪些契约项未覆盖。

结构化透明度块：

```yaml
transparency_checks:
  require_task_start_declaration:
    - task_id
    - task_goal
    - dependencies
    - verification_plan
  require_task_closeout:
    - touched_boundaries
    - verified_contract_items
    - uncovered_contract_items
```

## 7. reviewer 隔离契约

1. reviewer 必须以契约文档为准进行独立检查。
2. reviewer 必须至少检查：主流程、边界流、失败流、越界风险、task 依赖一致性。
3. reviewer 必须重点检查：
   - Markdown 转换是否集中在写入 / 更新期
   - `htmlContent` 是否与 `renderedBodyHtml` 等值
   - 旧 `write/html` 是否已经接入统一主链路
   - 更新接口是否真的同步支持 Markdown
   - 页面层是否偷偷引入 Markdown 动态转换

结构化 reviewer 块：

```yaml
reviewer_isolation:
  reviewer_must_check:
    - main_flows
    - edge_flows
    - failure_flows
    - out_of_scope_regressions
    - task_dependency_consistency
  block_if:
    - "字段映射口径未显式说明"
    - "Markdown 转换发生时机未显式说明"
    - "htmlContent 与 renderedBodyHtml 关系未显式说明"
```

## 8. 高风险改动预览后写入契约

T1 与 T4 属于高风险 task，必须遵循“预览后写入”规则：

1. T1 开始前，必须先说明 `body_source / body_format / html_content` 与对外字段映射口径。
2. T4 开始前，必须先说明 owner/public 页面如何继续只消费最终展示 HTML。
3. 若上述预览说明缺失，不允许直接进入写代码阶段。

结构化高风险块：

```yaml
high_risk_preview_gate:
  tasks:
    - task_id: T1
      require_preview:
        - "底层字段映射口径"
        - "统一查询对象输出边界"
    - task_id: T4
      require_preview:
        - "owner/public 页面继续复用最终 HTML 的说明"
        - "禁止页面层动态转换 Markdown 的说明"
  block_if_preview_missing: true
```

## 9. 超出本轮范围的阻断契约

以下情况一旦出现，必须阻断当前阶段推进并回到上游文档修订：

1. 将图片托管、附件生命周期带入当前实现。
2. 试图为 Markdown 或 rich_text 新建第二套公开访问体系。
3. 试图把页面层变成 Markdown 动态渲染器。
4. 试图把本轮扩展演变成内容平台级重构。
5. 试图立即下线现有 `POST /api/write/html`，而没有明确兼容迁移方案。

结构化阻断块：

```yaml
scope_blockers:
  - "图片托管或附件生命周期混入当前范围"
  - "新建第二套 Markdown/rich_text 公开访问体系"
  - "页面层自行承担 Markdown 动态渲染"
  - "内容平台级重构被带入当前任务"
  - "在无迁移方案下直接废弃 POST /api/write/html"
```
