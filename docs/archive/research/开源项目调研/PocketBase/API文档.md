# PocketBase REST API 文档

## 概述

PocketBase 提供了一个 REST-ish API，用于与存储的数据进行交互。默认运行在 `http://localhost:8090`。

## 基础信息

- **Base URL**: `http://localhost:8090/api`
- **数据格式**: JSON
- **认证方式**: Token-based (Bearer Token) 和 Cookie-based

---

## 记录操作 API

### 1. 创建记录

```http
POST /api/collections/{collection}/records
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}
```

**示例**:
```bash
curl -X POST http://localhost:8090/api/collections/posts/records \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello World","content":"My first post"}'
```

### 2. 列出记录

```http
GET /api/collections/{collection}/records
```

**查询参数**:
- `page` - 页码 (默认: 1)
- `perPage` - 每页数量 (默认: 30, 最大: 200)
- `sort` - 排序字段 (如: `created`, `-created`)
- `filter` - 过滤表达式
- `expand` - 展开关联字段

**示例**:
```bash
# 基本查询
curl http://localhost:8090/api/collections/posts/records

# 分页查询
curl "http://localhost:8090/api/collections/posts/records?page=2&perPage=10"

# 排序
curl "http://localhost:8090/api/collections/posts/records?sort=-created"

# 过滤
curl "http://localhost:8090/api/collections/posts/records?filter=status='published'"

# 展开关联字段
curl "http://localhost:8090/api/collections/posts/records?expand=author"
```

### 3. 查看单个记录

```http
GET /api/collections/{collection}/records/{id}
```

**示例**:
```bash
curl http://localhost:8090/api/collections/posts/records/RECORD_ID
```

### 4. 更新记录

```http
PATCH /api/collections/{collection}/records/{id}
Content-Type: application/json

{
  "field1": "new_value"
}
```

**示例**:
```bash
curl -X PATCH http://localhost:8090/api/collections/posts/records/RECORD_ID \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title"}'
```

### 5. 删除记录

```http
DELETE /api/collections/{collection}/records/{id}
```

**示例**:
```bash
curl -X DELETE http://localhost:8090/api/collections/posts/records/RECORD_ID
```

---

## 用户认证 API

### 1. 密码登录

```http
POST /api/collections/{collection}/auth-with-password

{
  "identity": "user@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "record": {
    "id": "RECORD_ID",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### 2. OAuth2 登录

```http
POST /api/collections/{collection}/auth-with-oauth2

{
  "provider": "google",
  "code": "authorization_code",
  "redirectUrl": "http://localhost:8090/callback",
  "codeVerifier": "optional_code_verifier"
}
```

**支持的提供商**: Google, Facebook, GitHub, GitLab, Discord, Apple, Microsoft, Spotify, Twitter, VK, Yandex, Kakao

### 3. 刷新令牌

```http
POST /api/collections/{collection}/auth-refresh
```

### 4. 请求密码重置

```http
POST /api/collections/{collection}/request-password-reset

{
  "email": "user@example.com"
}
```

### 5. 确认密码重置

```http
POST /api/collections/{collection}/confirm-password-reset

{
  "token": "reset_token",
  "password": "new_password",
  "passwordConfirm": "new_password"
}
```

### 6. 请求邮箱验证

```http
POST /api/collections/{collection}/request-verification

{
  "email": "user@example.com"
}
```

### 7. 确认邮箱验证

```http
POST /api/collections/{collection}/confirm-verification

{
  "token": "verification_token"
}
```

---

## 文件上传 API

### 单文件上传

```http
POST /api/collections/{collection}/records
Content-Type: multipart/form-data

field1=value1&file=@/path/to/file.jpg
```

**示例 (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('title', 'My Document');
formData.append('file', fileInput.files[0]);

await pb.collection('documents').create(formData);
```

**示例 (cURL)**:
```bash
curl -X POST http://localhost:8090/api/collections/documents/records \
  -F "title=My Document" \
  -F "file=@/path/to/document.pdf"
```

### 多文件上传

PocketBase 支持多文件上传，只需使用相同的字段名：

```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('files', file3);

await pb.collection('documents').create(formData);
```

---

## 实时订阅 API

PocketBase 支持通过 WebSocket 进行实时订阅。

### 连接端点

```
ws://localhost:8090/api/realtime
```

### 订阅消息格式

```json
{
  "clientId": "unique_client_id",
  "subscriptions": [
    "collection_id_or_name"
  ]
}
```

### 事件类型

- `create` - 新记录创建
- `update` - 记录更新
- `delete` - 记录删除

**示例 (JavaScript)**:
```javascript
// 订阅集合
pb.collection('posts').subscribe('*', function(e) {
  console.log(e.action, e.record);
});

// 取消订阅
pb.collection('posts').unsubscribe();
```

---

## 批量操作 API

### 批量导入

```http
POST /api/collections/{collection}/import
Content-Type: application/json

[
  {"field1": "value1"},
  {"field2": "value2"}
]
```

---

## 管理员 API

### 创建管理员

```http
POST /api/admins
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin_password",
  "passwordConfirm": "admin_password"
}
```

### 管理员登录

```http
POST /api/admins/auth-with-password

{
  "identity": "admin@example.com",
  "password": "admin_password"
}
```

---

## 认证令牌使用

### Bearer Token 方式

```http
GET /api/collections/{collection}/records
Authorization: Bearer YOUR_TOKEN
```

```bash
curl http://localhost:8090/api/collections/posts/records \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Cookie 方式

```http
GET /api/collections/{collection}/records
Cookie: pb_auth=YOUR_TOKEN
```

---

## 过滤表达式语法

### 基本运算符

- `==` - 等于
- `!=` - 不等于
- `>` - 大于
- `<` - 小于
- `>=` - 大于等于
- `<=` - 小于等于
- `~` - 包含 (字符串)
- `!~` - 不包含 (字符串)

### 逻辑运算符

- `&&` - 且
- `||` - 或

### 示例

```bash
# 简单过滤
curl "http://localhost:8090/api/collections/posts/records?filter=status='published'"

# 多条件
curl "http://localhost:8090/api/collections/posts/records?filter=status='published' && category='tech'"

# 范围查询
curl "http://localhost:8090/api/collections/posts/records?filter=views > 1000"

# 字符串包含
curl "http://localhost:8090/api/collections/posts/records?filter=title ~ 'tutorial'"
```

---

## 扩展关联字段 (Expand)

使用 `expand` 参数加载关联数据：

```bash
# 展开单个关联
curl "http://localhost:8090/api/collections/posts/records?expand=author"

# 展开多个关联
curl "http://localhost:8090/api/collections/posts/records?expand=author,category"

# 展开嵌套关联
curl "http://localhost:8090/api/collections/posts/records?expand=author.profile"
```

---

## 错误响应格式

所有 API 错误响应遵循统一格式：

```json
{
  "status": 400,
  "message": "Something went wrong",
  "data": {
    "field1": {
      "code": "validation_invalid_field",
      "message": "Invalid value"
    }
  }
}
```

---

## API 速率限制

默认配置下，PocketBase 没有严格的速率限制，但可以通过中间件配置：

```javascript
// 在自定义扩展中配置
app.OnBeforeServe().Add(func(e *core.ServeEvent) {
    e.Router.GET("/*", apis.RequireAuthsameId())
});
```

---

## 常见 HTTP 状态码

- `200` - 成功
- `201` - 创建成功
- `204` - 无内容 (删除成功)
- `400` - 请求错误
- `401` - 未认证
- `403` - 无权限
- `404` - 未找到
- `422` - 验证错误
- `500` - 服务器错误

---

## 官方 SDK

### JavaScript/TypeScript

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// 认证
await pb.collection('users').authWithPassword(
  'user@example.com',
  'password123'
);

// CRUD 操作
const record = await pb.collection('posts').getList(1, 50);
```

### Dart

```dart
import 'package:pocketbase/pocketbase.dart';

final pb = PocketBase('http://localhost:8090');

// 认证
await pb.collection('users').authWithPassword(
  'user@example.com',
  'password123',
);

// CRUD 操作
final record = await pb.collection('posts').getList(page: 1, perPage: 50);
```

---

## 参考资料

- [官方文档](https://pocketbase.io/docs/)
- [API 概述](https://pocketbase.io/docs/api-overview/)
- [JavaScript SDK](https://pocketbase.io/docs/js-overview/)
- [Dart SDK](https://pocketbase.io/docs/dart-overview/)
