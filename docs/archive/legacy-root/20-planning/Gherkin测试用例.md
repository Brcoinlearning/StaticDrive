# Gherkin测试用例 - 文件管理服务

## 测试契约概述

本文档定义了文件管理服务的验收测试用例，使用Gherkin语法（Given-When-Then）描述系统行为。

这些测试用例作为开发契约，确保实现符合《业务规则备忘录》中的需求。

---

## Feature 1: 文件上传与存储

### 背景（Background）
```gherkin
Background:
  Given 系统已初始化
  And 数据库已连接
  And 工作目录已创建
  And 存在用户 "user1" 拥有API Key "key123"
```

### 场景 1.1：成功上传文件
```gherkin
Scenario: 用户成功上传文件
  Given 用户 "user1" 使用API Key "key123" 认证
  And 准备上传文件 "report.pdf"，大小为 1024 字节
  When 用户通过API上传文件
  Then 系统返回HTTP 201状态码
  And 系统返回内容ID
  And 系统返回内容的hash标识
  And 文件保存在工作目录的 "user1" 子目录下
  And 文件使用原始文件名 "report.pdf" 保存
  And 数据库记录包含：
    | user_id | type | title | content_hash | file_size |
    | user1 | file | report.pdf | <hash> | 1024 |
  And 访问URL格式为 "/files/{hash}.pdf"
```

### 场景 1.2：上传文件时API Key无效
```gherkin
Scenario: 使用无效API Key上传文件
  Given 用户使用无效的API Key "invalid_key"
  And 准备上传文件 "test.txt"
  When 用户通过API上传文件
  Then 系统返回HTTP 401状态码
  And 系统返回错误信息 "Invalid API Key"
  And 文件未被保存
  And 数据库无新记录
```

### 场景 1.3：上传文件时工作目录不存在
```gherkin
Scenario: 工作目录不存在时上传文件
  Given 工作目录已被删除
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户通过API上传文件
  Then 系统返回HTTP 500状态码
  And 系统返回错误信息包含 "Failed to save file"
  And 数据库无新记录
```

### 场景 1.4：上传文件后数据库失败回滚
```gherkin
Scenario: 数据库保存失败时回滚文件存储
  Given 数据库连接已断开
  And 用户 "user1" 使用API Key "key123" 认证
  And 准备上传文件 "test.txt"
  When 用户通过API上传文件
  Then 系统返回HTTP 500状态码
  And 文件已从工作目录删除
  And 数据库无新记录
```

---

## Feature 2: 富文本保存与查看

### 场景 2.1：成功保存富文本
```gherkin
Scenario: 用户成功保存富文本内容
  Given 用户 "user1" 使用API Key "key123" 认证
  And 准备富文本内容：
    | title | content |
    | 周报 | <h1>本周工作总结</h1><p>完成了...</p> |
  When 用户通过API保存富文本
  Then 系统返回HTTP 201状态码
  And 系统返回内容ID
  And 系统返回内容的hash标识
  And 数据库记录包含：
    | user_id | type | title | rich_text_content |
    | user1 | rich_text | 周报 | <h1>本周工作总结</h1><p>完成了...</p> |
```

### 场景 2.2：查看富文本内容
```gherkin
Scenario: 用户查看富文本内容详情
  Given 存在富文本内容 "content1"，标题为 "周报"
  And 内容属于用户 "user1"
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户请求内容详情
  Then 系统返回HTTP 200状态码
  And 系统返回内容详情：
    | content_id | type | title | content |
    | content1 | rich_text | 周报 | <h1>本周工作总结</h1>... |
  And 富文本内容可以HTML渲染
```

### 场景 2.3：富文本内容可以被搜索
```gherkin
Scenario: 用户搜索富文本标题
  Given 存在富文本内容，标题为 "周报"
  And 内容属于用户 "user1"
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户搜索关键词 "周报"
  Then 系统返回HTTP 200状态码
  And 搜索结果包含该内容
  And 标题中的 "周报" 关键词被高亮显示
```

---

## Feature 3: 内容列表展示

### 场景 3.1：获取自己的内容列表
```gherkin
Scenario: 用户获取自己的内容列表
  Given 用户 "user1" 存在 3 个内容：
    | title | type |
    | report.pdf | file |
    | 周报 | rich_text |
    | notes.txt | file |
  And 用户 "user2" 存在 2 个内容
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户请求内容列表
  Then 系统返回HTTP 200状态码
  And 返回结果仅包含 "user1" 的 3 个内容
  And 结果不包含 "user2" 的内容
  And 每个内容包含：
    | content_id | title | type | created_at | file_size |
```

### 场景 3.2：内容列表分页
```gherkin
Scenario: 内容列表支持分页
  Given 用户 "user1" 存在 25 个内容
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户请求第 1 页，每页 10 条
  Then 系统返回HTTP 200状态码
  And 返回 10 个内容
  And 系统返回分页信息：
    | page | page_size | total | has_more |
    | 1 | 10 | 25 | true |
```

### 场景 3.3：内容列表排序
```gherkin
Scenario: 按创建时间降序排序
  Given 用户 "user1" 存在 3 个内容，创建时间分别为：
    | title | created_at |
    | 早期内容 | 2024-01-01 |
    | 中期内容 | 2024-02-01 |
    | 最新内容 | 2024-03-01 |
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户请求内容列表，按创建时间降序排序
  Then 系统返回HTTP 200状态码
  And 内容顺序为：
    | 1 | 2 | 3 |
    | 最新内容 | 中期内容 | 早期内容 |
```

### 场景 3.4：用户查看别人的内容列表被拒绝
```gherkin
Scenario: 用户尝试查看别人的内容列表
  Given 用户 "user1" 存在内容
  And 用户 "user2" 使用API Key "key456" 认证
  When 用户 "user2" 请求 "user1" 的内容列表
  Then 系统返回HTTP 403状态码
  And 系统返回错误信息 "Access denied"
```

---

## Feature 4: 内容搜索

### 场景 4.1：按文件名搜索
```gherkin
Scenario: 用户按文件名搜索内容
  Given 用户 "user1" 存在以下内容：
    | title | type |
    | 项目报告.pdf | file |
    | 会议纪要.txt | file |
    | 周报 | rich_text |
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户搜索关键词 "报告"
  Then 系统返回HTTP 200状态码
  And 搜索结果包含 "项目报告.pdf"
  And 搜索结果不包含 "会议纪要.txt"
  And 搜索结果不包含 "周报"
  And 关键词 "报告" 被高亮显示
```

### 场景 4.2：搜索无结果
```gherkin
Scenario: 搜索关键词无匹配结果
  Given 用户 "user1" 存在内容，标题为 "周报"
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户搜索关键词 "不存在的内容"
  Then 系统返回HTTP 200状态码
  And 搜索结果为空
  And 系统返回提示信息 "未找到匹配的内容"
```

### 场景 4.3：搜索结果分页
```gherkin
Scenario: 搜索结果支持分页
  Given 用户 "user1" 存在 15 个标题包含 "报告" 的内容
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户搜索关键词 "报告"，第 1 页，每页 10 条
  Then 系统返回HTTP 200状态码
  And 返回 10 个匹配结果
  And 系统返回搜索结果总数为 15
```

---

## Feature 5: 内容详情查看

### 场景 5.1：查看文件类型内容详情
```gherkin
Scenario: 用户查看文件类型内容详情
  Given 存在文件内容 "content1"，文件名为 "report.pdf"
  And 文件大小为 2048 字节
  And 内容属于用户 "user1"
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户请求内容详情
  Then 系统返回HTTP 200状态码
  And 系统返回内容信息：
    | content_id | title | file_size | download_url |
    | content1 | report.pdf | 2048 | /files/{hash}.pdf |
```

### 场景 5.2：查看别人的内容被拒绝
```gherkin
Scenario: 用户尝试查看别人的内容
  Given 存在内容属于用户 "user1"
  And 用户 "user2" 使用API Key "key456" 认证
  When 用户 "user2" 请求该内容详情
  Then 系统返回HTTP 403状态码
  And 系统返回错误信息 "You don't have permission to access this content"
```

### 场景 5.3：查看不存在的内容
```gherkin
Scenario: 用户请求不存在的内容
  Given 用户 "user1" 使用API Key "key123" 认证
  When 用户请求不存在的content_id "nonexistent"
  Then 系统返回HTTP 404状态码
  And 系统返回错误信息 "Content not found"
```

### 场景 5.4：通过hash URL访问文件
```gherkin
Scenario: 通过hash URL访问文件
  Given 存在文件内容，hash为 "a7f8c9b2d3e4f5"
  And 文件路径为 "/work/user1/report.pdf"
  When 匿名用户通过URL "/files/a7f8c9b2d3e4f5.pdf" 访问
  Then 系统返回HTTP 200状态码
  And 系统返回文件内容
  And 文件名显示为原始文件名 "report.pdf"
```

### 场景 5.5：通过错误的hash访问文件
```gherkin
Scenario: 通过错误的hash访问文件
  When 匿名用户通过URL "/files/wronghash.pdf" 访问
  Then 系统返回HTTP 404状态码
  And 系统返回错误信息 "Content not found"
```

---

## Feature 6: 内容管理（CRUD）

### 场景 6.1：删除自己的内容
```gherkin
Scenario: 用户删除自己的内容
  Given 存在内容 "content1" 属于用户 "user1"
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户删除该内容
  Then 系统返回HTTP 200状态码
  And 数据库中该内容被标记为删除
  And 文件从工作目录删除
```

### 场景 6.2：删除别人的内容被拒绝
```gherkin
Scenario: 用户尝试删除别人的内容
  Given 存在内容 "content1" 属于用户 "user1"
  And 用户 "user2" 使用API Key "key456" 认证
  When 用户 "user2" 删除内容 "content1"
  Then 系统返回HTTP 403状态码
  And 系统返回错误信息 "You don't have permission to delete this content"
  And 内容仍然存在
```

### 场景 6.3：更新内容元数据
```gherkin
Scenario: 用户更新内容标题
  Given 存在内容 "content1"，标题为 "旧标题"
  And 内容属于用户 "user1"
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户更新内容标题为 "新标题"
  Then 系统返回HTTP 200状态码
  And 内容标题更新为 "新标题"
  And 内容的updated_at时间被更新
```

---

## Feature 7: 分享链接生成

### 场景 7.1：创建永久分享链接
```gherkin
Scenario: 用户创建永久有效的分享链接
  Given 存在内容 "content1" 属于用户 "user1"
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户创建分享链接，设置为永久有效
  Then 系统返回HTTP 201状态码
  And 系统返回分享链接ID
  And 系统返回分享URL "/share/{share_hash}"
  And 分享链接的is_one_time为false
  And 分享链接未被撤销
```

### 场景 7.2：创建一次性分享链接
```gherkin
Scenario: 用户创建一次性分享链接
  Given 存在内容 "content1" 属于用户 "user1"
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户创建一次性分享链接
  Then 系统返回HTTP 201状态码
  And 分享链接的is_one_time为true
```

### 场景 7.3：通过分享链接访问内容
```gherkin
Scenario: 外部用户通过分享链接访问内容
  Given 存在有效的分享链接，hash为 "share123"
  And 分享链接指向内容 "content1"
  And 内容标题为 "共享文档.pdf"
  When 匿名用户通过URL "/share/share123" 访问
  Then 系统返回HTTP 200状态码
  And 系统返回内容详情
  And 分享链接的访问次数增加1
```

### 场景 7.4：一次性分享链接访问后失效
```gherkin
Scenario: 一次性分享链接访问后失效
  Given 存在一次性分享链接，hash为 "share123"
  And 分享链接指向内容 "content1"
  When 匿名用户第一次通过URL "/share/share123" 访问
  Then 系统返回HTTP 200状态码
  And 分享链接被标记为已撤销
  When 匿名用户第二次通过URL "/share/share123" 访问
  Then 系统返回HTTP 404状态码
  And 系统返回错误信息 "Share link has been revoked"
```

### 场景 7.5：访问已撤销的分享链接
```gherkin
Scenario: 访问已撤销的分享链接
  Given 存在分享链接，hash为 "share123"
  And 分享链接已被撤销
  When 匿名用户通过URL "/share/share123" 访问
  Then 系统返回HTTP 404状态码
  And 系统返回错误信息 "Share link has been revoked"
```

### 场景 7.6：撤销分享链接
```gherkin
Scenario: 用户撤销分享链接
  Given 存在分享链接 "share1" 属于用户 "user1"
  And 分享链接未被撤销
  And 用户 "user1" 使用API Key "key123" 认证
  When 用户撤销该分享链接
  Then 系统返回HTTP 200状态码
  And 分享链接被标记为已撤销
  When 匿名用户尝试访问该分享链接
  Then 系统返回HTTP 404状态码
```

### 场景 7.7：为别人的内容创建分享链接被拒绝
```gherkin
Scenario: 用户尝试为别人的内容创建分享链接
  Given 存在内容 "content1" 属于用户 "user1"
  And 用户 "user2" 使用API Key "key456" 认证
  When 用户 "user2" 为内容 "content1" 创建分享链接
  Then 系统返回HTTP 403状态码
  And 系统返回错误信息 "You don't have permission to share this content"
```

---

## Feature 8: API Key认证

### 场景 8.1：使用有效的API Key访问API
```gherkin
Scenario: 使用有效API Key访问受保护API
  Given 用户 "user1" 拥有有效的API Key "key123"
  When 用户使用Header "X-API-Key: key123" 访问API
  Then 系统返回HTTP 200状态码
  And 系统识别用户为 "user1"
```

### 场景 8.2：使用无效的API Key访问API
```gherkin
Scenario: 使用无效API Key访问受保护API
  Given 不存在API Key "invalid_key"
  When 用户使用Header "X-API-Key: invalid_key" 访问API
  Then 系统返回HTTP 401状态码
  And 系统返回错误信息 "Invalid API Key"
```

### 场景 8.3：未提供API Key访问受保护API
```gherkin
Scenario: 未提供API Key访问受保护API
  When 用户不提供API Key访问受保护API
  Then 系统返回HTTP 401状态码
  And 系统返回错误信息 "API Key is required"
```

### 场景 8.4：通过查询参数传递API Key
```gherkin
Scenario: 通过查询参数传递API Key（兼容方式）
  Given 用户 "user1" 拥有有效的API Key "key123"
  When 用户使用URL "?api_key=key123" 访问API
  Then 系统返回HTTP 200状态码
  And 系统识别用户为 "user1"
```

---

## Feature 9: URL Hash处理

### 场景 9.1：文件URL使用hash而非文件名
```gherkin
Scenario: 上传文件后返回的URL使用hash
  Given 用户上传文件 "report_01.pdf"
  When 文件上传成功
  Then 返回的访问URL格式为 "/files/{hash}.pdf"
  And URL不包含原始文件名 "report_01"
  And 本地文件仍使用原始文件名保存
```

### 场景 9.2：hash保证唯一性
```gherkin
Scenario: 相同内容生成不同的hash
  Given 用户 "user1" 上传文件 "test.pdf"
  And 用户 "user2" 上传同名文件 "test.pdf"
  Then 两个文件的访问URL不同
  And 两个hash值不同
```

### 场景 9.3：hash URL防止越权访问
```gherkin
Scenario: 无法通过猜测文件名访问内容
  Given 存在文件 "confidential.pdf"，hash为 "abc123"
  And 用户知道文件名为 "confidential.pdf"
  When 用户尝试访问URL "/files/confidential.pdf"
  Then 系统返回HTTP 404状态码
  当 用户访问正确的hash URL "/files/abc123.pdf"
  Then 系统返回HTTP 200状态码
```

---

## Feature 10: 错误处理

### 场景 10.1：数据库连接失败
```gherkin
Scenario: 数据库连接失败时返回友好错误
  Given 数据库连接已断开
  When 用户访问需要数据库的API
  Then 系统返回HTTP 500状态码
  And 系统返回错误信息 "Service temporarily unavailable"
  And 错误信息不暴露数据库细节
```

### 场景 10.2：请求体格式错误
```gherkin
Scenario: 请求体JSON格式错误
  Given 用户发送格式错误的JSON请求体
  When 系统处理请求
  Then 系统返回HTTP 400状态码
  And 系统返回错误信息 "Invalid JSON format"
```

### 场景 10.3：缺少必需参数
```gherkin
Scenario: API请求缺少必需参数
  Given 用户调用上传文件API但未提供文件
  When 系统处理请求
  Then 系统返回HTTP 400状态码
  And 系统返回错误信息 "Missing required parameter: file"
```

---

## 非功能需求测试

### 性能测试

### 场景 NFR.1：文件上传响应时间
```gherkin
Scenario: 小文件上传应在合理时间内完成
  Given 用户上传 10MB 的文件
  When 系统处理上传
  Then 上传在 5 秒内完成
```

### 场景 NFR.2：搜索响应时间
```gherkin
Scenario: 搜索应在合理时间内返回结果
  Given 用户数据库中有 1000 条内容
  When 用户执行搜索
  Then 搜索结果在 1 秒内返回
```

### 安全测试

### 场景 NFR.3：防止SQL注入
```gherkin
Scenario: 搜索输入包含SQL注入尝试
  Given 用户搜索关键词 "'; DROP TABLE contents; --"
  When 系统处理搜索
  Then 系统返回HTTP 200状态码
  And 数据库表contents仍然存在
  And 搜索结果为空
```

### 场景 NFR.4：防止路径遍历攻击
```gherkin
Scenario: 文件名包含路径遍历尝试
  Given 用户尝试上传文件名为 "../../etc/passwd"
  When 系统处理上传
  Then 系统返回HTTP 400状态码
  And 系统返回错误信息 "Invalid filename"
  And 系统未访问工作目录外的文件
```

---

## 测试数据示例

### 用户数据
```gherkin
Given 系统存在以下用户：
  | user_id | api_key | username |
  | user1 | key123 | Alice |
  | user2 | key456 | Bob |
  | user3 | key789 | Charlie |
```

### 内容数据
```gherkin
Given 用户 "user1" 存在以下内容：
  | content_id | type | title | file_size | created_at |
  | cont1 | file | report.pdf | 1024 | 2024-01-15 |
  | cont2 | rich_text | 周报 | 0 | 2024-01-16 |
  | cont3 | file | data.csv | 5120 | 2024-01-17 |
```

---

## 测试执行顺序建议

### 第一批：核心功能（必须通过）
1. Feature 8: API Key认证
2. Feature 1: 文件上传与存储
3. Feature 2: 富文本保存与查看
4. Feature 7: 分享链接生成

### 第二批：列表和搜索
5. Feature 3: 内容列表展示
6. Feature 4: 内容搜索

### 第三批：CRUD和错误处理
7. Feature 5: 内容详情查看
8. Feature 6: 内容管理
9. Feature 10: 错误处理

### 第四批：安全和性能
10. Feature 9: URL Hash处理
11. NFR: 性能测试
12. NFR: 安全测试

---

## 验收标准

### MVP必须通过的测试
- [ ] 所有API Key认证场景
- [ ] 文件上传和富文本保存
- [ ] 内容列表和搜索
- [ ] 分享链接创建和访问
- [ ] URL hash正确处理
- [ ] 基本错误处理

### 测试覆盖率目标
- [ ] 用例层测试覆盖率 ≥ 90%
- [ ] 适配器层测试覆盖率 ≥ 80%
- [ ] API端点集成测试 100%
- [ ] 关键业务流程端到端测试 ≥ 80%

---

## 备注

1. **测试隔离**: 每个场景应在干净的测试环境中执行
2. **测试数据**: 使用工厂模式生成测试数据
3. **异步测试**: 所有异步操作应正确等待完成
4. **清理**: 每个测试后应清理测试数据
5. **Mock**: 仅外部依赖使用Mock，内部组件使用真实实现
