# Docker Six Capability Acceptance

本文档用于在当前已经跑通的 Docker 部署上，完成六个核心能力的首轮业务验收。

文档定位：

- 这是 Docker 形态下的业务验收文档，不是 VM 运维文档。
- 如果你要看 P4 收口结论，请看 [p4-docker-acceptance-closeout.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/archive/phases/P4-Deployment/02-after-execution/p4-docker-acceptance-closeout.md)。

## 1. 适用前提

你已经完成：

1. Docker stack 已启动且 `app` / `pocketbase` 都是 `healthy`
2. 已能访问：
   - `http://127.0.0.1:8090/_/`
   - `http://127.0.0.1:8787/api/health`
3. 已在 PocketBase 中创建管理员账号
4. 已把管理员账号回写到 `.env.docker.example`
5. 已在 `users_api` 中插入一条 API Key 记录

默认脚本约定的 API Key 为：

- `docker_verify_api_key_0001`

如果你想改成别的值，可在执行前导出：

```bash
export DEMO_API_KEY=your_real_api_key
```

## 2. 验收脚本

### 2.1 预检

```bash
bash ./scripts/docker_demo_step0_precheck.sh
```

作用：

- 检查 Docker stack 是否健康
- 检查 `.env.docker.example` 是否已经填入真实管理员账号
- 检查 host 上 `8090` / `8787` 健康接口是否可达

### 2.2 写入并创建公开访问

```bash
bash ./scripts/docker_demo_step1_write_and_share.sh
```

覆盖能力：

1. 允许我将一个文件保存到此应用中，并允许外部用户通过 http 访问此文件
2. 允许我将一段富文本保存到此应用中，并允许外部用户通过 http 查看此文本
6. 我可以通过 open api 向应用中保存文件或是富文本

该步骤会：

- 写入一条 PDF 文件内容
- 写入一条 HTML 富文本内容
- 为两条内容分别创建 share
- 把生成结果保存在 `.demo-state/mvp_demo.env`

### 2.3 打印访问地址并执行接口验收

```bash
bash ./scripts/docker_demo_step2_print_and_verify.sh
```

覆盖能力：

3. 外部用户可以在页面的内容列表中找到我发布的内容
4. 外部用户可以在页面中搜索我发布的内容
5. 外部用户可以查看我发布的内容的详情

该步骤会输出：

- public list 页面地址
- public search 页面地址
- PDF / HTML 的 public detail 地址
- PDF / HTML 的 share 地址
- direct public content 地址

同时还会做一轮命令行验证，确保：

- owner 列表接口可读
- 文件 public content 可读
- 富文本 public content 可读
- 文件 share 可读
- 富文本 share 可读

### 2.4 清理演示数据

```bash
bash ./scripts/docker_demo_step3_cleanup.sh
```

作用：

- 删除演示用 PDF 内容
- 删除演示用 HTML 内容
- 清理 `.demo-state/mvp_demo.env`

## 3. 推荐人工演示顺序

1. 先运行预检。
2. 运行写入与分享。
3. 打开 `docker_demo_step2_print_and_verify.sh` 输出的地址。
4. 演示：
   - public list
   - public search
   - rich text detail
   - file detail
   - file download
5. 最后清理演示数据。

## 4. 相关脚本

- `scripts/docker_demo_step0_precheck.sh`
- `scripts/docker_demo_step1_write_and_share.sh`
- `scripts/docker_demo_step2_print_and_verify.sh`
- `scripts/docker_demo_step3_cleanup.sh`

## 5. 注意事项

- 这些脚本默认使用 `.env.docker.example`。
- 如果你想切换环境文件，可先导出：

```bash
export DOCKER_ENV_FILE=/absolute/path/to/your.env
```

- 如果你想切换 Docker Compose project name，可先导出：

```bash
export DOCKER_PROJECT_NAME=static-content-service
```

- 如果你想切换 API Key，可先导出：

```bash
export DEMO_API_KEY=your_real_api_key
```
