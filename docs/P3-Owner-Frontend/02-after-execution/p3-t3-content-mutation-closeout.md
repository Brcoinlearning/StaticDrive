# P3-T3 Closeout

## 1. 本轮完成内容

P3-T3 聚焦补齐 owner 侧扩展写路径，在不引入新身份模型的前提下完成两类能力：

- 内容更新
- 批量操作

具体交付：

- 新增 `/api/write/update`：支持 owner 更新标题，rich text 额外支持更新 `htmlContent`。
- 新增 `/api/write/batch`：支持 `share`、`share_revoke`、`delete` 三类批量动作。
- 新增 `/web/action/update` 与 `/web/action/batch`：补 owner 页面写操作闭环。
- owner 列表 / 搜索页新增批量操作面板。
- owner 详情页新增内容更新面板。
- 所有新写路径复用现有 owner 权限约束，不新增浏览器直连 PocketBase 旁路。

## 2. 边界控制

本轮明确未做：

- 文件二进制替换上传
- owner 登录体系
- API Key 管理 UI
- 浏览器自动化 E2E

因此 P3-T3 仍然处于 P3 owner 产品化范围内，没有提前侵入 P3-T4 或 P3-T5。

## 3. 风险与处理

### 3.1 更新能力风险

- rich text 更新只允许写 `title` 和 `htmlContent`
- file 内容只允许更新标题，不允许伪装成 HTML 更新
- content hash 与公开访问地址保持不变，避免对外地址震荡

### 3.2 批量操作风险

- 批量能力复用单条写路径，避免新造一套权限逻辑
- 对 `contentIds` 先做去重和非空校验
- 只支持三类明确动作：`share`、`share_revoke`、`delete`

## 4. 验证结果

执行命令：

```bash
node --test
```

结果：

- 58/58 通过

新增覆盖点：

- owner 详情页更新面板渲染
- owner 批量操作重定向反馈
- rich text 更新 API
- file 非法 HTML 更新拦截
- 批量分享 API
- health 路由元数据扩展

## 5. 后续建议

P3 下一步更适合进入：

- P3-T4 owner 凭据管理
- P3-T5 浏览器级关键 E2E

原因：P3-T3 已经把 owner 高频写路径补到可人工使用的程度，下一轮的主要缺口不再是功能面，而是 owner 访问方式与浏览器回归门禁。
