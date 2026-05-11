# Docs Index

本文档是当前仓库 `docs/` 目录的总入口，优先把“长期有效、反复会用到”的文档放在前面，把阶段性过程文档放在后面。

## 1. 通用运行与运维

- [local-runtime-handbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/local-runtime-handbook.md)：本机运行手册，覆盖本地启动、重启、常用地址、常用检查命令。
- [vm-runtime-handbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/vm-runtime-handbook.md)：虚拟机运行手册，覆盖 VM 上的代码位置、Compose/Nginx/systemd 常用操作、常用检查命令。
- [code-change-sync-and-restart.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/code-change-sync-and-restart.md)：代码变更后的同步、重启与验证规则，解决“改了哪里、要不要重启什么、VM 怎么同步”的日常问题。
- [common-scripts-and-copyable-commands.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/common-scripts-and-copyable-commands.md)：常用脚本与可直接复制的命令速查，适合日常维护时快速拿命令执行。
- [routes-and-urls-cheatsheet.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/routes-and-urls-cheatsheet.md)：常用接口、页面地址与典型入口速查表。
- [data-and-storage-operations.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/data-and-storage-operations.md)：数据目录、文件目录、清理、备份与恢复说明。
- [release-and-commit-playbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/release-and-commit-playbook.md)：本地改动、验证、提交流程、同步到 VM 与最小发布验收清单。
- [troubleshooting-handbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/troubleshooting-handbook.md)：常见故障现象与固定排查顺序。

## 2. 核心理解文档

- [core-business-flow.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/core-business-flow.md)：核心业务链路图，说明业务壳、PocketBase、本地文件系统、网页层的职责关系。
- [core-business-flow-for-non-technical-readers.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/core-business-flow-for-non-technical-readers.md)：核心业务链路图白话版，面向技术小白解释每条链路为什么这样设计。

## 3. 阶段性正式文档

- `docs/P1-MVP/`：MVP 阶段的需求、技术选型、架构、任务拆解、测试契约、联调与验收文档。
- `docs/P2-Stabilization/`：稳定化阶段的范围、诊断、冷启动与收口文档。
- `docs/P3-Owner-Frontend/`：owner 网页层产品化相关的准备文档与手工检查文档。
- `docs/P4-Deployment/`：部署、Docker、虚拟机、Nginx、systemd、上线与验收相关文档。
- `docs/P5-String-Resource-Access/`：P5 内容对象边界 — `bodyFormat + Markdown` 统一契约、fixture 回归测试、demo 展示与收口文档。

## 4. 使用建议

如果你当前的目标是：

- 想在本机把服务跑起来：先看 [local-runtime-handbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/local-runtime-handbook.md)
- 想维护已经在 VM 上跑起来的服务：先看 [vm-runtime-handbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/vm-runtime-handbook.md)
- 想知道改代码以后本机和 VM 各要做什么：先看 [code-change-sync-and-restart.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/code-change-sync-and-restart.md)
- 想理解系统为什么这么分层：看 [core-business-flow.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/core-business-flow.md)
