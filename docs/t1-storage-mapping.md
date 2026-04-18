# T1 存储映射说明

`T1` 阶段只落地 PocketBase 底座与基础数据模型，不提前进入业务壳实现。

## 目录映射

- `pocketbase/data/`：PocketBase SQLite、系统集合、上传文件等底座数据。
- `pocketbase/public/`：PocketBase 静态公开目录。
- `workspace/`：后续业务壳使用的本地工作目录根路径。

## 当前约束

- `PocketBase` 继续作为唯一底座。
- 业务文件最终仍由业务壳维护映射关系，不在 `T1` 中把业务规则写进 PocketBase hook。
- `Content.storage_path` 记录的是业务文件映射路径，而不是直接对外暴露的 PocketBase 内部文件 URL。

## 运行边界

- 本地开发时可使用 macOS 对应官方运行体。
- 最终部署前必须在 Linux 目标环境重新执行启动与验证脚本。
