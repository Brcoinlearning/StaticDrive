# Halo

## 项目概述
**Halo** [ˈheɪloʊ]，强大易用的开源建站工具。

从个人博客、知识库，到企业官网、在线商城，Halo 都能助您轻松实现，一站式满足您的多样化建站需求。

## 项目状态

| 指标 | 数值 |
|------|------|
| GitHub Releases | ![GitHub release](https://img.shields.io/github/release/halo-dev/halo.svg) |
| Docker Pulls | ![Docker pulls](https://img.shields.io/docker/pulls/halohub/halo) |
| 最后提交 | ![GitHub last commit](https://img.shields.io/github/last-commit/halo-dev/halo) |
| 工作流状态 | ![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/halo-dev/halo/halo.yaml) |
| 代码覆盖率 | ![Codecov](https://img.shields.io/codecov/c/github/halo-dev/halo) |

## 快速开始

### Docker 快速启动
```bash
docker run -d --name halo -p 8090:8090 -v ~/.halo2:/root/.halo2 halohub/halo:2.23
```

### 在线体验
- **环境地址**: https://demo.halocms.site
- **后台地址**: https://demo.halocms.site/console
- **用户名**: `demo`
- **密码**: `P@ssw0rd123..`

### 一键体验环境
- [Gitpod](https://gitpod.io/#https://github.com/halo-sigs/gitpod-demo)
- [ClawCloud Run](https://template.us-west-1.run.claw.cloud/deploy?templateName=halo)

**推荐**: 使用开源 Linux 服务器运维管理面板 [1Panel](https://github.com/1Panel-dev/1Panel) 进行部署（[查看文档](https://docs.halo.run/getting-started/install/1panel)），轻松搞定反向代理、SSL 证书及升级备份任务。

更多部署方式请[查看文档](https://docs.halo.run/category/%E5%AE%89%E8%A3%85%E6%8C%87%E5%8D%97)。

## 版本对比

### Halo 社区版
- **协议**: GPL-v3.0 开源免费
- **适用**: 个人开发者、技术爱好者、开源项目
- **功能**:
  - 零成本搭建博客、作品集、技术文档站
  - 超过 100 款免费主题和插件

### Halo 专业版
在社区版基础上，集成 10+ 高价值功能：
- ✅ 移动端 APP：随时随地管理内容
- ✅ AI 智能建站：快速生成专业站点
- ✅ 手机号验证登录：提升安全与用户体验
- ✅ 全站私有化部署：保障数据主权
- ✅ 付费主题/插件市场：专享精品主题和 SEO 优化、付费阅读、AI 助手等 10 款付费插件

### Halo 商业版
在专业版基础上，集成在线商城重磅功能：
- ✅ 一体化在线商城：商品管理、订单处理、支付对接全流程
- ✅ 为中国商家定制：无缝集成微信支付、支付宝等本土生态
- ✅ 品牌官网 + CMS + 线上店铺一站式落地，助力生意高效增长

> 三个版本的详细对比请参考[版本对比](https://www.lxware.cn/halo)。

## 生态系统

可访问以下位置查看适用于 Halo 2.x 的主题和插件：
- [官方应用市场](https://www.halo.run/store/apps)
- [awesome-halo 仓库](https://github.com/halo-sigs/awesome-halo)

## 技术栈
- **语言**: Java
- **框架**: Spring Boot
- **数据库**: 支持多种数据库（H2、MySQL、PostgreSQL 等）

## 许可证

[![license](https://img.shields.io/github/license/halo-dev/halo)](https://github.com/halo-dev/halo/blob/master/LICENSE)

Halo 使用 **GPL-v3.0** 协议开源，请遵守开源协议。

## 贡献

参考 [CONTRIBUTING](https://github.com/halo-dev/halo/blob/main/CONTRIBUTING.md)。

## 项目链接

- **官网**: https://www.halo.run
- **文档**: https://docs.halo.run
- **社区**: https://bbs.halo.run
- **Gitee**: https://gitee.com/halo-dev
- **Telegram**: https://t.me/halo_dev
- **GitHub**: https://github.com/halo-dev/halo
