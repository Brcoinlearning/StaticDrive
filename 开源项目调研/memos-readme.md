# Memos

## 项目概述
**Memos** 是一个开源、自托管的笔记服务。你的想法，你的数据，你的控制 — 无跟踪，无广告，无订阅费用。

![Memos](https://raw.githubusercontent.com/usememos/.github/refs/heads/main/assets/logo-rounded.png)

## 项目徽章

| 徽章 | 说明 |
|------|------|
| [![Home](https://img.shields.io/badge/🏠-usememos.com-blue)](https://usememos.com) | 官网 |
| [![Live Demo](https://img.shields.io/badge/✨-Try%20Demo-orange)](https://demo.usememos.com/) | 在线演示 |
| [![Docs](https://img.shields.io/badge/📚-Documentation-green)](https://usememos.com/docs) | 文档 |
| [![Discord](https://img.shields.io/badge/💬-Discord-5865f2)](https://discord.gg/tfPJa4UmAv) | Discord 社区 |
| [![Docker Pulls](https://img.shields.io/docker/pulls/neosmemo/memos)](https://hub.docker.com/r/neosmemo/memos) | Docker 下载量 |

## 为什么选择 Memos 而不是云服务？

| 特性 | Memos | 云服务 |
|------|-------|--------|
| **隐私** | ✅ 自托管，零遥测 | ❌ 你的数据在他们的服务器上 |
| **成本** | ✅ 永久免费，MIT 许可 | ❌ 订阅费用 |
| **性能** | ✅ 即时加载，无延迟 | ⚠️ 依赖网络 |
| **所有权** | ✅ 完全控制和导出 | ❌ 供应商锁定 |
| **API 访问** | ✅ 完整的 REST + gRPC API | ⚠️ 受限或付费 |
| **定制** | ✅ 开源，可 Fork | ❌ 封闭生态系统 |

## 核心特性

### 🔒 隐私优先架构
- 在你的基础设施上自托管，零遥测
- 完整的数据所有权和导出能力
- 无跟踪、无广告、无供应商锁定

### 📝 Markdown 原生
- 完整的 Markdown 支持
- 纯文本存储 — 随处携带你的数据

### ⚡ 极速性能
- Go 后端 + React 前端构建
- 针对任何规模进行了性能优化

### 🐳 简单部署
- 一行 Docker 安装
- 支持 SQLite、MySQL 和 PostgreSQL

### 🔗 开发者友好
- 完整的 REST 和 gRPC API
- 易于集成到现有工作流

### 🎨 精美界面
- 简洁、极简设计，支持深色模式
- 移动端响应式布局

## 快速开始

### Docker（推荐）
```bash
docker run -d \
  --name memos \
  -p 5230:5230 \
  -v ~/.memos:/var/opt/memos \
  neosmemo/memos:stable
```

打开 `http://localhost:5230` 开始写作！

### 在线演示
[https://demo.usememos.com/](https://demo.usememos.com/)

### 其他安装方式
- **Docker Compose** - 推荐用于生产环境部署
- **预构建二进制文件** - 支持 Linux、macOS 和 Windows
- **Kubernetes** - 提供 Helm charts 和 manifests
- **从源代码构建** - 用于开发和定制

详细说明请查看[安装指南](https://usememos.com/docs/installation)。

## 贡献

我们欢迎各种形式的贡献！无论是修复 bug、添加功能、改进文档还是帮助翻译 — 每一份贡献都很重要。

**贡献方式：**
- 🐛 [报告 Bug](https://github.com/usememos/memos/issues/new?template=bug_report.md)
- 💡 [建议功能](https://github.com/usememos/memos/issues/new?template=feature_request.md)
- 🔧 [提交 Pull Request](https://github.com/usememos/memos/pulls)
- 📖 [改进文档](https://github.com/usememos/memos/tree/main/docs)
- 🌍 [帮助翻译](https://github.com/usememos/memos/tree/main/web/src/locales)

## 赞助商

### 💎 主要赞助商
- **Warp** — AI 驱动的终端，专为速度和协作而构建
- **TestMu AI** — 世界首个全栈 Agentic AI 质量工程平台

喜欢 Memos？[在 GitHub 上赞助我们](https://github.com/sponsors/usememos) 帮助项目持续成长！

## 技术栈
- **后端**: Go
- **前端**: React
- **数据库**: SQLite / MySQL / PostgreSQL
- **API**: REST + gRPC

## 许可证

Memos 是基于 [MIT License](LICENSE) 的开源软件。

## 隐私政策

Memos 以隐私为核心原则构建。作为自托管应用，你的所有数据都留在你的基础设施上。没有遥测、没有跟踪、没有数据收集。

详情请查看我们的[隐私政策](https://usememos.com/privacy)。

## 项目链接

- **官网**: https://usememos.com
- **文档**: https://usememos.com/docs
- **演示**: https://demo.usememos.com
- **Discord**: https://discord.gg/tfPJa4UmAv
- **X/Twitter**: https://x.com/usememos
- **GitHub**: https://github.com/usememos/memos

---

<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>
