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

Phase 3 的目标是把已经稳定可运行的内容服务推进到“更完整产品化”的状态，重点不再是底层能不能跑，而是 owner 与公开访客两侧的使用体验、内容维护能力和回归测试体系。

本轮的成立前提是：真正 MVP 收尾缺口已经补齐。Phase 3 不承接文件原样交付验证，也不承接公开列表 / 搜索 / 详情闭环的基础建设。

## 2. 本轮明确不采用的方向

- 不把 Phase 3 扩展成完整 CMS 平台。
- 不引入与当前规模不匹配的复杂前端微前端体系。
- 不在没有明确业务需求前建设多租户后台或复杂角色权限矩阵。

## 3. 结构边界

### 3.1 Owner Product Boundary

负责 owner 侧可直接使用的页面与交互，包括：

- 内容列表
- 搜索
- 详情
- 创建结果反馈
- 更新与删除操作入口

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

### 3.5 Browser Verification Boundary

负责浏览器级回归，包括：

- 关键 owner 流程 E2E
- 关键公开访客流程 E2E
- 与命令行验证互补，而不是替代

## 4. 模块职责

### 4.1 Owner Web 模块

负责 owner 侧页面与交互。

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

Phase 3 不替换现有服务端骨架，而是在当前 API 与公开页面之上增加更完整的产品层。

## 7. 风险点与控制策略

### 7.1 前端产品化范围膨胀

控制策略：

- 只围绕 owner 高频任务建设，不追求一次性做成大后台。

### 7.2 写路径增多带来的回归面扩大

控制策略：

- 浏览器级 E2E 只覆盖高价值主链路，命令行回归继续保留。

### 7.3 API Key 与 owner 交互模型混乱

控制策略：

- 先定义 owner 访问模型，再决定 UI 形式，不允许边做边猜。
