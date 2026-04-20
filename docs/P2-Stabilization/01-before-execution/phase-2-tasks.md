---
doc_id: "phase_2_tasks"
phase: "architecture-and-tasking"
artifact: "tasks"
status: "draft"
derived_from:
  - "business_rules_memo"
  - "tech_selection"
  - "tasks"
  - "mvp_gap_reassessment"
updated_at: "2026-04-19"
---

# Phase 2 Tasks

## 1. 执行前提

`P2-T1` 已冻结以下口径：

- “外部用户”按公开访客解释。
- 文件原样下载一致性、真实文件类型交付验证、公开列表、公开搜索、公开详情闭环仍属于 MVP 收尾。

因此本文件中的 Phase 2 task 需要按两层理解：

1. 先完成仍属于 MVP 收尾的 `P2-MVP-*` 任务。
2. 再进入狭义 Phase 2 的稳定化与运维化任务。

若 `P2-MVP-*` 未完成，不得宣称“真正 MVP 已完成”，也不应提前滑入 Phase 3。

## 2. Task 列表总览

| Task | 目标 | 依赖 | 输出 | 串并行 | 风险 |
| --- | --- | --- | --- | --- | --- |
| P2-T1 | 固化 MVP 缺口边界与验收口径 | `mvp-gap-reassessment.md` | 明确哪些项仍属于 MVP 收尾 | 串行起点 | 否 |
| P2-MVP-1 | 补齐文件交付 MVP 缺口并完成正式验收 | P2-T1 | 文件原样交付验收结果与验证材料 | 可与 P2-MVP-2 并行 | 是 |
| P2-MVP-2 | 实现公开发现流闭环 | P2-T1 | 公开列表/搜索/详情闭环 | 可与 P2-MVP-1 并行 | 是 |
| P2-T2 | 增加启动前自检与错误提示 | P2-MVP-1 P2-MVP-2 | 脚本与文档自检能力 | 可与 P2-T5 部分并行 | 否 |
| P2-T5 | 提升运行日志与错误可诊断性 | P2-T2 | 分层错误输出与排障信息 | 依赖 P2-T2 | 否 |
| P2-T6 | 冷启动与空环境复现验证 | P2-MVP-1 P2-T2 | 冷启动验证记录 | 依赖前置串行 | 否 |
| P2-T7 | 更新运维与验收文档 | P2-MVP-1 P2-MVP-2 P2-T2 P2-T5 P2-T6 | Phase 2 收口文档 | 收尾串行 | 否 |

## 3. 逐项说明

### P2-T1 MVP 缺口口径冻结

目标：

- 把哪些能力仍属于 MVP 收尾明确下来，避免实现期反复争论。

输入依赖：

- `docs/P2-Stabilization/01-before-execution/mvp-gap-reassessment.md`
- `docs/P2-Stabilization/01-before-execution/phase-2-3-scope.md`

输出结果：

- [p2-t1-mvp-scope-freeze.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P2-Stabilization/01-before-execution/p2-t1-mvp-scope-freeze.md)
- 对“外部用户”是否等于公开访客的明确结论

说明：

- 如果这里不冻结，后续 P2-T3 与 P2-T4 都会边做边变。

### P2-MVP-1 补齐文件交付 MVP 缺口并完成正式验收

目标：

- 把“文件可下载”提升为“文件原样交付且可真实打开/使用”，并形成正式验收证据。

输入依赖：

- P2-T1
- 当前文件写入、文件公开访问实现
- [p2-t1-mvp-scope-freeze.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P2-Stabilization/01-before-execution/p2-t1-mvp-scope-freeze.md)

输出结果：

- 至少一组字节级一致性验证
- 至少一组真实文件类型上传后下载回读验证
- 正式验收记录文档

风险标记：高。

原因：

- 这项不再是增强验证，而是需求 1 是否成立的必要条件。

### P2-MVP-2 实现公开发现流闭环

目标：

- 实现面向公开访客的公开列表、公开搜索、公开详情最小闭环。

输入依赖：

- P2-T1
- 当前 owner 侧查询/网页能力
- [p2-t1-mvp-scope-freeze.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P2-Stabilization/01-before-execution/p2-t1-mvp-scope-freeze.md)

输出结果：

- 公开列表页
- 公开搜索页
- 从公开列表/搜索进入公开详情的闭环
- 仅暴露已公开内容的过滤规则与验证记录

风险标记：高。

原因：

- 这项不再允许停留在“澄清后可能不做”的状态，而是需求 3/4/5 是否成立的必要条件。

### P2-T2 启动前自检与启动脚本增强

目标：

- 让用户在启动 PocketBase 和业务壳之前能快速发现端口、配置、数据目录、集合状态问题。

输入依赖：

- P2-T1
- 当前 `scripts/` 与 `README.md`

输出结果：

- 自检脚本或增强后的启动脚本
- 可读的失败提示
- 更新后的启动手册

### P2-T5 运行错误与日志可诊断性提升

目标：

- 让 PocketBase 400/404/鉴权失败/文件读写失败具备足够可读的上下文。

输入依赖：

- P2-T2
- 当前错误处理实现

输出结果：

- 统一错误信息策略
- 排障时可直接使用的日志输出

### P2-T6 冷启动复现验证

目标：

- 从尽量接近空环境的状态出发，验证项目能被重复搭起并完成最小验收。

输入依赖：

- P2-MVP-1
- P2-T2

输出结果：

- 冷启动执行记录
- 发现问题与处理结论

### P2-T7 文档收口

目标：

- 把 Phase 2 新增的口径、命令、验证方式和已知限制全部沉淀到文档。

输入依赖：

- P2-MVP-1
- P2-MVP-2
- P2-T2
- P2-T5
- P2-T6

输出结果：

- 更新后的使用手册
- 更新后的验证文档
- Phase 2 完成记录

## 4. 串行 / 并行关系

建议顺序：

1. 先完成 P2-T1。
2. 然后并行推进 P2-MVP-1 与 P2-MVP-2。
3. 狭义 Phase 2 的 P2-T2 在 MVP 收尾缺口补齐后启动。
4. P2-T5 依赖 P2-T2。
5. P2-T6 依赖 P2-MVP-1 与 P2-T2 的结果。
6. P2-T7 最后收口。

## 5. 不允许进入实现期临时假设的说明

- 不允许假设“下载能打开就等于原样一致”。
- 不允许假设“外部用户”天然等于 owner 侧用户。
- 不允许假设 PocketBase 管理后台当前字段配置永远正确。
- 不允许假设手工验通过一次就能代表可重复部署。
- 不允许把 `P2-MVP-1` 与 `P2-MVP-2` 重新塞回 Phase 3。
