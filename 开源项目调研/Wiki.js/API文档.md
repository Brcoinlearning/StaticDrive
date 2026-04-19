# Wiki.js API 文档

## 概述

Wiki.js 提供了完整的 REST API，用于与系统进行编程交互。API 基于 HTTP 标准方法，支持 JSON 格式的请求和响应。

## 认证机制

### Token-based 认证
Wiki.js 使用基于令牌的认证机制：
- **API Keys**: 生成的 API 密钥用于服务端身份验证
- **JWT Tokens**: 用于用户会话管理
- **Bearer Token**: 在请求头中包含认证令牌

```http
Authorization: Bearer <your-api-token>
```

### 认证流程
1. 用户登录验证
2. 系统生成认证令牌
3. 客户端在后续请求中使用令牌
4. 服务器验证令牌有效性并处理请求

## 核心 API 端点

### 页面管理
#### 获取页面列表
```http
GET /api/pages
```

#### 获取单个页面
```http
GET /api/pages/{id}
```

#### 创建页面
```http
POST /api/pages
Content-Type: application/json

{
  "path": "my-page",
  "title": "My Page Title",
  "content": "Page content here...",
  "locale": "en"
}
```

#### 更新页面
```http
PUT /api/pages/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

#### 删除页面
```http
DELETE /api/pages/{id}
```

### 资产管理
#### 上传资产
```http
POST /api/assets/upload
Content-Type: multipart/form-data

file: <binary data>
folder: <optional folder path>
```

#### 获取资产列表
```http
GET /api/assets
```

#### 删除资产
```http
DELETE /api/assets/{id}
```

### 用户管理
#### 获取用户列表
```http
GET /api/users
```

#### 创建用户
```http
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

### 搜索
#### 全文搜索
```http
GET /api/search?q=search+term
```

### 评论区
#### 获取页面评论
```http
GET /api/comments/{pageId}
```

#### 添加评论
```http
POST /api/comments/{pageId}
Content-Type: application/json

{
  "content": "Comment content"
}
```

## 权限检查

API 自动执行权限检查：
- **认证验证**: 验证请求者身份
- **授权检查**: 确认用户具有执行操作的权限
- **资源访问**: 验证用户对特定资源的访问权限

## 错误处理

### 标准错误响应
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### 常见错误代码
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `422`: 验证失败
- `500`: 服务器错误

## 请求示例

### 使用 curl
```bash
# 获取页面列表
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://your-wiki.com/api/pages

# 创建新页面
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"path":"new-page","title":"New Page","content":"Content"}' \
     https://your-wiki.com/api/pages
```

### 使用 JavaScript
```javascript
const response = await fetch('https://your-wiki.com/api/pages', {
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN',
    'Content-Type': 'application/json'
  },
  method: 'POST',
  body: JSON.stringify({
    path: 'new-page',
    title: 'New Page',
    content: 'Page content'
  })
});

const data = await response.json();
console.log(data);
```

## 速率限制

Wiki.js 实施了 API 速率限制以防止滥用：
- **默认限制**: 每分钟请求数
- **认证用户**: 更高的限制
- **管理员**: 最高限制

## 版本控制

API 版本通过 URL 路径或请求头指定：
```http
GET /api/v2/pages
```
或
```http
GET /api/pages
Accept: application/vnd.wikijs.v2+json
```

## Webhooks

Wiki.js 支持配置 Webhook 来响应系统事件：
- 页面创建/更新/删除
- 用户操作
- 评论添加

Webhook 配置通过管理界面进行设置。

## 最佳实践

1. **安全存储 API 密钥**: 使用环境变量或密钥管理服务
2. **实施重试逻辑**: 处理临时网络问题
3. **缓存响应**: 减少不必要的 API 调用
4. **使用适当的 HTTP 方法**: GET（读取）、POST（创建）、PUT（更新）、DELETE（删除）
5. **处理分页**: 对于大型数据集使用分页参数
