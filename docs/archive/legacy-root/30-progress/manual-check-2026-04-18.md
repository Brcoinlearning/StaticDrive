# 人工联调记录 2026-04-18

## 1. 联调环境

- worktree: `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/.worktrees/t1-pocketbase-base`
- PocketBase: `http://127.0.0.1:8090`
- 业务壳服务: `http://127.0.0.1:8787`
- 管理员邮箱: `249328598@qq.com`
- owner 测试用户: `T1 Verify User`
- owner API Key: `t1_verify_api_key_0001`

## 2. 前置修正

人工联调前发现真实 PocketBase 集合配置与业务壳默认写入约定存在偏差：

- `contents.is_shared.required=true`
- `share_links.is_revoked.required=true`

这会导致布尔字段写入 `false` 时，PocketBase 返回 `400 validation_required`。

联调过程中已将上述字段修正为非 required，之后写入主链路恢复正常。

## 3. 实际联调结果

### 3.1 HTML 写入成功

请求：`POST /api/write/html`

结果：

- `contentId`: `gwmezfps8rlen21`
- `contentHash`: `784ef7e373f13d11d699f12b6eddfdaf`

### 3.2 文件写入成功

请求：`POST /api/write/file`

结果：

- `contentId`: `wy8ert3x0y0blpx`
- `contentHash`: `0c7714a79aad79008c8e0d97b03a7ccb`

### 3.3 owner 列表查询成功

请求：`GET /api/query/list`

结果：

- 能返回本次新建的 HTML 与文件内容
- owner-scoped 过滤正常

### 3.4 分享创建成功

对新建内容创建分享后，public 页面可正常访问。

验证结论：

- HTML public 页面可访问
- 文件 public 页面可访问
- 已存在 shared 内容也可访问

### 3.5 撤销分享成功

请求：`POST /api/write/share/revoke`

文件内容撤销结果：

- `contentId`: `wy8ert3x0y0blpx`
- `shareId`: `zm1kxftm5hqnwjt`
- `shareHash`: `01cb4b94bbb04dda709cc87028039e04`
- `revoked`: `true`

人工复核结论：撤销分享后访问控制行为正常，没有异常放行。

### 3.6 删除内容成功

请求：`POST /api/write/delete`

文件内容删除结果：

- `contentId`: `wy8ert3x0y0blpx`
- `deleted`: `true`
- `revokedShareCount`: `1`
- `removedFile`: `true`

结论：删除接口已完成内容记录删除、关联分享处理和物理文件清理。

## 4. 本次人工联调覆盖范围

本次实际人工验证已覆盖：

- HTML 写入
- 文件写入
- owner 列表查询
- 分享创建
- public 访问
- 撤销分享
- 删除内容

## 5. 结论

- 当前 MVP 主链路已通过一轮真实人工联调。
- 自动化测试与人工联调结果一致。
- 后续整理分支前，应保留本记录作为真实环境验证证据。
