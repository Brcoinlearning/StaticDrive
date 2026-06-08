# ACR Registry Deployment

本文档用于没有 miniPC 终端权限、只能使用 1Panel 页面时的部署方式。

核心思路：

1. 在本机或 CI 里构建镜像。
2. 推送到阿里云 ACR 个人版。
3. 在 1Panel 编排中使用远程 `image:` 拉取镜像运行。

这与 `docker-compose.1panel.yml` 的本地 `build:` 模式不同，适合只有 1Panel 页面权限的场景。

## 1. 当前 ACR 信息

当前仓库使用：

```text
Registry: crpi-egl8fqea65tii5cz.cn-beijing.personal.cr.aliyuncs.com
Namespace: static-drive
App repo: static-content-service-app
PocketBase repo: static-content-service-pocketbase
Default tag: 2026.06.08
```

完整镜像地址：

```text
crpi-egl8fqea65tii5cz.cn-beijing.personal.cr.aliyuncs.com/static-drive/static-content-service-app:2026.06.08
crpi-egl8fqea65tii5cz.cn-beijing.personal.cr.aliyuncs.com/static-drive/static-content-service-pocketbase:2026.06.08
```

## 2. 本机推送镜像

先登录 ACR：

```bash
docker login --username=Brcoinlearning crpi-egl8fqea65tii5cz.cn-beijing.personal.cr.aliyuncs.com
```

密码使用 ACR 访问凭证页面设置的密码，不是阿里云网页登录密码。

然后推送：

```bash
cd /Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理
bash ./scripts/push_acr_images.sh
```

默认构建平台为：

```text
linux/amd64
```

如果确认 miniPC 是 ARM64，可改用：

```bash
STATIC_CONTENT_IMAGE_PLATFORM=linux/arm64 bash ./scripts/push_acr_images.sh
```

## 3. 1Panel 编排

在 1Panel 中进入：

```text
容器 -> 编排 -> 创建
```

选择：

```text
来源：编辑
文件夹：static-content-service
```

Compose 内容使用：

```text
docker-compose.registry.yml
```

环境变量框粘贴 `.env.registry.example` 的内容，并至少修改：

```env
PB_ADMIN_EMAIL=你的 PocketBase 管理员邮箱
PB_ADMIN_PASSWORD=你的强密码
PUBLIC_BASE_URL=https://你的域名
```

不要把 ACR 密码写进环境变量。

## 4. 1Panel 镜像仓库凭证

因为两个 ACR 仓库是私有仓库，1Panel 需要能拉取镜像。

在 1Panel 中进入：

```text
容器 -> 仓库
```

添加仓库：

```text
仓库地址：crpi-egl8fqea65tii5cz.cn-beijing.personal.cr.aliyuncs.com
用户名：Brcoinlearning
密码：ACR 访问凭证密码
```

## 5. 首次启动后

启动编排后检查：

```bash
curl http://127.0.0.1:8090/api/health
curl http://127.0.0.1:8787/api/health
```

在 1Panel 网站中创建反向代理：

```text
代理目标：http://127.0.0.1:8787
```

PocketBase 的 `8090` 不要直接暴露到公网。

## 6. 升级

后续升级时：

1. 改代码。
2. 更新 `STATIC_CONTENT_IMAGE_TAG`。
3. 重新执行 `scripts/push_acr_images.sh`。
4. 在 1Panel 编排环境变量中同步新 tag 或新 image 地址。
5. 重新拉取并启动编排。
