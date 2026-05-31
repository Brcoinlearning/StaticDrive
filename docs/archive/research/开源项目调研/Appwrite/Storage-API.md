# Appwrite Storage API 文档

## 概述

Appwrite Storage 提供了完整的文件上传、下载、管理和预览功能。支持多种文件类型，提供细粒度的权限控制，并集成了文件转换、压缩和CDN等功能。

## 基本概念

### 存储层级结构

```
Project (项目)
  └── Bucket (存储桶)
      └── File (文件)
          └── File Metadata (文件元数据)
```

### 文件属性

每个文件包含：

- **$id**: 文件唯一标识符
- **bucketId**: 所属存储桶ID
- **$createdAt**: 创建时间
- **$updatedAt**: 更新时间
- **name**: 文件名
- **size**: 文件大小 (字节)
- **mimeType**: MIME类型
- **$permissions**: 权限设置

## API 端点

### Bucket 操作

#### 1. 列出存储桶

```http
GET /storage/buckets
```

**响应示例：**
```json
{
  "total": 2,
  "buckets": [
    {
      "$id": "images",
      "name": "Images",
      "$createdAt": "2024-01-01T00:00:00.000Z",
      "$updatedAt": "2024-01-01T00:00:00.000Z",
      "enabled": true,
      "maximumFileSize": 10000000,
      "allowedFileExtensions": ["jpg", "png", "gif"],
      "compression": "none",
      "encryption": true,
      "antivirus": false
    }
  ]
}
```

#### 2. 创建存储桶

```http
POST /storage/buckets
```

**请求体：**
```json
{
  "bucketId": "images",
  "name": "Images",
  "enabled": true,
  "maximumFileSize": 10000000,
  "allowedFileExtensions": ["jpg", "png", "gif", "webp"],
  "compression": "gzip",
  "encryption": true,
  "antivirus": false,
  "fileSecurity": true,
  "permissions": [
    "read(\"any\")"
  ]
}
```

**参数说明：**

- `bucketId`: 存储桶唯一标识 (1-36字符)
- `name`: 存储桶名称
- `enabled`: 是否启用
- `maximumFileSize`: 最大文件大小 (字节)
- `allowedFileExtensions`: 允许的文件扩展名
- `compression`: 压缩选项 ("none", "gzip")
- `encryption`: 是否加密
- `antivirus`: 是否启用病毒扫描
- `fileSecurity`: 是否启用文件级权限
- `permissions`: 存储桶级权限

#### 3. 获取存储桶

```http
GET /storage/buckets/{bucketId}
```

#### 4. 更新存储桶

```http
PUT /storage/buckets/{bucketId}
```

**请求体：**
```json
{
  "name": "Updated Bucket Name",
  "enabled": true,
  "maximumFileSize": 20000000,
  "allowedFileExtensions": ["jpg", "png", "gif", "webp", "svg"],
  "compression": "gzip",
  "encryption": true,
  "antivirus": true,
  "fileSecurity": true,
  "permissions": [
    "read(\"any\")",
    "write(\"role:member\")"
  ]
}
```

#### 5. 删除存储桶

```http
DELETE /storage/buckets/{bucketId}
```

### 文件操作

#### 1. 列出文件

```http
GET /storage/buckets/{bucketId}/files
```

**查询参数：**

```http
GET /storage/buckets/{bucketId}/files?search=file-name&limit=25&offset=0&orderDesc[]=$createdAt
```

**响应示例：**
```json
{
  "total": 1,
  "files": [
    {
      "$id": "file123",
      "bucketId": "images",
      "$createdAt": "2024-01-01T00:00:00.000Z",
      "$updatedAt": "2024-01-01T00:00:00.000Z",
      "$permissions": {
        "read": ["role:all"],
        "write": ["user:uploader"]
      },
      "name": "profile.jpg",
      "size": 1024000,
      "mimeType": "image/jpeg",
      "chunksTotal": 1,
      "chunksUploaded": 1
    }
  ]
}
```

#### 2. 创建文件 (上传)

```http
POST /storage/buckets/{bucketId}/files
```

**请求类型：** `multipart/form-data`

**表单字段：**

- `file`: 文件内容 (必需)
- `fileId`: 自定义文件ID (可选)
- `name`: 文件名 (可选)
- `permissions[]`: 权限数组 (可选)

**示例 (curl)：**
```bash
curl -X POST \
  https://cloud.appwrite.io/v1/storage/buckets/images/files \
  -H 'Content-Type: multipart/form-data' \
  -H 'X-Appwrite-Response-Format: v1' \
  -H 'X-Appwrite-Project: YOUR_PROJECT_ID' \
  -H 'X-Appwrite-Key: YOUR_API_KEY' \
  -F 'file=@/path/to/file.jpg' \
  -F 'fileId=unique-file-id' \
  -F 'permissions[]=read("role:all")' \
  -F 'permissions[]=write("user:uploader")'
```

**响应示例：**
```json
{
  "$id": "unique-file-id",
  "bucketId": "images",
  "$createdAt": "2024-01-01T00:00:00.000Z",
  "$updatedAt": "2024-01-01T00:00:00.000Z",
  "$permissions": {
    "read": ["role:all"],
    "write": ["user:uploader"]
  },
  "name": "file.jpg",
  "size": 1024000,
  "mimeType": "image/jpeg",
  "chunksTotal": 1,
  "chunksUploaded": 1
}
```

#### 3. 获取文件

```http
GET /storage/buckets/{bucketId}/files/{fileId}
```

#### 4. 下载文件

```http
GET /storage/buckets/{bucketId}/files/{fileId}/download
```

**重定向到：**
```
https://cloud.appwrite.io/v1/storage/buckets/{bucketId}/files/{fileId}/view?project=YOUR_PROJECT_ID
```

#### 5. 文件预览

```http
GET /storage/buckets/{bucketId}/files/{fileId}/preview
```

**查询参数：**

- `width`: 图像宽度 (仅图像)
- `height`: 图像高度 (仅图像)
- `quality`: 图像质量 0-100 (仅图像)
- `background`: 背景颜色 (仅图像)
- `output`: 输出格式 (仅图像)

**示例：**
```http
GET /storage/buckets/images/files/file123/preview?width=300&height=300&quality=80&output=webp
```

#### 6. 文件查看

```http
GET /storage/buckets/{bucketId}/files/{fileId}/view
```

#### 7. 更新文件

```http
PUT /storage/buckets/{bucketId}/files/{fileId}
```

**请求体：**
```json
{
  "name": "updated-filename.jpg",
  "permissions": {
    "read": ["role:all"],
    "write": ["user:uploader"]
  }
}
```

#### 8. 删除文件

```http
DELETE /storage/buckets/{bucketId}/files/{fileId}
```

## 分块上传

对于大文件，Appwrite 支持分块上传：

### 1. 创建分块上传

```http
POST /storage/buckets/{bucketId}/files/chunks
```

**请求体：**
```json
{
  "fileId": "unique-chunk-id",
  "name": "large-file.zip",
  "size": 104857600
}
```

**响应示例：**
```json
{
  "$id": "unique-chunk-id",
  "bucketId": "files",
  "$createdAt": "2024-01-01T00:00:00.000Z",
  "$updatedAt": "2024-01-01T00:00:00.000Z",
  "name": "large-file.zip",
  "size": 104857600,
  "mimeType": "application/zip",
  "chunksTotal": 100,
  "chunksUploaded": 0
}
```

### 2. 上传分块

```http
POST /storage/buckets/{bucketId}/uploads/{uploadId}/chunks/{chunkIndex}
```

**请求类型：** `multipart/form-data`

**表单字段：**

- `chunk`: 分块内容

### 3. 完成上传

```http
POST /storage/buckets/{bucketId}/uploads/{uploadId}/complete
```

**请求体：**
```json
{
  "name": "final-filename.zip",
  "permissions": {
    "read": ["role:all"],
    "write": ["user:uploader"]
  }
}
```

### 4. 取消上传

```http
DELETE /storage/buckets/{bucketId}/uploads/{uploadId}
```

## 文件处理

### 图像转换

Appwrite 支持实时图像转换：

**尺寸调整：**
```
/preview?width=800&height=600
```

**质量调整：**
```
/preview?quality=85
```

**格式转换：**
```
/preview?output=webp
```

**裁剪：**
```
/preview?width=400&height=400&gravity=center
```

**组合使用：**
```
/preview?width=800&height=600&quality=85&output=webp&background=#ffffff
```

### 视频预览

```http
GET /storage/buckets/videos/files/{fileId}/preview
```

支持的格式：
- MP4
- WebM
- MOV

## 权限系统

### 权限类型

1. **read**: 读取文件
2. **write**: 修改/删除文件

### 权限角色

1. **role:all**: 所有用户
2. **role:guest**: 未登录用户
3. **role:member**: 已登录用户
4. **user:{userId}**: 特定用户
5. **team:{teamId}**: 团队成员

### 权限示例

**公开文件：**
```json
{
  "read": ["role:all"],
  "write": ["user:owner"]
}
```

**私有文件：**
```json
{
  "read": ["user:owner"],
  "write": ["user:owner"]
}
```

**团队文件：**
```json
{
  "read": ["team:team123"],
  "write": ["team:team123", "user:admin"]
}
```

## CDN 集成

Appwrite 支持自定义CDN加速：

### 配置CDN

```javascript
// 在客户端SDK中设置CDN端点
const client = new Client()
  .setEndpoint('https://cdn.example.com')
  .setProject('YOUR_PROJECT_ID');
```

### CDN 优势

1. **全球加速**: 就近访问
2. **降低成本**: 减少带宽费用
3. **提高性能**: 更快的下载速度
4. **缓存优化**: 智能缓存策略

## 客户端 SDK 使用

### Server SDK (Node.js)

```javascript
const { Client, Storage, ID } = require('node-appwrite');

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('YOUR_PROJECT_ID')
  .setKey('YOUR_API_KEY');

const storage = new Storage(client);

// 创建存储桶
await storage.createBucket(
  'images',
  'Images',
  ['read("any")'],
  true, // enabled
  10000000, // maximumFileSize
  ['jpg', 'png', 'gif'],
  true // encryption
);

// 上传文件
const file = await storage.createFile(
  'images',
  ID.unique(),
  InputFile.fromPath('/path/to/file.jpg')
);

// 列出文件
const files = await storage.listFiles(
  'images',
  [], // queries
  25  // limit
);

// 获取文件预览URL
const previewUrl = storage.getFilePreview(
  'images',
  'file123',
  800, // width
  600, // height
  85,  // quality
  'center', // gravity
  'webp', // output
  '#ffffff' // background
);

// 更新文件
await storage.updateFile(
  'images',
  'file123',
  'new-filename.jpg',
  ['read("role:all")']
);

// 删除文件
await storage.deleteFile(
  'images',
  'file123'
);
```

### Web SDK

```javascript
import { Client, Storage, ID } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('YOUR_PROJECT_ID');

const storage = new Storage(client);

// 上传文件
const file = await storage.createFile(
  'images',
  ID.unique(),
  document.getElementById('file-input').files[0]
);

// 上传并设置权限
const file = await storage.createFile(
  'images',
  ID.unique(),
  fileData,
  ['read("role:all")', 'write("user:' + userId + '")']
);

// 下载文件
storage.getFileDownload('images', 'file123')
  .then(response => {
    const url = response.href;
    window.open(url, '_blank');
  });

// 获取文件预览
const previewUrl = storage.getFilePreview('images', 'file123', {
  width: 400,
  height: 400,
  quality: 80
});

// 列出文件
const files = await storage.listFiles('images');

// 删除文件
await storage.deleteFile('images', 'file123');

// 实时订阅
const unsubscribe = client.subscribe(
  `files`,
  (response) => {
    console.log('File changed:', response.payload);
  }
);
```

### Android SDK

```java
import io.appwrite.Client;
import io.appwrite.services.Storage;
import io.appwrite.models.File;
import io.appwrite.enums.OutputFormat;

Client client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("YOUR_PROJECT_ID");

Storage storage = new Storage(client);

// 上传文件
File file = storage.createFile(
    "images",
    ID.unique(),
    new InputFile(
        new File("/path/to/file.jpg"),
        "image.jpg"
    )
);

// 获取预览URL
String previewUrl = storage.getFilePreview(
    "images",
    "file123",
    800,
    600,
    85,
    OutputFormat.WEBP,
    Gravity.CENTER,
    0,
    "#ffffff"
);

// 删除文件
storage.deleteFile("images", "file123");
```

## 最佳实践

### 1. 存储桶设计

**图像存储桶：**
```javascript
{
  bucketId: 'images',
  name: 'Images',
  allowedFileExtensions: ['jpg', 'png', 'gif', 'webp'],
  maximumFileSize: 10000000, // 10MB
  compression: 'gzip',
  encryption: true
}
```

**文档存储桶：**
```javascript
{
  bucketId: 'documents',
  name: 'Documents',
  allowedFileExtensions: ['pdf', 'doc', 'docx', 'txt'],
  maximumFileSize: 50000000, // 50MB
  encryption: true,
  antivirus: true
}
```

**视频存储桶：**
```javascript
{
  bucketId: 'videos',
  name: 'Videos',
  allowedFileExtensions: ['mp4', 'webm', 'mov'],
  maximumFileSize: 500000000, // 500MB
  encryption: true
}
```

### 2. 文件命名规范

**使用时间戳：**
```javascript
const fileId = `${userId}_${Date.now()}`;
```

**使用UUID：**
```javascript
const fileId = ID.unique();
```

**使用描述性名称：**
```javascript
const fileId = `${type}_${category}_${timestamp}`;
```

### 3. 安全性配置

**启用文件级权限：**
```javascript
await storage.createBucket(
  'secure-files',
  'Secure Files',
  [],
  true,
  10000000,
  ['pdf', 'doc'],
  true,
  true,
  true // fileSecurity
);
```

**设置上传限制：**
```javascript
{
  maximumFileSize: 10485760, // 10MB
  allowedFileExtensions: ['jpg', 'png', 'pdf']
}
```

### 4. 性能优化

**使用CDN：**
```javascript
const client = new Client()
  .setEndpoint('https://cdn.example.com')
  .setProject('YOUR_PROJECT_ID');
```

**启用压缩：**
```javascript
{
  compression: 'gzip'
}
```

**优化图像：**
```javascript
const previewUrl = storage.getFilePreview(
  'images',
  'file123',
  800,
  600,
  75,
  'center',
  'webp'
);
```

### 5. 错误处理

```javascript
try {
  const file = await storage.createFile(
    'images',
    ID.unique(),
    fileData
  );
} catch (error) {
  switch (error.code) {
    case 400:
      console.error('Invalid file:', error.message);
      break;
    case 401:
      console.error('Unauthorized');
      break;
    case 413:
      console.error('File too large');
      break;
    case 415:
      console.error('Unsupported file type');
      break;
    default:
      console.error('Upload failed:', error.message);
  }
}
```

## 高级功能

### 1. S3 集成

Appwrite 可以配置为使用 S3 作为存储后端：

**环境变量配置：**
```bash
_APP_STORAGE_DEVICE=S3
_APP_STORAGE_S3_ACCESS_KEY=your-access-key
_APP_STORAGE_S3_SECRET=your-secret
_APP_STORAGE_S3_BUCKET=your-bucket
_APP_STORAGE_S3_REGION=us-east-1
_APP_STORAGE_S3_ENDPOINT=https://s3.amazonaws.com
```

### 2. 文件加密

**启用存储桶加密：**
```javascript
{
  encryption: true
}
```

加密特点：
- AES-256 加密
- 透明加密/解密
- 安全的密钥管理

### 3. 病毒扫描

**启用病毒扫描：**
```javascript
{
  antivirus: true
}
```

需要配置 ClamAV 或其他杀毒软件。

### 4. 文件版本控制

通过文件ID和更新时间实现版本控制：
```javascript
const newVersion = await storage.createFile(
  'documents',
  `${docId}_v${version}`,
  fileData
);
```

## 监控和日志

### 文件操作日志

```javascript
// 监控文件上传
storage.listFiles('bucket')
  .then(files => {
    console.log('Total files:', files.total);
    console.log('Total size:', files.files.reduce((sum, file) => sum + file.size, 0));
  });
```

### 存储使用统计

```javascript
// 计算存储使用量
async function getStorageUsage(bucketId) {
  const files = await storage.listFiles(bucketId, [], 100);
  return {
    count: files.total,
    size: files.files.reduce((sum, file) => sum + file.size, 0)
  };
}
```

## 总结

Appwrite Storage API 提供了：

- **灵活的文件存储**: 支持多种文件类型和大小
- **精细权限控制**: 存储桶和文件级权限
- **图像处理**: 实时转换和优化
- **分块上传**: 支持大文件上传
- **CDN集成**: 全球加速访问
- **安全加密**: 数据加密存储
- **多SDK支持**: 客户端和服务器SDK
- **实时订阅**: 文件变更通知

适合构建需要文件管理的各种应用，包括：
- 图片分享应用
- 文档管理系统
- 媒体库
- 用户头像管理
- 附件存储
