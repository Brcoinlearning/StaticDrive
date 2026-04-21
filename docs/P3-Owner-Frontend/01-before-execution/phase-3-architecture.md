---
doc_id: "phase_3_architecture"
phase: "architecture-and-tasking"
artifact: "architecture"
status: "draft"
derived_from:
  - "business_rules_memo"
  - "tech_selection"
  - "phase_2_architecture"
  - "phase_2_tasks"
updated_at: "2026-04-19"
---

# Phase 3 Architecture

## 1. 本轮架构目标

Phase 3 的目标是把已经稳定可运行的内容服务推进到“owner 侧可产品化使用”的状态，重点不再是底层能不能跑，而是 owner 侧内容管理体验、后续写路径能力和浏览器级回归测试体系。公开访客侧在 Phase 2 已完成 MVP 主链，Phase 3 只做与 owner 侧闭环直接相关的补强，不再扩大公开访客产品范围。

本轮的成立前提是：真正 MVP 收尾缺口已经补齐。Phase 3 不承接文件原样交付验证，也不承接公开列表 / 搜索 / 详情闭环的基础建设。

## 2. 本轮明确不采用的方向

- 不把 Phase 3 扩展成完整 CMS 平台。
- 不引入与当前规模不匹配的复杂前端微前端体系。
- 不在没有明确业务需求前建设多租户后台或复杂角色权限矩阵。

## 3. 结构边界

### 3.1 Owner Product Boundary

负责 owner 侧可直接使用的页面与交互。P3-T1 冻结后的最小范围包括：

- owner 内容列表页
- owner 搜索与筛选
- owner 内容详情页
- owner 创建后结果回看与再次操作入口
- 单条内容的分享、撤销分享、删除入口
- 明确的空态、错误态、加载态与操作反馈

本边界暂不包括：

- 完整后台工作台
- 多角色后台
- 富文本在线编辑器
- 批量操作默认主入口
- 独立 owner 登录体系

### 3.2 Content Lifecycle Boundary

负责内容创建后的持续管理，包括：

- 编辑/更新
- 重新分享
- 批量操作
- 状态切换

### 3.3 Access Management Boundary

负责更自然的 owner 身份识别与 API Key 管理，包括：

- API Key 展示与轮换
- 可能的登录态或 owner 识别方式优化
- 更细粒度的访问控制规则

### 3.4 Frontend Quality Boundary

负责用户真正面向浏览器使用时的体验质量，包括：

- 页面状态管理
- 错误态与空态
- 下载与跳转交互
- 响应式布局
- 提交后的明确成功/失败反馈
- 对文件内容与富文本内容的差异化展示

设计参考原则：

- 可借鉴本地 ShipSwift 组件库的交互模式与视觉层次，但不直接复用 SwiftUI 代码。
- 优先吸收页面级 loading overlay、结构化详情展示、清晰反馈组件等模式。
- 不为了“像后台”而牺牲 owner 高频任务的直达性。

### 3.5 Browser Verification Boundary

负责浏览器级回归，包括：

- 关键 owner 流程 E2E
- 关键公开访客流程 E2E
- 与命令行验证互补，而不是替代

## 4. 模块职责

### 4.1 Owner Web 模块

负责 owner 侧页面与交互，当前最小交付面应至少覆盖：列表、搜索、详情、分享/撤销分享、删除。

### 4.2 Content Mutation 模块

负责内容更新、删除、批量操作等写路径。

### 4.3 Access / Credential 模块

负责 owner 访问凭据与 API Key 生命周期。

### 4.4 Browser Test 模块

负责浏览器自动化用例与回归门禁。

## 5. 依赖方向

- Owner Web -> 业务 API -> PocketBase / 文件系统
- Browser Tests -> Owner Web / Public Web
- Access / Credential -> 业务 API -> PocketBase

禁止：

- 浏览器页面直接依赖 PocketBase admin 能力
- 为了前端方便而绕开业务层权限规则

## 6. 与现有骨架的衔接方式

Phase 3 不替换现有服务端骨架，而是在当前 API 与公开页面之上增加更完整的 owner 产品层。

owner 前端继续通过业务 API 访问服务端，不新增浏览器直连 PocketBase 的旁路。

ShipSwift 本地组件库只作为产品和交互参考源，不作为当前 Web 项目的直接依赖。

## 7. 风险点与控制策略

### 7.1 前端产品化范围膨胀

控制策略：

- 只围绕 owner 高频任务建设，不追求一次性做成大后台。
- P3-T2 默认只交付单内容操作闭环，不把批量能力强行塞进第一批页面。

### 7.2 写路径增多带来的回归面扩大

控制策略：

- 浏览器级 E2E 只覆盖高价值主链路，命令行回归继续保留。

### 7.3 API Key 与 owner 交互模型混乱

控制策略：

- 先定义 owner 访问模型，再决定 UI 形式，不允许边做边猜。
