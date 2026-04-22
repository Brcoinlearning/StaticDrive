# Docs Index

当前文档目录按 Phase 组织，而不是按“写作时间”组织。

## 1. P1-MVP

- `docs/P1-MVP/01-before-execution/`
  P1 开始前的正式准备文档：需求、技术选型、架构、任务、测试契约。
- `docs/P1-MVP/02-after-execution/`
  P1 执行后的联调、演示、验收与结果文档。

重点入口：

- [20-architecture.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P1-MVP/01-before-execution/20-architecture.md)
- [20-tasks.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P1-MVP/01-before-execution/20-tasks.md)
- [mvp-integration-verification.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P1-MVP/02-after-execution/mvp-integration-verification.md)
- [MVP演示.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P1-MVP/02-after-execution/MVP演示.md)

## 2. P2-Stabilization

- `docs/P2-Stabilization/01-before-execution/`
  P2 稳定化阶段的范围、冻结结论、架构、任务和路线图。
- `docs/P2-Stabilization/02-after-execution/`
  P2 执行后的验证、诊断、冷启动与收口文档。

重点入口：

- [phase-2-architecture.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P2-Stabilization/01-before-execution/phase-2-architecture.md)
- [phase-2-tasks.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P2-Stabilization/01-before-execution/phase-2-tasks.md)
- [p2-t7-phase-2-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P2-Stabilization/02-after-execution/p2-t7-phase-2-closeout.md)

## 3. P3-Owner-Frontend

- `docs/P3-Owner-Frontend/01-before-execution/`
  P3 owner 产品化前端阶段的准备文档。
- `docs/P3-Owner-Frontend/02-after-execution/`
  P3 执行后的人工验收、结果记录与后续收口文档。

重点入口：

- [phase-3-architecture.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/01-before-execution/phase-3-architecture.md)
- [phase-3-tasks.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/01-before-execution/phase-3-tasks.md)
- [p3-t2-owner-frontend-manual-check.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/02-after-execution/p3-t2-owner-frontend-manual-check.md)
- [p3-t2-owner-frontend-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/02-after-execution/p3-t2-owner-frontend-closeout.md)
- [p3-t3-content-mutation-manual-check.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/02-after-execution/p3-t3-content-mutation-manual-check.md)
- [p3-t3-content-mutation-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/02-after-execution/p3-t3-content-mutation-closeout.md)
- [p3-t4-owner-credential-manual-check.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/02-after-execution/p3-t4-owner-credential-manual-check.md)
- [p3-t4-owner-credential-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/02-after-execution/p3-t4-owner-credential-closeout.md)
- [p3-t5-browser-e2e-manual-check.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/02-after-execution/p3-t5-browser-e2e-manual-check.md)
- [p3-t5-browser-e2e-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/02-after-execution/p3-t5-browser-e2e-closeout.md)
- [p3-t6-phase-3-operations-and-acceptance.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/02-after-execution/p3-t6-phase-3-operations-and-acceptance.md)
- [p3-t6-phase-3-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P3-Owner-Frontend/02-after-execution/p3-t6-phase-3-closeout.md)

## 4. P4-Deployment

- `docs/P4-Deployment/01-before-execution/`
  P4 部署准备阶段的部署策略、虚拟机部署与容器化落地文档。
- `docs/P4-Deployment/02-after-execution/`
  P4 执行后的 Docker 首启检查单、VM Compose 生产模板与部署收口文档。

建议按下面顺序阅读：

- 总体部署策略与路线：
  [vm-and-docker-deployment-guide.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/01-before-execution/vm-and-docker-deployment-guide.md)
- 新 VM 的标准生产模板：
  [vm-compose-production-template.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-compose-production-template.md)
- 实际上线时的最短操作清单：
  [vm-go-live-short-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-go-live-short-checklist.md)
- 本次 `ubu2404` 的真实运行与运维手册：
  [vm-ubu2404-ip-http-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/vm-ubu2404-ip-http-closeout.md)
- 本机 Docker 首启与初始化检查：
  [docker-first-start-checklist.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/docker-first-start-checklist.md)
- 本机 Docker 六项能力验收：
  [docker-six-capability-acceptance.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/docker-six-capability-acceptance.md)
- P4 阶段收口结论：
  [p4-docker-acceptance-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/P4-Deployment/02-after-execution/p4-docker-acceptance-closeout.md)

## 5. Reference

- `docs/_reference/`
  非阶段主链的补充说明与参考材料。
