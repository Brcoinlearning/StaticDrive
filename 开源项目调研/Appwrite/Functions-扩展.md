# Appwrite Functions 和扩展机制

## 概述

Appwrite Functions 是一个强大的无服务器计算平台，允许开发者部署和运行自定义代码来扩展 Appwrite 的功能。Functions 可以由 Appwrite 事件触发，也可以按计划执行，或者通过 HTTP 请求直接调用。

## 核心概念

### Functions 架构

```
触发源
    │
    ├─→ Appwrite 事件 (数据库变更、文件上传等)
    ├─→ 定时任务 (Cron 调度)
    ├─→ HTTP 请求 (REST API)
    └─→ 手动触发
    │
    ▼
Function 执行环境
    │
    ├─→ 代码执行
    ├─→ 环境变量
    ├─→ 资源限制
    └─→ 日志收集
    │
    ▼
结果处理
    │
    ├─→ 返回响应
    ├─→ 触发后续操作
    └─→ 错误处理
```

### 支持的运行时

Appwrite Functions 支持多种运行时环境：

1. **Node.js**: 18.0, 20.0, 22.0
2. **Python**: 3.9, 3.10, 3.11, 3.12
3. **PHP**: 8.0, 8.1, 8.2, 8.3
4. **Ruby**: 3.2
5. **Java**: 21.0
6. **C#**: 8.0
7. **Go**: 1.22
8. **Kotlin**: 1.9
9. **Dart**: 3.3
10. **Swift**: 5.9
11. **Rust**: 1.77
12. **Deno**: 1.40

## Functions API

### 1. 列出 Functions

```http
GET /functions
```

**响应示例：**
```json
{
  "total": 2,
  "functions": [
    {
      "$id": "func123",
      "name": "process-image",
      "runtime": "node-20.0",
      "created": "2024-01-01T00:00:00.000Z",
      "updated": "2024-01-01T00:00:00.000Z",
      "status": "enabled",
      "execution": "1.0.0",
      "trigger": "event",
      "events": ["storage.files.create"],
      "schedule": "",
      "timeout": 15,
      "enabled": true,
      "logging": true,
      "entrypoint": "src/index.js",
      "commands": "npm install",
      "version": "1.0.0",
      "installationId": "install123",
      "providerRepositoryId": "",
      "providerBranch": "",
      "providerRootDirectory": "",
      "providerSilentMode": false,
      "specification": "1.0.0"
    }
  ]
}
```

### 2. 创建 Function

```http
POST /functions
```

**请求体：**
```json
{
  "functionId": "process-image",
  "name": "Process Image",
  "runtime": "node-20.0",
  "execute": ["any"],
  "events": [
    "storage.files.create"
  ],
  "schedule": "",
  "timeout": 15,
  "enabled": true,
  "logging": true,
  "entrypoint": "src/index.js",
  "commands": "npm install",
  "scopes": ["files.read", "files.write"]
}
```

**参数说明：**

- `functionId`: Function 唯一标识
- `name`: Function 名称
- `runtime`: 运行时版本
- `execute`: 执行权限 ("any" 或特定角色)
- `events`: 触发事件数组
- `schedule`: Cron 表达式
- `timeout`: 超时时间 (秒)
- `enabled`: 是否启用
- `logging`: 是否启用日志
- `entrypoint`: 入口文件
- `commands`: 构建命令
- `scopes`: 所需权限范围

### 3. 获取 Function

```http
GET /functions/{functionId}
```

### 4. 更新 Function

```http
PUT /functions/{functionId}
```

**请求体：**
```json
{
  "name": "Updated Function Name",
  "runtime": "node-22.0",
  "execute": ["role:member"],
  "events": ["storage.files.create", "storage.files.update"],
  "schedule": "0 0 * * *",
  "timeout": 30,
  "enabled": true,
  "logging": true,
  "entrypoint": "src/index.js",
  "commands": "npm install && npm run build"
}
```

### 5. 删除 Function

```http
DELETE /functions/{functionId}
```

## 部署管理

### 1. 创建部署

```http
POST /functions/{functionId}/deployments
```

**请求类型：** `multipart/form-data`

**表单字段：**

- `code`: 代码文件 (zip)
- `activate`: 是否自动激活 (true/false)

**示例 (curl)：**
```bash
curl -X POST \
  https://cloud.appwrite.io/v1/functions/process-image/deployments \
  -H 'Content-Type: multipart/form-data' \
  -H 'X-Appwrite-Project: YOUR_PROJECT_ID' \
  -H 'X-Appwrite-Key: YOUR_API_KEY' \
  -F 'code=@/path/to/code.zip' \
  -F 'activate=true'
```

### 2. 列出部署

```http
GET /functions/{functionId}/deployments
```

**响应示例：**
```json
{
  "total": 1,
  "deployments": [
    {
      "$id": "deploy123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "status": "ready",
      "buildId": "build123",
      "buildLogs": "",
      "status": "ready",
      "activate": true
    }
  ]
}
```

### 3. 获取部署

```http
GET /functions/{functionId}/deployments/{deploymentId}
```

### 4. 删除部署

```http
DELETE /functions/{functionId}/deployments/{deploymentId}
```

### 5. 重新部署

```http
POST /functions/{functionId}/deployments/{deploymentId}
```

## 执行管理

### 1. 创建执行

```http
POST /functions/{functionId}/executions
```

**请求体：**
```json
{
  "body": "{}",
  "async": true
}
```

**响应示例：**
```json
{
  "$id": "exec123",
  "functionId": "process-image",
  "trigger": "http",
  "status": "processing",
  "requestMethod": "POST",
  "requestPath": "/v1/functions/process-image/executions",
  "requestHeaders": {},
  "responseStatusCode": 200,
  "responseBody": "",
  "errors": [],
  "logs": "",
  "duration": 0.5,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. 列出执行

```http
GET /functions/{functionId}/executions
```

**查询参数：**
```
?limit=25&offset=0&orderDesc[]=$createdAt&search=exec123
```

### 3. 获取执行

```http
GET /functions/{functionId}/executions/{executionId}
```

### 4. 删除执行

```http
DELETE /functions/{functionId}/executions/{executionId}
```

## 触发器类型

### 1. 事件触发

Appwrite 支持以下事件：

#### 数据库事件
```
databases.{databaseId}.collections.{collectionId}.documents.create
databases.{databaseId}.collections.{collectionId}.documents.update
databases.{databaseId}.collections.{collectionId}.documents.delete
```

#### 存储事件
```
storage.buckets.{bucketId}.files.create
storage.buckets.{bucketId}.files.update
storage.buckets.{bucketId}.files.delete
```

#### 用户事件
```
users.create
users.update
users.delete
users.sessions.create
users.sessions.delete
```

#### 团队事件
```
teams.{teamId}.memberships.create
teams.{teamId}.memberships.update
teams.{teamId}.memberships.delete
```

**示例：**
```json
{
  "events": [
    "databases.my-db.collections.posts.documents.create",
    "storage.buckets.images.files.create"
  ]
}
```

### 2. 定时触发 (Cron)

**Cron 表达式格式：**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── 星期几 (0-6, 0 = 周日)
│ │ │ └───── 月份 (1-12)
│ │ └─────── 日期 (1-31)
│ └───────── 小时 (0-23)
└─────────── 分钟 (0-59)
```

**示例：**
```json
{
  "schedule": "0 0 * * *"    // 每天午夜
  "schedule": "0 */6 * * *"  // 每6小时
  "schedule": "0 9 * * 1-5"  // 工作日上午9点
  "schedule": "*/15 * * * *" // 每15分钟
}
```

### 3. HTTP 触发

通过 HTTP 请求直接调用：

```bash
curl -X POST \
  https://cloud.appwrite.io/v1/functions/my-function/executions \
  -H 'Content-Type: application/json' \
  -H 'X-Appwrite-Project: YOUR_PROJECT_ID' \
  -d '{"async": false, "body": "{\"key\":\"value\"}"}'
```

## 运行时示例

### Node.js 示例

**文件结构：**
```
my-function/
├── src/
│   └── index.js
├── package.json
└── .appwrite.json
```

**index.js:**
```javascript
export default async ({ req, res, log, error }) => {
  // 解析请求体
  const body = JSON.parse(req.body);

  // 记录日志
  log('Processing request');

  try {
    // 业务逻辑
    const result = await processData(body);

    // 返回响应
    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    // 记录错误
    error(err.message);

    // 返回错误响应
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};

async function processData(data) {
  // 处理数据
  return { processed: true, timestamp: Date.now() };
}
```

**package.json:**
```json
{
  "name": "my-function",
  "version": "1.0.0",
  "main": "src/index.js",
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

### Python 示例

**main.py:**
```python
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)

        # 处理数据
        result = process_data(data)

        # 返回响应
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

def process_data(data):
    return {
        'success': True,
        'data': data
    }
```

### Go 示例

**main.go:**
```go
package main

import (
    "encoding/json"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        // 解析请求
        var data map[string]interface{}
        json.NewDecoder(r.Body).Decode(&data)

        // 处理数据
        result := processData(data)

        // 返回响应
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(result)
    })

    http.ListenAndServe(":3000", nil)
}

func processData(data map[string]interface{}) map[string]interface{} {
    return map[string]interface{}{
        "success": true,
        "data":    data,
    }
}
```

## 环境变量

### 1. 设置环境变量

在 Function 创建或更新时设置：

```json
{
  "variables": {
    "API_KEY": "your-api-key",
    "DATABASE_URL": "your-database-url",
    "SECRET_KEY": "your-secret-key"
  }
}
```

### 2. 访问环境变量

**Node.js:**
```javascript
const apiKey = process.env.API_KEY;
const dbUrl = process.env.DATABASE_URL;
```

**Python:**
```python
import os
api_key = os.environ.get('API_KEY')
db_url = os.environ.get('DATABASE_URL')
```

**Go:**
```go
apiKey := os.Getenv("API_KEY")
dbUrl := os.Getenv("DATABASE_URL")
```

## 权限和作用域

### 1. 权限范围

Functions 可以请求以下权限范围：

```json
{
  "scopes": [
    "users.read",
    "users.write",
    "files.read",
    "files.write",
    "documents.read",
    "documents.write"
  ]
}
```

### 2. 访问 Appwrite 服务

**在 Function 中使用 Appwrite SDK：**

```javascript
import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

export default async ({ req, res, log, error }) => {
    // 操作数据库
    const documents = await databases.listDocuments(
        'my-database',
        'my-collection'
    );

    return res.json({
        documents: documents.documents
    });
};
```

## 日志和监控

### 1. 日志记录

**Node.js:**
```javascript
export default async ({ req, res, log, error }) => {
    // 信息日志
    log('Processing started');

    // 错误日志
    error('An error occurred');

    return res.json({ success: true });
};
```

### 2. 查看日志

```http
GET /functions/{functionId}/executions/{executionId}
```

### 3. 监控指标

- 执行时间
- 内存使用
- 错误率
- 调用次数
- 响应时间

## 实际应用场景

### 1. 图像处理

**自动调整图片大小：**
```javascript
import sharp from 'sharp';

export default async ({ req, res, log, error }) => {
    const { fileId, bucketId } = JSON.parse(req.body);

    // 获取文件
    const file = await storage.getFileView(bucketId, fileId);

    // 处理图片
    const processed = await sharp(file)
        .resize(800, 600)
        .toBuffer();

    // 保存处理后的图片
    await storage.createFile(
        bucketId,
        `processed_${fileId}`,
        new InputFile(processed, 'processed.jpg')
    );

    return res.json({ success: true });
};
```

### 2. 发送邮件

```javascript
import nodemailer from 'nodemailer';

export default async ({ req, res, log, error }) => {
    const { to, subject, content } = JSON.parse(req.body);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: content
    });

    return res.json({ success: true });
};
```

### 3. 数据验证

```javascript
export default async ({ req, res, log, error }) => {
    const { documentId, databaseId, collectionId } = JSON.parse(req.body);

    // 获取文档
    const document = await databases.getDocument(
        databaseId,
        collectionId,
        documentId
    );

    // 验证数据
    const isValid = validateData(document);

    if (!isValid) {
        // 发送通知
        await sendAlert(document);
    }

    return res.json({ valid: isValid });
};

function validateData(data) {
    // 验证逻辑
    return true;
}
```

### 4. 定时任务

```javascript
export default async ({ req, res, log, error }) => {
    // 清理过期数据
    const expired = await databases.listDocuments(
        'my-database',
        'my-collection',
        [
            Query.lessThan('expiresAt', Date.now())
        ]
    );

    for (const doc of expired.documents) {
        await databases.deleteDocument(
            'my-database',
            'my-collection',
            doc.$id
        );
    }

    log(`Cleaned ${expired.documents.length} expired documents`);

    return res.json({
        cleaned: expired.documents.length
    });
};
```

## Git 集成

### 1. 连接 Git 仓库

```javascript
// 在 Appwrite Console 中配置
{
  "provider": "github",
  "repository": "username/repo",
  "branch": "main",
  "rootDirectory": "/functions/my-function",
  "automaticDeployment": true
}
```

### 2. 自动部署

推送代码到 Git 仓库后，Appwrite 自动：
1. 检测代码变更
2. 触发部署流程
3. 构建和测试
4. 更新 Function

### 3. Webhook 配置

在 Git 仓库中设置 Webhook：
```
https://cloud.appwrite.io/v1/functions/webhook
```

## 性能优化

### 1. 冷启动优化

**保持 Function 简洁：**
```javascript
// 避免在全局作用域执行重操作
// ❌ 错误
const heavyData = await loadHeavyData();

export default async ({ req, res }) => {
    return res.json({ data: heavyData });
};

// ✅ 正确
export default async ({ req, res }) => {
    const heavyData = await loadHeavyData();
    return res.json({ data: heavyData });
};
```

### 2. 依赖优化

**package.json:**
```json
{
  "dependencies": {
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### 3. 并发处理

```javascript
export default async ({ req, res, log, error }) => {
    const items = JSON.parse(req.body).items;

    // 并发处理
    const results = await Promise.all(
        items.map(item => processItem(item))
    );

    return res.json({ results });
};
```

## 错误处理

### 1. 重试机制

```javascript
export default async ({ req, res, log, error }) => {
    let retries = 3;
    let lastError;

    while (retries > 0) {
        try {
            const result = await riskyOperation();
            return res.json({ success: true, result });
        } catch (err) {
            lastError = err;
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    error(`Operation failed after 3 retries: ${lastError.message}`);
    return res.json({
        success: false,
        error: lastError.message
    }, 500);
};
```

### 2. 超时处理

```javascript
export default async ({ req, res, log, error }) => {
    const timeout = setTimeout(() => {
        throw new Error('Operation timeout');
    }, 10000);

    try {
        const result = await slowOperation();
        clearTimeout(timeout);
        return res.json({ success: true, result });
    } catch (err) {
        clearTimeout(timeout);
        error(err.message);
        return res.json({
            success: false,
            error: err.message
        }, 500);
    }
};
```

## 测试

### 1. 本地测试

```bash
# 安装 Appwrite CLI
npm install -g appwrite-cli

# 初始化函数
appwrite init function

# 本地运行
appwrite functions execute --functionId my-function
```

### 2. 单元测试

```javascript
import { describe, it, expect } from 'vitest';

describe('My Function', () => {
    it('should process data correctly', async () => {
        const input = { key: 'value' };
        const result = await processData(input);
        expect(result.success).toBe(true);
    });
});
```

## 最佳实践

### 1. 代码组织

**模块化设计：**
```javascript
// utils.js
export function validate(data) {
    return data && typeof data === 'object';
}

export function sanitize(data) {
    return JSON.parse(JSON.stringify(data));
}

// main.js
import { validate, sanitize } from './utils.js';

export default async ({ req, res }) => {
    const data = JSON.parse(req.body);

    if (!validate(data)) {
        return res.json({ error: 'Invalid data' }, 400);
    }

    const clean = sanitize(data);
    return res.json({ success: true, data: clean });
};
```

### 2. 安全性

**输入验证：**
```javascript
export default async ({ req, res }) => {
    const { input } = JSON.parse(req.body);

    // 验证输入
    if (!input || input.length > 1000) {
        return res.json({
            error: 'Invalid input'
        }, 400);
    }

    // 处理输入
    const result = processInput(input);
    return res.json({ success: true, result });
};
```

### 3. 资源管理

```javascript
export default async ({ req, res, log, error }) => {
    let connection;

    try {
        // 建立连接
        connection = await connectToDatabase();

        // 执行操作
        const result = await connection.query('SELECT * FROM users');

        return res.json({ users: result });
    } catch (err) {
        error(err.message);
        return res.json({ error: err.message }, 500);
    } finally {
        // 关闭连接
        if (connection) {
            await connection.close();
        }
    }
};
```

### 4. 监控和日志

```javascript
export default async ({ req, res, log, error }) => {
    const startTime = Date.now();

    log('Function execution started');

    try {
        const result = await processData(req.body);

        const duration = Date.now() - startTime;
        log(`Function completed in ${duration}ms`);

        return res.json({
            success: true,
            data: result,
            duration
        });
    } catch (err) {
        const duration = Date.now() - startTime;
        error(`Function failed after ${duration}ms: ${err.message}`);

        return res.json({
            success: false,
            error: err.message,
            duration
        }, 500);
    }
};
```

## 总结

Appwrite Functions 提供了：

- **多语言支持**: 12+ 运行时环境
- **灵活触发**: 事件、定时、HTTP 触发
- **自动扩展**: 按需扩展和收缩
- **完整监控**: 日志和执行跟踪
- **Git 集成**: 自动化部署流程
- **权限控制**: 细粒度的权限管理
- **环境变量**: 安全的配置管理
- **错误处理**: 重试和超时机制

适合构建：
- 自动化工作流
- 数据处理管道
- 第三方集成
- 定时任务
- 通知系统
- 数据验证
- 内容处理
