# Appwrite Auth API 文档

## 概述

Appwrite Auth 提供完整的用户认证和授权解决方案。支持多种认证方式，包括邮箱密码、OAuth、魔法链接、手机验证等，并提供细粒度的权限控制和会话管理。

## 基本概念

### 认证流程

```
注册/登录
    │
    ▼
验证凭据
    │
    ▼
创建会话
    │
    ▼
返回 Token
    │
    ▼
访问受保护资源
```

### 核心组件

1. **Users**: 用户管理
2. **Sessions**: 会话管理
3. **Tokens**: 访问令牌
4. **Teams**: 团队管理
5. **Membership**: 成员资格
6. **JWT**: JSON Web Token

## 用户管理 API

### 1. 创建用户

```http
POST /account
```

**请求体 (邮箱注册)：**
```json
{
  "userId": "unique-user-id",
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**请求体 (手机注册)：**
```json
{
  "userId": "unique-user-id",
  "phone": "+1234567890",
  "password": "password123",
  "name": "John Doe"
}
```

**响应示例：**
```json
{
  "$id": "user123",
  "name": "John Doe",
  "registration": "2024-01-01T00:00:00.000Z",
  "status": true,
  "labels": [],
  "passwordUpdate": "2024-01-01T00:00:00.000Z",
  "email": "user@example.com",
  "phone": "+1234567890",
  "emailVerification": true,
  "phoneVerification": false,
  "mfa": false,
  "prefs": {}
}
```

### 2. 获取用户

```http
GET /account
```

**响应示例：**
```json
{
  "$id": "user123",
  "name": "John Doe",
  "registration": "2024-01-01T00:00:00.000Z",
  "status": true,
  "labels": [],
  "passwordUpdate": "2024-01-01T00:00:00.000Z",
  "email": "user@example.com",
  "phone": "+1234567890",
  "emailVerification": true,
  "phoneVerification": false,
  "mfa": false,
  "prefs": {
    "theme": "dark",
    "language": "zh-CN"
  }
}
```

### 3. 更新用户

```http
PATCH /account
```

**请求体：**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "new-password",
  "phone": "+0987654321",
  "prefs": {
    "theme": "light"
  }
}
```

### 4. 删除用户

```http
DELETE /account
```

## 认证方法

### 1. 邮箱密码登录

```http
POST /account/sessions/email
```

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例：**
```json
{
  "$id": "session123",
  "userId": "user123",
  "expire": "2024-01-08T00:00:00.000Z",
  "provider": "email",
  "providerUid": "user@example.com",
  "providerToken": "",
  "providerAccessToken": "",
  "providerRefreshToken": "",
  "ip": "127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "countryCode": "US",
  "countryName": "United States",
  "current": true
}
```

### 2. 魔法链接

```http
POST /account/sessions/magic-url
```

**请求体：**
```json
{
  "email": "user@example.com",
  "url": "https://example.com/auth/callback"
}
```

### 3. OAuth 认证

支持的OAuth提供商：
- Google
- Facebook
- GitHub
- GitLab
- Bitbucket
- Discord
- Twitch
- Microsoft
- Apple
- Amazon
- Spotify
- Slack
- WordPress
- Yandex

```http
GET /account/sessions/oauth2/{provider}
```

**查询参数：**
```
?success=https://example.com/success&failure=https://example.com/failure&scopes[]=profile&scopes[]=email
```

**示例 (Google OAuth)：**
```javascript
// 创建OAuth2会话
account.createOAuth2Session(
  'google',
  'https://example.com/success',
  'https://example.com/failure',
  ['profile', 'email']
);
```

### 4. 手机验证登录

```http
POST /account/sessions/phone
```

**请求体：**
```json
{
  "phone": "+1234567890",
  "password": "password123"
}
```

### 5. 匿名会话

```http
POST /account/sessions/anonymous
```

**响应示例：**
```json
{
  "$id": "anon-session-123",
  "userId": "anon-user-123",
  "expire": "2024-01-08T00:00:00.000Z",
  "provider": "anonymous",
  "current": true
}
```

## 会话管理

### 1. 列出会话

```http
GET /account/sessions
```

**响应示例：**
```json
{
  "total": 2,
  "sessions": [
    {
      "$id": "session123",
      "userId": "user123",
      "expire": "2024-01-08T00:00:00.000Z",
      "provider": "email",
      "providerUid": "user@example.com",
      "ip": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "countryCode": "US",
      "countryName": "United States",
      "current": true
    }
  ]
}
```

### 2. 获取会话

```http
GET /account/sessions/{sessionId}
```

### 3. 更新会话

```http
PATCH /account/sessions/{sessionId}
```

**请求体：**
```json
{
  "expire": "2024-01-15T00:00:00.000Z"
}
```

### 4. 删除会话

```http
DELETE /account/sessions/{sessionId}
```

### 5. 删除所有会话

```http
DELETE /account/sessions
```

## 验证功能

### 1. 邮箱验证

**创建验证：**
```http
POST /account/verification
```

**请求体：**
```json
{
  "url": "https://example.com/verify"
}
```

**完成验证：**
```http
PUT /account/verification
```

**请求体：**
```json
{
  "userId": "user123",
  "secret": "verification-secret",
  "url": "https://example.com/verify"
}
```

### 2. 手机验证

**创建验证：**
```http
POST /account/verification/phone
```

**请求体：**
```json
{
  "phone": "+1234567890"
}
```

**完成验证：**
```http
PUT /account/verification/phone
```

**请求体：**
```json
{
  "userId": "user123",
  "secret": "123456"
}
```

## 密码管理

### 1. 创建密码恢复

```http
POST /account/recovery
```

**请求体：**
```json
{
  "email": "user@example.com",
  "url": "https://example.com/recovery"
}
```

### 2. 完成密码恢复

```http
PUT /account/recovery
```

**请求体：**
```json
{
  "userId": "user123",
  "secret": "recovery-secret",
  "password": "new-password"
}
```

### 3. 修改密码

```http
PATCH /account/password
```

**请求体：**
```json
{
  "oldPassword": "old-password",
  "password": "new-password"
}
```

## 多因素认证 (MFA)

### 1. 创建 MFA 因子

```http
POST /account/mfa
```

**请求体：**
```json
{
  "factor": "totp"
}
```

### 2. 列出 MFA 因子

```http
GET /account/mfa
```

### 3. 获取 MFA 因子

```http
GET /account/mfa/factors/{factorId}
```

### 4. 删除 MFA 因子

```http
DELETE /account/mfa/factors/{factorId}
```

### 5. 创建 MFA 挑战

```http
POST /account/mfa/challenge
```

**请求体：**
```json
{
  "factorId": "factor123"
}
```

### 6. 验证 MFA 挑战

```http
PUT /account/mfa/challenge
```

**请求体：**
```json
{
  "factorId": "factor123",
  "challengeId": "challenge123",
  "otp": "123456"
}
```

## 服务器端用户管理

### 1. 创建用户 (服务器)

```http
POST /users
```

**请求体：**
```json
{
  "userId": "unique-user-id",
  "email": "user@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "name": "John Doe"
}
```

### 2. 列出用户 (服务器)

```http
GET /users
```

**查询参数：**
```
?search=john&limit=25&offset=0&orderDesc[]=$createdAt
```

**响应示例：**
```json
{
  "total": 100,
  "users": [
    {
      "$id": "user123",
      "name": "John Doe",
      "registration": "2024-01-01T00:00:00.000Z",
      "status": true,
      "labels": [],
      "email": "user@example.com",
      "phone": "+1234567890",
      "emailVerification": true,
      "phoneVerification": false,
      "mfa": false,
      "prefs": {}
    }
  ]
}
```

### 3. 获取用户 (服务器)

```http
GET /users/{userId}
```

### 4. 更新用户 (服务器)

```http
PATCH /users/{userId}
```

**请求体：**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+0987654321",
  "emailVerification": true,
  "phoneVerification": true,
  "status": true,
  "password": "new-password",
  "labels": ["premium"]
}
```

### 5. 删除用户 (服务器)

```http
DELETE /users/{userId}
```

### 6. 用户偏好设置

```http
PUT /users/{userId}/prefs
```

**请求体：**
```json
{
  "theme": "dark",
  "language": "zh-CN",
  "notifications": true
}
```

### 7. 用户会话 (服务器)

```http
GET /users/{userId}/sessions
```

```http
DELETE /users/{userId}/sessions
```

```http
DELETE /users/{userId}/sessions/{sessionId}
```

### 8. 用户成员资格 (服务器)

```http
GET /users/{userId}/memberships
```

```http
PATCH /users/{userId}/memberships/{membershipId}
```

**请求体：**
```json
{
  "userId": "user123",
  "teamId": "team456",
  "roles": ["admin"],
  "secret": "invite-secret"
}
```

### 9. 用户日志 (服务器)

```http
GET /users/{userId}/logs
```

**响应示例：**
```json
{
  "total": 10,
  "logs": [
    {
      "$id": "log123",
      "userId": "user123",
      "event": "account.sessions.create",
      "userAgent": "Mozilla/5.0...",
      "ip": "127.0.0.1",
      "countryCode": "US",
      "countryName": "United States",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 团队管理

### 1. 创建团队

```http
POST /teams
```

**请求体：**
```json
{
  "teamId": "unique-team-id",
  "name": "My Team",
  "preferences": {
    "description": "Team description"
  }
}
```

### 2. 列出团队

```http
GET /teams
```

### 3. 获取团队

```http
GET /teams/{teamId}
```

### 4. 更新团队

```http
PUT /teams/{teamId}
```

**请求体：**
```json
{
  "name": "Updated Team Name",
  "preferences": {
    "description": "Updated description"
  }
}
```

### 5. 删除团队

```http
DELETE /teams/{teamId}
```

## 成员管理

### 1. 创建成员

```http
POST /teams/{teamId}/memberships
```

**请求体：**
```json
{
  "email": "member@example.com",
  "roles": ["editor"],
  "url": "https://example.com/accept-invite"
}
```

### 2. 列出成员

```http
GET /teams/{teamId}/memberships
```

### 3. 获取成员

```http
GET /teams/{teamId}/memberships/{membershipId}
```

### 4. 更新成员

```http
PATCH /teams/{teamId}/memberships/{membershipId}
```

**请求体：**
```json
{
  "roles": ["admin"]
}
```

### 5. 删除成员

```http
DELETE /teams/{teamId}/memberships/{membershipId}
```

## JWT Token

### 1. 创建 JWT Token

```http
POST /account/jwt
```

**响应示例：**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "registration": "2024-01-01T00:00:00.000Z",
  "expire": "2024-01-02T00:00:00.000Z"
}
```

### 2. JWT Payload 结构

```json
{
  "sub": "user123",
  "name": "John Doe",
  "email": "user@example.com",
  "roles": ["role:all"],
  "labels": [],
  "registration": "2024-01-01T00:00:00.000Z",
  "exp": "2024-01-02T00:00:00.000Z",
  "iat": "2024-01-01T00:00:00.000Z"
}
```

## 客户端 SDK 使用

### Web SDK

```javascript
import { Client, Account, ID } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('YOUR_PROJECT_ID');

const account = new Account(client);

// 注册用户
const user = await account.create(
  ID.unique(),
  'user@example.com',
  'password123',
  'John Doe'
);

// 邮箱密码登录
const session = await account.createEmailPasswordSession(
  'user@example.com',
  'password123'
);

// 获取当前用户
const currentUser = await account.get();

// OAuth 登录
account.createOAuth2Session(
  'google',
  'https://example.com/success',
  'https://example.com/failure',
  ['profile', 'email']
);

// 魔法链接
const magicUrl = await account.createMagicURLSession(
  'user@example.com',
  'https://example.com/verify'
);

// 更新用户信息
await account.updateName('Jane Doe');
await account.updateEmail('jane@example.com', 'password123');
await account.updatePassword('new-password');

// 验证邮箱
const verification = await account.createVerification(
  'https://example.com/verify'
);

// 密码恢复
const recovery = await account.createRecovery(
  'user@example.com',
  'https://example.com/recovery'
);

// 删除会话 (登出)
await account.deleteSession('current');

// 删除所有会话
await account.deleteSessions();

// 获取用户偏好
const prefs = await account.getPrefs();

// 更新用户偏好
await account.updatePrefs({
  theme: 'dark',
  language: 'zh-CN'
});

// 创建 JWT
const jwt = await account.createJWT();
```

### Server SDK (Node.js)

```javascript
const { Client, Users, ID } = require('node-appwrite');

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('YOUR_PROJECT_ID')
  .setKey('YOUR_API_KEY');

const users = new Users(client);

// 创建用户
const user = await users.create(
  ID.unique(),
  'user@example.com',
  'password123',
  'John Doe'
);

// 列出用户
const userList = await users.list();

// 获取用户
const user = await users.get('user123');

// 更新用户
await users.updateName('user123', 'Jane Doe');
await users.updateEmail('user123', 'jane@example.com');
await users.updatePassword('user123', 'new-password');
await users.updateStatus('user123', false);

// 用户偏好
await users.updatePrefs('user123', {
  theme: 'light',
  notifications: true
});

// 删除用户
await users.delete('user123');

// 用户会话
const sessions = await users.listSessions('user123');
await users.deleteSessions('user123');

// 用户日志
const logs = await users.listLogs('user123');

// 创建团队
const team = await teams.create(
  ID.unique(),
  'My Team'
);

// 添加成员
const membership = await teams.createMembership(
  'team123',
  ['editor'],
  'member@example.com',
  'https://example.com/accept'
);
```

## 权限系统

### 权限类型

Appwrite 使用以下权限类型：

1. **read**: 读取权限
2. **write**: 写入权限
3. **create**: 创建权限
4. **update**: 更新权限
5. **delete**: 删除权限

### 权限角色

1. **role:all**: 所有用户
2. **role:guest**: 未登录用户
3. **role:member**: 已登录用户
4. **user:{userId}**: 特定用户
5. **team:{teamId}**: 团队成员

### 权限示例

**文档权限：**
```json
{
  "read": ["role:all"],
  "write": ["user:author-id"]
}
```

**团队资源：**
```json
{
  "read": ["team:team123"],
  "write": ["team:team123"]
}
```

**私有资源：**
```json
{
  "read": ["user:owner-id"],
  "write": ["user:owner-id"]
}
```

## 最佳实践

### 1. 安全配置

**密码策略：**
```javascript
// 强密码要求
const password = 'StrongP@ssw0rd123!';

// 密码哈希
// Appwrite 自动处理密码哈希
```

**邮箱验证：**
```javascript
// 创建账户后发送验证
await account.createVerification(
  'https://example.com/verify'
);
```

### 2. 会话管理

**会话过期时间：**
```javascript
// 设置会话过期
await account.updateSession('current', {
  expire: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天
});
```

**多设备管理：**
```javascript
// 列出所有会话
const sessions = await account.listSessions();

// 删除特定会话
await account.deleteSession('session-id');

// 删除所有会话（登出所有设备）
await account.deleteSessions();
```

### 3. OAuth 配置

**回调URL配置：**
```javascript
// 在Appwrite控制台配置OAuth回调
// 成功: https://example.com/auth/success
// 失败: https://example.com/auth/failure
```

**作用域选择：**
```javascript
account.createOAuth2Session(
  'google',
  'https://example.com/success',
  'https://example.com/failure',
  ['profile', 'email', 'openid']
);
```

### 4. 错误处理

```javascript
try {
  const session = await account.createEmailPasswordSession(
    'user@example.com',
    'password'
  );
} catch (error) {
  switch (error.code) {
    case 401:
      console.error('Invalid credentials');
      break;
    case 404:
      console.error('User not found');
      break;
    case 429:
      console.error('Too many requests');
      break;
    default:
      console.error('Login failed:', error.message);
  }
}
```

### 5. 用户偏好管理

```javascript
// 获取用户偏好
const prefs = await account.getPrefs();

// 更新偏好
await account.updatePrefs({
  theme: 'dark',
  language: 'zh-CN',
  notifications: {
    email: true,
    push: false
  }
});
```

## 高级功能

### 1. 自定义令牌

```javascript
// 创建自定义JWT
const jwt = await account.createJWT();

// 使用自定义令牌
// 在后端验证令牌
```

### 2. 用户标签

```javascript
// 服务器端添加标签
await users.updateLabels('user123', ['premium', 'active']);

// 按标签查询用户
const users = await users.list([], 100, 0, undefined, [], 'premium');
```

### 3. 用户状态管理

```javascript
// 停用用户
await users.updateStatus('user123', false);

// 激活用户
await users.updateStatus('user123', true);
```

### 4. 实时订阅

```javascript
// 订阅用户事件
client.subscribe(
  `account`,
  (response) => {
    console.log('Account updated:', response.payload);
  }
);

// 取消订阅
unsubscribe();
```

## 总结

Appwrite Auth API 提供了：

- **多种认证方式**: 邮箱、OAuth、手机、魔法链接
- **会话管理**: 多设备会话控制
- **安全功能**: MFA、邮箱验证、密码恢复
- **用户管理**: 完整的用户生命周期管理
- **团队协作**: 团队和成员管理
- **权限控制**: 细粒度的权限系统
- **JWT 支持**: 自定义令牌生成
- **实时更新**: 用户变更实时通知

适合构建需要用户认证和授权的各种应用，包括：
- SaaS 应用
- 社交网络
- 企业应用
- 电商平台
- 内容管理系统
