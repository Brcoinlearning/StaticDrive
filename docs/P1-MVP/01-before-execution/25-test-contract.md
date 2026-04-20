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
updated_at: "2026-04-17"
---

# 测试契约文档

## 1. 四阶段准备链放行契约

本阶段用于把前 3 个阶段的正式产物固化成可执行的开发前契约。只有以下条件同时满足，才允许进入正式开发：

- `10-requirements/business_rules_memo.md` 存在且 `status=approved`。
- `15-tech-selection/tech-selection.md` 存在且 `status=approved`。
- `20-architecture/architecture.md` 存在且 `status=approved`。
- `20-architecture/tasks.md` 存在且 `status=approved`。
- `25-contract/test_contract.md` 存在且 `status=approved`。

```yaml
contract_meta:
  doc_id: "test_contract"
  version: 1

scenarios:
  - scenario_id: "contract-gate-001"
    scenario_type: "phase_gate"
    phase_gate: "using-git-worktrees"
    title: "四阶段全部通过后才允许进入正式开发"
    required_evidence:
      - "business_rules_memo.status=approved"
      - "tech_selection.status=approved"
      - "architecture.status=approved"
      - "tasks.status=approved"
      - "test_contract.status=approved"
    pass_condition: "all_required_documents_approved"
    fail_block: true
```

## 2. using-git-worktrees 前置放行契约

进入 `using-git-worktrees` 前，必须满足以下前置条件：

- 已确认本轮主承载架构为 `PocketBase + 业务壳 + 对外访问层`。
- 已确认 `PocketBase` 为固定底座，不允许在实现期替换或手搓等价底座。
- 已确认统一 `Content` 模型覆盖文件和 HTML 富文本。
- 已确认后续实现以 `20-architecture/tasks.md` 作为 task 执行源。
- 若工作区存在与当前任务无关的脏改动，不得清理或回退它们。

```yaml
scenarios:
  - scenario_id: "contract-gate-002"
    scenario_type: "entry_gate"
    phase_gate: "using-git-worktrees"
    title: "正式开发前必须锁定底座与统一模型"
    required_evidence:
      - "architecture.section_3.selected_base=PocketBase"
      - "architecture.section_5.unified_content_model=true"
      - "tasks_as_execution_source=true"
    pass_condition: "base_and_model_locked"
    fail_block: true
```

## 3. 正式开发主流程契约

后续正式开发至少必须覆盖以下 8 条主流程，缺失任一条都不得宣布 MVP 可用：

- 使用有效 API Key 上传文件成功。
- 使用有效 API Key 保存 HTML 富文本成功。
- 发布者查看自己的内容列表成功。
- 发布者按标题或文件名执行搜索成功。
- 发布者查看自己的内容详情成功。
- 外部用户通过有效分享链接访问 HTML 内容成功。
- 外部用户通过有效分享链接下载或预览文件成功。
- 发布者删除内容、撤销分享后，结果与访问状态同步生效。

```yaml
scenarios:
  - scenario_id: "flow-main-001"
    scenario_type: "main_flow"
    title: "文件上传主链路"
    required_evidence:
      - "valid_api_key_upload_success"
      - "content_record_created"
      - "physical_file_persisted"
      - "content_hash_returned"
    pass_condition: "write_path_consistent"
    fail_block: true

  - scenario_id: "flow-main-002"
    scenario_type: "main_flow"
    title: "HTML 保存主链路"
    required_evidence:
      - "valid_api_key_html_save_success"
      - "content_type=rich_text"
      - "html_content_persisted"
      - "content_hash_returned"
    pass_condition: "rich_text_write_consistent"
    fail_block: true

  - scenario_id: "flow-main-003"
    scenario_type: "main_flow"
    title: "列表 搜索 详情 查询主链路"
    required_evidence:
      - "owner_scoped_list_success"
      - "owner_scoped_search_success"
      - "owner_scoped_detail_success"
    pass_condition: "query_flow_available"
    fail_block: true

  - scenario_id: "flow-main-004"
    scenario_type: "main_flow"
    title: "分享访问 删除 撤销主链路"
    required_evidence:
      - "share_link_create_success"
      - "share_hash_resolve_success"
      - "delete_flow_consistency_verified"
      - "revoke_share_immediately_invalid"
    pass_condition: "external_access_controlled"
    fail_block: true
```

## 4. 边界流契约

后续实现与 review 必须覆盖以下边界流：

- 文件名包含空格、中文、特殊字符时，系统仍能稳定保存并提供 hash 访问。
- HTML 内容为空、仅标题、或包含较长正文时，系统行为明确且可重复。
- 列表接口在无数据时返回空列表，而不是异常。
- 搜索无命中时返回空结果，并保留合法分页结构。
- 同一拥有者存在多条内容时，排序和分页仍然建立在统一 `Content` 模型之上。
- 已创建但未分享的内容，不得被外部分享访问入口读取。

## 5. 失败流契约

后续实现与 review 必须覆盖以下失败流；若行为与契约不符，必须阻断放行：

- 无效 API Key 调用受保护接口时返回 `401`。
- 用户访问他人内容且无有效分享时返回 `403`。
- 访问不存在的 `content_hash` 或 `share_hash` 时返回 `404`。
- 访问已撤销分享时返回明确失效状态，不得继续返回内容。
- 文件落盘失败时，不得遗留成功态 `Content` 记录。
- 元数据写入失败时，不得遗留孤儿物理文件。
- `content_hash` 或 `share_hash` 冲突时必须重新生成，不得直接覆盖既有记录。

## 6. 透明度检查点契约

正式开发期间，每个 task 至少必须满足以下透明度检查点：

- 开始前说明当前 task、已读取文档、本轮目标、预计触达文件、下一步动作。
- 调用 implementer 前，必须显式说明 implementer 的职责、允许动作、禁止动作。
- 调用 spec reviewer 前，必须显式说明当前 task 已完成实现，接下来检查是否符合 task 目标。
- 调用 code quality reviewer 前，必须显式说明当前 task 已通过 spec review，接下来检查质量与可维护性。
- task 完成后，必须汇报改动摘要、测试结果、两道 review 结果、残留问题。

```yaml
scenarios:
  - scenario_id: "contract-transparency-001"
    scenario_type: "transparency_gate"
    title: "每个 task 必须具备最小透明度动作"
    required_evidence:
      - "task_start_announcement"
      - "implementer_dispatch_visible"
      - "reviewer_dispatch_visible"
      - "task_completion_report"
    pass_condition: "minimum_transparency_complete"
    fail_block: true
```

## 7. reviewer 隔离契约

后续正式开发必须执行双重独立审查，不允许 implementer 自审自放行：

- implementer 必须是独立 fresh subagent。
- spec reviewer 必须是独立 fresh subagent，且不能复用 implementer 身份。
- code quality reviewer 必须是独立 fresh subagent，且不能复用 implementer 或 spec reviewer 身份。
- 任一 review 失败后，修复可以回到 implementer，但复审时必须重新使用 fresh reviewer。

```yaml
scenarios:
  - scenario_id: "contract-review-001"
    scenario_type: "review_isolation"
    title: "implementer 不得审核自己的实现"
    required_evidence:
      - "implementer_is_fresh_subagent"
      - "spec_reviewer_is_fresh_subagent"
      - "code_quality_reviewer_is_fresh_subagent"
      - "reviewer_identity_isolated=true"
    pass_condition: "independent_review_confirmed"
    fail_block: true
```

## 8. 高风险改动预览后写入契约

以下 task 视为高风险 task，写入前必须先给 Owner 预览范围与改动摘要，再获得确认：

- `T4`：统一内容写入能力，原因是同时触及文件系统、PocketBase 持久化与统一模型边界。
- `T5`：分享链接与 hash 路由解析，原因是直接影响对外访问安全边界。
- 任一会跨多个核心文件、改变主链路行为、或具有高回滚成本的额外改动。

高风险预览至少必须说明：

- 为什么属于高风险。
- 预计改动哪些文件。
- 将如何保持 `PocketBase` 固定底座和统一 `Content` 模型不漂移。
- 未获确认前不得正式写入。

## 9. 超出本轮范围的阻断契约

若后续实现出现以下方向，应视为超出本轮范围并立即阻断，不得以“顺手实现”名义放行：

- 以 `Appwrite`、`Supabase`、`Directus`、`Strapi` 或其他系统替代 `PocketBase`。
- 手工重写一套等价数据库 / 文件管理底座替代 `PocketBase`。
- 为文件与 HTML 分裂出两套独立主模型或两套长期持久化主线。
- 在前台页面中自行实现权限判断、分享校验、hash 解析或直连 PocketBase。
- 引入独立全文检索、对象存储、消息队列、多租户体系等超出 MVP 边界的重型能力。

阻断原则：只要上述任一项发生，即判定为架构漂移或范围漂移，必须停止当前实现并回到 Owner 重新确认。

## 10. 本阶段结论

- 四阶段准备链现已补齐为可放行状态。
- 后续正式开发应以 `20-architecture/tasks.md` 为执行源，从 `T1` 开始。
- 进入正式开发前，仍需按项目规则先进入 `using-git-worktrees`。
