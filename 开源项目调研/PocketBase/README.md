# PocketBase 项目文档总览

## 项目简介

PocketBase 是一个开源的后端即服务（BaaS）解决方案，使用 Go 语言开发。它提供了一个完整、可嵌入的后端系统，包含数据库、认证系统、实时订阅、文件存储和管理面板。

### 主要特点

- **单一可执行文件**: 整个后端打包在一个文件中
- **开箱即用**: 无需配置即可使用
- **高度可定制**: 支持通过 Go 代码和 JavaScript 进行扩展
- **内置管理面板**: 可视化数据管理界面
- **实时功能**: 支持实时订阅和数据更新
- **REST API**: 完整的 REST-ish API
- **多认证方式**: 密码、OAuth2、OTP 等
- **文件存储**: 内置文件管理，支持 S3

### 官方资源

- **官方网站**: https://pocketbase.io/
- **文档**: https://pocketbase.io/docs/
- **GitHub**: https://github.com/pocketbase/pocketbase
- **社区**: https://github.com/pocketbase/pocketbase/discussions

---

## 文档目录

本文档集包含以下五个主要部分：

### 1. API文档.md

详细介绍了 PocketBase 的 REST API，包括：

- **记录操作**: 创建、读取、更新、删除记录
- **用户认证**: 密码登录、OAuth2、令牌刷新
- **文件上传**: 单文件和多文件上传
- **实时订阅**: WebSocket 连接和事件订阅
- **过滤和排序**: 查询参数和表达式语法
- **批量操作**: 批量导入和导出
- **错误处理**: 错误响应格式和状态码
- **SDK 使用**: JavaScript 和 Dart SDK 示例

**关键文件**: `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/开源项目调研/PocketBase/API文档.md`

### 2. 文件上传.md

全面的文件上传和管理指南：

- **文件字段配置**: 字段类型和限制设置
- **上传方式**: 管理面板、JavaScript SDK、REST API
- **存储选项**: 本地存储和 AWS S3 集成
- **图片处理**: 自动缩略图生成
- **文件访问**: URL 生成和权限控制
- **文件删除**: 单文件和批量删除
- **安全验证**: 客户端和服务端验证
- **故障排除**: 常见问题和解决方案

**关键文件**: `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/开源项目调研/PocketBase/文件上传.md`

### 3. 用户认证.md

完整的用户认证系统文档：

- **密码认证**: 用户注册、登录、登出
- **OAuth2 集成**: 多种第三方登录支持
- **OTP 认证**: 一次性密码登录流程
- **邮箱验证**: 邮箱确认流程
- **密码重置**: 忘记密码处理
- **邮箱更改**: 邮箱地址更新
- **令牌管理**: Bearer Token 和 Cookie 认证
- **多因素认证**: TOTP 支持
- **权限管理**: API 规则和角色管理
- **实战示例**: React Hook 和完整登录流程

**关键文件**: `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/开源项目调研/PocketBase/用户认证.md`

### 4. 扩展机制.md

深入 PocketBase 的扩展能力：

- **Hooks 系统**: 生命周期事件和钩子
- **自定义路由**: 添加自定义 API 端点
- **Go Embedding**: 将 PocketBase 嵌入 Go 应用
- **JavaScript VM**: 使用 JS 编写业务逻辑
- **Migrations**: 数据库迁移管理
- **Cron Jobs**: 定时任务调度
- **插件开发**: 创建可重用插件
- **项目结构**: 扩展项目最佳实践
- **构建和部署**: 自定义 PocketBase 构建

**关键文件**: `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/开源项目调研/PocketBase/扩展机制.md`

### 5. 部署说明.md

从开发到生产的完整部署指南：

- **本地开发**: 安装和启动指南
- **生产部署**: Linux 服务器配置
- **容器化**: Docker 和 docker-compose
- **云平台**: Zeabur、Railway、Render 等
- **反向代理**: Nginx、Caddy、Apache 配置
- **SSL/HTTPS**: Let's Encrypt 和 Cloudflare
- **环境变量**: 配置管理
- **备份恢复**: 数据备份策略
- **性能优化**: 数据库和缓存优化
- **监控日志**: 健康检查和日志管理
- **安全配置**: 防火墙和访问控制
- **故障排除**: 常见问题解决

**关键文件**: `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/开源项目调研/PocketBase/部署说明.md`

---

## 快速开始

### 1. 安装 PocketBase

```bash
# 下载最新版本
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip
unzip pocketbase_0.22.0_linux_amd64.zip

# 启动服务器
./pocketbase serve
```

### 2. 访问管理面板

打开浏览器访问：`http://localhost:8090/_/`

### 3. 创建第一个集合

1. 登录管理面板
2. 点击 "New Collection"
3. 设置集合名称和字段
4. 保存并开始使用

### 4. 使用 API

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// 创建记录
const record = await pb.collection('posts').create({
  title: 'Hello PocketBase',
  content: 'My first post'
});

// 查询记录
const posts = await pb.collection('posts').getList(1, 20);
```

---

## 使用场景

### 适合的项目

1. **中小型 Web 应用**: 无需复杂后端的应用
2. **移动应用后端**: iOS/Android 应用 API
3. **单页应用**: React、Vue、Angular 应用的后端
4. **原型开发**: 快速构建和验证想法
5. **内部工具**: 企业内部管理系统
6. **个人项目**: 博客、作品集等
7. **SaaS MVP**: 最小可行产品后端

### 可能不适合的场景

1. **大规模高并发**: 超高流量应用
2. **复杂事务**: 需要复杂事务处理的系统
3. **特定数据库需求**: 必须使用 PostgreSQL/MySQL 等

---

## 技术栈

- **语言**: Go 1.21+
- **数据库**: SQLite (可扩展其他数据库)
- **Web 框架**: Echo
- **前端**: Vue 3 (管理面板)
- **实时**: WebSocket
- **认证**: JWT + Cookie
- **文件存储**: 本地文件系统 + S3

---

## 社区和生态系统

### 官方插件

- **migratecmd**: 迁移命令行工具
- **jsvm**: JavaScript 虚拟机
- **ghupdate**: GitHub 更新检查

### 第三方工具

- **pocketbase-admin-react**: React 管理面板
- **pocketbase-typegen**: TypeScript 类型生成
- **pocketbase-react**: React Hooks 集成

### 学习资源

- 官方文档: https://pocketbase.io/docs/
- GitHub Discussions: https://github.com/pocketbase/pocketbase/discussions
- YouTube 教程
- 社区博客文章

---

## 许可证

PocketBase 采用 **MIT 许可证**，可以自由用于商业和个人项目。

---

## 版本信息

- **当前版本**: v0.22.0
- **发布周期**: 不定期发布
- **更新方式**: GitHub Releases

---

## 获取帮助

- **文档**: https://pocketbase.io/docs/
- **GitHub Issues**: https://github.com/pocketbase/pocketbase/issues
- **Discussions**: https://github.com/pocketbase/pocketbase/discussions
- **Discord**: PocketBase 社区服务器
- **Twitter**: @pocketbase

---

## 下一步

1. 阅读 [API文档.md](./API文档.md) 了解 API 使用
2. 查看 [文件上传.md](./文件上传.md) 学习文件管理
3. 学习 [用户认证.md](./用户认证.md) 实现认证功能
4. 探索 [扩展机制.md](./扩展机制.md) 定制您的应用
5. 参考 [部署说明.md](./部署说明.md) 部署到生产环境

---

**文档创建时间**: 2026-04-16
**文档位置**: `/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/开源项目调研/PocketBase/`

**注意事项**: 本文档基于 PocketBase v0.22.0 版本，部分功能可能在不同版本中有所不同。建议结合官方文档一起使用。
