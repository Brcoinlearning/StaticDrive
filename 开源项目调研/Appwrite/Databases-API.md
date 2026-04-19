# Appwrite Databases API 文档

## 概述

Appwrite Databases 提供了一个灵活的文档数据库系统，允许你存储、查询和管理结构化数据。它支持类似 MongoDB 的文档模型，但运行在 MariaDB 之上，提供 SQL 和 NoSQL 的优点。

## 基本概念

### 数据库层级结构

```
Project (项目)
  └── Database (数据库)
      └── Collection (集合)
          └── Document (文档)
              └── Attribute (属性)
```

### 数据模型

每个文档包含：

- **$id**: 文档唯一标识符
- **$collectionId**: 所属集合ID
- **$databaseId**: 所属数据库ID
- **$createdAt**: 创建时间
- **$updatedAt**: 更新时间
- **$permissions**: 权限设置
- **自定义属性**: 业务数据

## API 端点

### 1. 列出数据库

```http
GET /databases
```

**响应示例：**
```json
{
  "total": 1,
  "databases": [
    {
      "$id": "645abc123",
      "name": "my-database",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. 创建数据库

```http
POST /databases
```

**请求体：**
```json
{
  "databaseId": "unique-db-id",
  "name": "My Database"
}
```

**响应示例：**
```json
{
  "$id": "645abc123",
  "name": "My Database",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 3. 获取数据库

```http
GET /databases/{databaseId}
```

### 4. 更新数据库

```http
PUT /databases/{databaseId}
```

**请求体：**
```json
{
  "name": "Updated Database Name"
}
```

### 5. 删除数据库

```http
DELETE /databases/{databaseId}
```

## 集合操作

### 1. 列出集合

```http
GET /databases/{databaseId}/collections
```

**响应示例：**
```json
{
  "total": 1,
  "collections": [
    {
      "$id": "645def456",
      "databaseId": "645abc123",
      "name": "users",
      "enabled": true,
      "documentSecurity": true,
      "attributes": [],
      "indexes": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. 创建集合

```http
POST /databases/{databaseId}/collections
```

**请求体：**
```json
{
  "collectionId": "users",
  "name": "Users",
  "enabled": true,
  "documentSecurity": true,
  "permissions": [
    "read(\"any\")"
  ]
}
```

**参数说明：**

- `collectionId`: 集合唯一标识 (1-36字符)
- `name`: 集合名称
- `enabled`: 是否启用
- `documentSecurity`: 是否启用文档级权限
- `permissions`: 集合级权限

### 3. 获取集合

```http
GET /databases/{databaseId}/collections/{collectionId}
```

### 4. 更新集合

```http
PUT /databases/{databaseId}/collections/{collectionId}
```

**请求体：**
```json
{
  "name": "Updated Collection Name",
  "enabled": true,
  "documentSecurity": false,
  "permissions": [
    "read(\"any\")",
    "write(\"any\")"
  ]
}
```

### 5. 删除集合

```http
DELETE /databases/{databaseId}/collections/{collectionId}
```

## 属性操作

### 支持的属性类型

1. **string**: 文本字符串 (最大4096字符)
2. **integer**: 整数 (-2^63 到 2^63-1)
3. **float**: 浮点数 (8字节)
4. **boolean**: 布尔值 (true/false)
5. **datetime**: ISO 8601 日期时间
6. **email**: 邮箱地址
7. **enum**: 枚举值 (预定义列表)
8. **ip**: IP 地址 (IPv4/IPv6)
9. **relationship**: 关系引用
10. **url**: URL 地址

### 创建属性

```http
POST /databases/{databaseId}/collections/{collectionId}/attributes
```

#### String 属性

**请求体：**
```json
{
  "key": "username",
  "type": "string",
  "size": 256,
  "required": true,
  "default": "guest",
  "array": false
}
```

#### Integer 属性

**请求体：**
```json
{
  "key": "age",
  "type": "integer",
  "required": false,
  "min": 0,
  "max": 150,
  "default": 0,
  "array": false
}
```

#### Email 属性

**请求体：**
```json
{
  "key": "email",
  "type": "email",
  "required": true,
  "array": false
}
```

#### Enum 属性

**请求体：**
```json
{
  "key": "status",
  "type": "enum",
  "elements": ["active", "inactive", "suspended"],
  "required": true,
  "default": "active",
  "array": false
}
```

#### Relationship 属性

**请求体：**
```json
{
  "key": "author",
  "type": "relationship",
  "required": true,
  "array": false,
  "relatedCollectionId": "users",
  "relationType": "manyToOne",
  "twoWay": true,
  "twoWayKey": "posts"
}
```

### 列出属性

```http
GET /databases/{databaseId}/collections/{collectionId}/attributes
```

### 获取属性

```http
GET /databases/{databaseId}/collections/{collectionId}/attributes/{key}
```

### 删除属性

```http
DELETE /databases/{databaseId}/collections/{collectionId}/attributes/{key}
```

## 索引操作

### 创建索引

```http
POST /databases/{databaseId}/collections/{collectionId}/indexes
```

**请求体：**
```json
{
  "key": "index_email",
  "type": "key",
  "attributes": ["email"],
  "orders": ["ASC"]
}
```

**索引类型：**

1. **key**: 唯一索引
2. **fulltext**: 全文索引
3. **index**: 普通索引

**示例：**

#### 唯一索引
```json
{
  "key": "unique_email",
  "type": "key",
  "attributes": ["email"]
}
```

#### 全文索引
```json
{
  "key": "search_content",
  "type": "fulltext",
  "attributes": ["title", "description"]
}
```

#### 复合索引
```json
{
  "key": "user_status",
  "type": "index",
  "attributes": ["userId", "status"],
  "orders": ["ASC", "DESC"]
}
```

### 列出索引

```http
GET /databases/{databaseId}/collections/{collectionId}/indexes
```

### 获取索引

```http
GET /databases/{databaseId}/collections/{collectionId}/indexes/{key}
```

### 删除索引

```http
DELETE /databases/{databaseId}/collections/{collectionId}/indexes/{key}
```

## 文档操作

### 创建文档

```http
POST /databases/{databaseId}/collections/{collectionId}/documents
```

**请求体：**
```json
{
  "documentId": "unique-doc-id",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "active": true,
    "tags": ["developer", "admin"]
  },
  "permissions": {
    "read": ["role:all"],
    "write": ["user:john"]
  }
}
```

**响应示例：**
```json
{
  "$id": "doc123",
  "$collectionId": "645def456",
  "$databaseId": "645abc123",
  "$createdAt": "2024-01-01T00:00:00.000Z",
  "$updatedAt": "2024-01-01T00:00:00.000Z",
  "$permissions": {
    "read": ["role:all"],
    "write": ["user:john"]
  },
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "active": true,
  "tags": ["developer", "admin"]
}
```

### 获取文档

```http
GET /databases/{databaseId}/collections/{collectionId}/documents/{documentId}
```

### 列出文档

```http
GET /databases/{databaseId}/collections/{collectionId}/documents
```

**查询参数：**

```http
GET /databases/{databaseId}/collections/{collectionId}/documents?queries[]=equal("status","active")&queries[]=greaterThan("age",18)&limit=25&offset=0&orderDesc[]=createdAt
```

#### 查询方法

**1. 等于查询 (equal)**
```
equal("attribute", "value")
```

**2. 不等于查询 (notEqual)**
```
notEqual("attribute", "value")
```

**3. 小于查询 (lessThan)**
```
lessThan("attribute", value)
```

**4. 小于等于 (lessThanEqual)**
```
lessThanEqual("attribute", value)
```

**5. 大于查询 (greaterThan)**
```
greaterThan("attribute", value)
```

**6. 大于等于 (greaterThanEqual)**
```
greaterThanEqual("attribute", value)
```

**7. 包含查询 (contains)**
```
contains("attribute", "substring")
```

**8. 搜索查询 (search)**
```
search("attribute", "search term")
```

**9. 数组包含 (containsAny)**
```
containsAny("attribute", ["value1", "value2"])
```

**10. 数组包含所有 (containsAll)**
```
containsAll("attribute", ["value1", "value2"])
```

**11. 在列表中 (isNull)**
```
isNull("attribute")
```

**12. 不在列表中 (isNotNull)**
```
isNotNull("attribute")
```

**13. 在之间 (between)**
```
between("attribute", min, max)
```

**14. 以开始 (startsWith)**
```
startsWith("attribute", "prefix")
```

**15. 以结束 (endsWith)**
```
endsWith("attribute", "suffix")
```

**16. 选择查询 (select)**
```
select(["attr1", "attr2"])
```

**17. 排序查询 (orderDesc)**
```
orderDesc("attribute")
orderAsc("attribute")
```

**18. 游标分页 (cursorAfter)**
```
cursorAfter("documentId")
```

**19. 限制查询 (limit)**
```
limit(25)
```

**20. 偏移查询 (offset)**
```
offset(10)
```

#### 组合查询示例

**多条件查询：**
```javascript
// 查找活跃的成年用户
queries = [
  Query.equal('status', 'active'),
  Query.greaterThan('age', 18),
  Query.orderDesc('createdAt'),
  Query.limit(25)
]
```

**搜索查询：**
```javascript
// 搜索包含特定关键词的帖子
queries = [
  Query.search('content', 'keyword'),
  Query.equal('published', true)
]
```

**关系查询：**
```javascript
// 查找特定用户的文章
queries = [
  Query.equal('userId', 'user123'),
  Query.orderDesc('$createdAt')
]
```

### 更新文档

```http
PATCH /databases/{databaseId}/collections/{collectionId}/documents/{documentId}
```

**请求体：**
```json
{
  "data": {
    "name": "Jane Doe",
    "age": 31
  },
  "permissions": {
    "write": ["user:jane"]
  }
}
```

### 删除文档

```http
DELETE /databases/{databaseId}/collections/{collectionId}/documents/{documentId}
```

## 权限系统

### 权限类型

1. **read**: 读取权限
2. **write**: 写入权限 (创建、更新、删除)

### 权限角色

1. **role:all**: 所有用户
2. **role:guest**: 未登录用户
3. **role:member**: 已登录用户
4. **user:{userId}**: 特定用户
5. **team:{teamId}**: 团队成员

### 权限示例

**公开可读，作者可写：**
```json
{
  "read": ["role:all"],
  "write": ["user:author-id"]
}
```

**仅登录用户可访问：**
```json
{
  "read": ["role:member"],
  "write": ["role:member"]
}
```

**团队权限：**
```json
{
  "read": ["team:team123"],
  "write": ["team:team123", "user:admin"]
}
```

## 客户端 SDK 使用

### Server SDK (Node.js)

```javascript
const { Client, Databases } = require('node-appwrite');

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('YOUR_PROJECT_ID')
  .setKey('YOUR_API_KEY');

const databases = new Databases(client);

// 创建数据库
await databases.createDatabase(
  'my-database',
  'My Database'
);

// 创建集合
await databases.createCollection(
  'my-database',
  'users',
  'Users',
  ['read("any")']
);

// 创建属性
await databases.createStringAttribute(
  'my-database',
  'users',
  'username',
  256,
  true
);

// 创建文档
const document = await databases.createDocument(
  'my-database',
  'users',
  'user123',
  {
    username: 'john_doe',
    email: 'john@example.com',
    age: 30
  }
);

// 列出文档
const documents = await databases.listDocuments(
  'my-database',
  'users',
  [
    Query.equal('active', true),
    Query.greaterThan('age', 18)
  ]
);

// 更新文档
await databases.updateDocument(
  'my-database',
  'users',
  'user123',
  {
    age: 31
  }
);

// 删除文档
await databases.deleteDocument(
  'my-database',
  'users',
  'user123'
);
```

### Web SDK

```javascript
import { Client, Databases, Query } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('YOUR_PROJECT_ID');

const databases = new Databases(client);

// 创建文档
await databases.createDocument(
  'my-database',
  'posts',
  ID.unique(),
  {
    title: 'Hello World',
    content: 'My first post',
    published: true
  }
);

// 查询文档
const posts = await databases.listDocuments(
  'my-database',
  'posts',
  [
    Query.equal('published', true),
    Query.orderDesc('$createdAt'),
    Query.limit(10)
  ]
);

// 实时订阅
const unsubscribe = client.subscribe(
  `databases.my-database.collections.posts.documents`,
  (response) => {
    console.log('Document changed:', response.payload);
  }
);
```

## 最佳实践

### 1. 数据模型设计

**用户集合：**
```javascript
{
  userId: "string",
  email: "email",
  username: "string",
  createdAt: "datetime",
  updatedAt: "datetime"
}
```

**文章集合：**
```javascript
{
  title: "string",
  content: "string",
  authorId: "relationship → users.userId",
  published: "boolean",
  tags: "array<string>",
  createdAt: "datetime"
}
```

**评论集合：**
```javascript
{
  postId: "relationship → posts.$id",
  userId: "relationship → users.userId",
  content: "string",
  createdAt: "datetime"
}
```

### 2. 索引优化

**为常用查询创建索引：**
```javascript
// 邮箱唯一索引
await databases.createIndex(
  'my-database',
  'users',
  'email_unique',
  'key',
  ['email'],
  ['ASC']
);

// 复合查询索引
await databases.createIndex(
  'my-database',
  'posts',
  'author_published',
  'index',
  ['authorId', 'published'],
  ['ASC', 'ASC']
);
```

### 3. 权限设计

**文档级权限：**
```javascript
// 创建时设置权限
await databases.createDocument(
  'my-database',
  'documents',
  ID.unique(),
  { content: '...' },
  {
    read: ['role:member'],
    write: ['user:author-id']
  }
);
```

### 4. 查询优化

**使用选择限制返回字段：**
```javascript
await databases.listDocuments(
  'my-database',
  'posts',
  [
    Query.select(['title', 'createdAt']),
    Query.limit(20)
  ]
);
```

**使用游标分页：**
```javascript
const firstPage = await databases.listDocuments(
  'my-database',
  'posts',
  [Query.limit(20)]
);

const nextPage = await databases.listDocuments(
  'my-database',
  'posts',
  [
    Query.cursorAfter(firstPage.documents[19].$id),
    Query.limit(20)
  ]
);
```

## 错误处理

### 常见错误代码

- **400**: 无效请求
- **401**: 未授权
- **403**: 禁止访问
- **404**: 未找到
- **409**: 冲突 (如重复键)
- **429**: 请求过多

### 错误处理示例

```javascript
try {
  await databases.createDocument(...);
} catch (error) {
  switch (error.code) {
    case 400:
      console.error('Invalid request:', error.message);
      break;
    case 401:
      console.error('Unauthorized');
      break;
    case 409:
      console.error('Conflict:', error.message);
      break;
    default:
      console.error('Unknown error:', error.message);
  }
}
```

## 总结

Appwrite Databases API 提供了：

- **灵活的数据模型**: 支持多种数据类型和关系
- **强大的查询**: 丰富的查询方法和组合
- **细粒度权限**: 集合和文档级权限控制
- **实时订阅**: 自动推送数据变更
- **客户端SDK**: 多语言支持
- **SQL后端**: 基于MariaDB，数据安全可靠

适合构建需要结构化数据存储的现代Web应用。
