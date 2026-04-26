# 核心业务链路图

本文档把当前项目最核心的业务实现整理成文本链路图，重点回答两个问题：

1. 请求进入系统后，核心业务是怎么流转的。
2. `PocketBase`、业务壳服务、本地文件系统、网页层分别承担什么职责。

适合在阅读源码前或阅读源码时对照使用。核心代码入口主要是：

- `src/app.js`
- `src/content/service.js`
- `src/pocketbase/client.js`
- `src/auth/api-key-auth.js`
- `src/auth/session-auth.js`

## 1. 总览图

```text
                 +----------------------+
                 |   书童四九 / 调用方   |
                 |  (带 API Key 调用)   |
                 +----------+-----------+
                            |
                            v
                 +----------------------+
                 |   业务壳服务 Node    |
                 |  路由/鉴权/业务规则   |
                 +----+------------+----+
                      |            |
          查用户/API Key映射       | 内容文件落盘/读取
                      |            |
                      v            v
         +------------------+   +----------------------+
         |   PocketBase     |   | workspace/content-   |
         | users_api        |   | files/               |
         | contents         |   | 真实文件存储         |
         | share_links      |   +----------------------+
         +------------------+
                      |
                      v
           +------------------------+
           | owner 页面 / public 页面 |
           | 由业务壳直接渲染 HTML    |
           +------------------------+
```

## 2. 文件写入链路

```text
调用方
  |
  | POST /api/write/file
  | Header: x-shutong49-api-key
  | Body: title, filename, mimeType, contentBase64
  v
业务壳 app.js
  |
  | 1) 路由命中 write 组
  | 2) 调用 apiKeyAuth
  v
PocketBase.users_api
  |
  | 按 api_key 查 owner
  v
业务壳 contentService.createFileContent()
  |
  | 3) 校验 base64
  | 4) 清洗文件名
  | 5) 生成 content_hash
  | 6) 计算 storage_path
  v
本地文件系统 workspace/content-files/
  |
  | 7) 先把真实文件写入磁盘
  v
业务壳 contentService.createFileContent()
  |
  | 8) 写 contents 记录:
  |    - owner_user_id
  |    - type=file
  |    - title
  |    - original_filename
  |    - content_hash
  |    - storage_path
  |    - mime_type
  |    - file_size
  |    - is_shared=false
  v
PocketBase.contents
  |
  | 9) 返回 contentId
  v
业务壳
  |
  | 10) 返回:
  |     contentId
  |     contentHash
  |     accessUrl
  v
调用方
```

失败补偿规则：

```text
如果“文件已写入磁盘”之后，“写 PocketBase 失败”：
  -> 删除刚写入的物理文件
  -> 返回错误
```

这条链路对应的核心实现位于 `src/content/service.js` 的 `createFileContent()`。

## 3. HTML 富文本写入链路

```text
调用方
  |
  | POST /api/write/html
  | Header: x-shutong49-api-key
  | Body: title, htmlContent
  v
业务壳 app.js
  |
  | 1) 鉴权，找到 owner
  v
PocketBase.users_api
  |
  | 按 api_key 查用户
  v
业务壳 contentService.createHtmlContent()
  |
  | 2) 校验 title/htmlContent
  | 3) 生成 content_hash
  | 4) 组装统一 Content 模型
  v
PocketBase.contents
  |
  | 写记录:
  | - owner_user_id
  | - type=rich_text
  | - title
  | - content_hash
  | - html_content
  | - mime_type=text/html
  | - is_shared=false
  v
业务壳
  |
  | 返回 contentId/contentHash/accessUrl
  v
调用方
```

与文件写入相比，最大差异只有一点：

```text
文件 -> 内容本体落在磁盘
HTML -> 内容本体直接落在 contents.html_content
```

但系统对外仍然把它们视为统一 `Content`。

## 4. Owner 查询与管理链路

```text
Owner 浏览器
  |
  | GET /web/auth/login
  v
业务壳
  |
  | 展示登录页
  v
Owner 浏览器
  |
  | POST /web/auth/login
  | 提交 API Key
  v
业务壳
  |
  | 1) 仍然用 API Key 去查 users_api
  | 2) 成功后创建 session
  | 3) set-cookie
  v
Owner 浏览器（后续带 cookie）
  |
  | GET /web/list
  | GET /web/search?q=...
  | GET /web/detail/:contentId
  v
业务壳 app.js
  |
  | 1) 优先用 sessionAuth 识别 owner
  | 2) 无 session 时才回退到 API Key
  v
业务壳 contentService
  |
  | list/search:
  |   按 owner_user_id 过滤
  |
  | detail:
  |   先按 contentId 取记录
  |   再检查 owner_user_id 是否匹配
  v
PocketBase.contents
  |
  | 返回 owner 范围内的数据
  v
业务壳 page-renderer
  |
  | 渲染 owner 列表页/搜索页/详情页
  v
Owner 浏览器
```

关键约束：

```text
owner 只能看到自己的内容
不是页面层“隐藏了别人的数据”
而是业务层根本不返回别人的数据
```

## 5. 分享创建与公开访问链路

### 5.1 创建分享

```text
Owner
  |
  | POST /web/action/share/:contentId
  | 或 POST /api/write/share
  v
业务壳 contentService.createShareLink()
  |
  | 1) 校验该 contentId 是否属于当前 owner
  | 2) 查是否已有未撤销 share_link
  |
  | 如果已有:
  |   复用 share_hash
  |   确保 contents.is_shared = true
  |
  | 如果没有:
  |   生成新的 share_hash
  |   写入 share_links
  |   更新 contents.is_shared = true
  v
PocketBase.share_links / contents
  |
  | 返回 shareUrl / accessUrl
  v
Owner
```

### 5.2 公开访问

```text
公开访客
  |
  | 方式 A: GET /api/public/content/:contentHash
  | 方式 B: GET /api/public/share/:shareHash
  v
业务壳 app.js
  |
  | 命中 public 组
  v
业务壳 contentService
  |
  | A 路径:
  |   1) 按 content_hash 查 contents
  |   2) 判断 is_shared 是否为 true
  |
  | B 路径:
  |   1) 按 share_hash 查 share_links
  |   2) 判断 is_revoked 是否为 false
  |   3) 再按 content_id 查 contents
  v
PocketBase.contents / share_links
  |
  | 找到内容记录
  v
业务壳 contentService
  |
  | 如果 type=rich_text
  |   -> 返回 HTML payload
  |
  | 如果 type=file
  |   -> 读取本地物理文件
  |   -> 组装下载信息
  v
本地文件系统（仅 file 类型）
  |
  | 读取真实字节
  v
业务壳 app.js
  |
  | rich_text -> 返回 JSON / 页面渲染
  | file      -> 返回真实二进制下载响应
  v
公开访客
```

这里有两个不同的业务状态：

```text
contents.is_shared
  表示“该内容是否处于公开状态”

share_links.is_revoked
  表示“某条分享链接是否已经失效”
```

## 6. 删除与撤销分享链路

### 6.1 撤销分享

```text
Owner
  |
  | POST /web/action/share-revoke/:contentId
  | 或 POST /api/write/share/revoke
  v
业务壳 contentService.revokeShareLink()
  |
  | 1) 校验 owner 权限
  | 2) 找 active share_link
  | 3) share_links.is_revoked = true
  | 4) contents.is_shared = false
  v
PocketBase
  |
  | 状态更新完成
  v
Owner / 公开访客
  |
  | 之后访问 share URL -> 410 Gone
```

### 6.2 删除内容

```text
Owner
  |
  | POST /web/action/delete/:contentId
  | 或 POST /api/write/delete
  v
业务壳 contentService.deleteContent()
  |
  | 1) 校验 owner 权限
  | 2) 找出该内容所有 share_links
  | 3) 先把未撤销分享都标记为 revoked
  | 4) 如果是文件，删除磁盘文件
  | 5) 删除 contents 记录
  v
PocketBase + 本地文件系统
  |
  | 元数据和物理文件都移除
  v
后续结果
  |
  | owner 列表中消失
  | public 入口失效
  | 文件本体不存在
```

## 7. 压缩版业务时序总图

```text
[写入]
调用方
  -> API Key 鉴权
  -> owner 身份映射
  -> 统一 Content 模型
  -> 文件落盘/HTML入库
  -> contents 记录创建
  -> 返回 contentId/contentHash

[管理]
owner
  -> session 或 API Key 鉴权
  -> 按 owner_user_id 查询
  -> 列表/搜索/详情
  -> 分享/撤销/删除

[分享]
owner
  -> createShareLink
  -> share_links 写入
  -> contents.is_shared=true
  -> 获得 shareHash/shareUrl

[公开访问]
访客
  -> 用 contentHash 或 shareHash 访问
  -> 校验 is_shared / is_revoked
  -> rich_text 返回渲染内容
  -> file 返回真实下载字节流
```

## 8. 建议的阅读顺序

如果要对照源码继续深入，建议按这个顺序阅读：

1. `src/app.js`
2. `src/auth/api-key-auth.js`
3. `src/auth/session-auth.js`
4. `src/content/service.js`
5. `src/pocketbase/client.js`
6. `src/web/page-renderer.js`

这样能先看清 HTTP 入口和职责分发，再下钻到具体业务规则。
