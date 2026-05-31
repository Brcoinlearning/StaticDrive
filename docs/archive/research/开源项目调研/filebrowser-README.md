# Filebrowser - Web File Browser

## 项目简介

File Browser 提供了一个在指定目录内的文件管理界面,可以用于上传、删除、预览和编辑您的文件。这是一种"创建你自己的云"类型的软件,您只需将其安装在服务器上,指定一个路径,就可以通过一个漂亮的网页界面访问您的文件。

![Filebrowser Banner](https://raw.githubusercontent.com/filebrowser/filebrowser/master/branding/banner.png)

## 项目状态

本项目是一个成熟的产品,已实现其目标:成为一个可以在任何地方由任何人运行的单个二进制Web文件浏览器。这意味着File Browser目前处于**仅维护**模式。请注意:

- 回复可能需要一些时间,请耐心等待
- Issues仅用于跟踪错误,不相关的问题将被转换为讨论
- 优先级是处理问题、解决安全问题以及审查用于修复错误的Pull Request
- 不计划新功能,新功能的Pull Request不保证会被审查

## 项目统计

- **Stars**: 34.3k
- **Forks**: 3.8k
- **Watchers**: 329
- **最新版本**: v2.63.2 (2026年4月11日)

## 技术栈

- **Go**: 42.3%
- **Vue**: 37.5%
- **TypeScript**: 10.3%
- **CSS**: 7.7%
- **HTML**: 1.4%
- **Shell**: 0.3%
- **其他**: 0.5%

## 主要功能

根据项目描述,File Browser提供以下核心功能:

1. **文件浏览** - 在指定目录内浏览文件和文件夹
2. **文件上传** - 通过网页界面上传文件
3. **文件删除** - 删除不需要的文件
4. **文件预览** - 在线预览各种文件类型
5. **文件编辑** - 直接在网页中编辑文件

## 文档

关于如何安装、配置和参与此项目的文档托管在 [filebrowser.org](https://filebrowser.org)。

## 贡献

随时欢迎贡献。要开始参与此项目,请先阅读贡献指南。

## 许可证

Apache License 2.0 © File Browser Contributors

## 项目结构

主要目录包括:
- `auth/` - 认证相关代码
- `files/` - 文件处理
- `frontend/` - 前端代码(Vue)
- `http/` - HTTP服务器
- `users/` - 用户管理
- `settings/` - 设置管理
- `share/` - 分享功能
- `storage/` - 存储相关
- `docker/` - Docker相关文件

## 相关链接

- GitHub仓库: https://github.com/filebrowser/filebrowser
- 官方网站: https://filebrowser.org
- Docker镜像支持
- CI/CD集成

## 标签

go, vue, material-design, file-sharing, self-hosted, file-browser, file-manager

---

*此文档根据filebrowser GitHub仓库README内容整理,最后更新时间: 2026年4月16日*
