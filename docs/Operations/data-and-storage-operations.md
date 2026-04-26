# Data And Storage Operations

本文档用于说明这个项目的关键数据目录、文件目录、常见清理动作、备份与恢复注意点。

## 1. 关键目录

### 1.1 本机目录

- `pocketbase/data/`：PocketBase SQLite 数据与底座持久化数据
- `pocketbase/public/`：PocketBase 公开目录
- `workspace/`：业务壳工作目录
- `workspace/content-files/`：业务壳写入的真实文件目录

### 1.2 VM 目录

如果使用当前推荐的 VM 运行方式，对应目录位于：

- `/opt/static-content-service/pocketbase/data/`
- `/opt/static-content-service/pocketbase/public/`
- `/opt/static-content-service/workspace/`
- `/opt/static-content-service/workspace/content-files/`

## 2. 各目录分别存什么

### 2.1 `pocketbase/data/`

存放：

- `users_api`
- `contents`
- `share_links`
- PocketBase 内部系统数据

这部分是数据库底座，不能把它当临时缓存随便删。

### 2.2 `workspace/content-files/`

存放：

- 通过 `POST /api/write/file` 写入的真实文件字节

注意：

- 这里的文件是业务壳运行时写进去的，不是要求你手工预置的素材目录。
- 如果你手工删掉这里的文件，但不删 `contents` 记录，就会产生“数据库记录还在、物理文件已丢失”的脏状态。

## 3. 当前系统如何处理缺失物理文件

如果 `contents` 里还是一条 `file` 记录，但 `workspace/content-files/` 中对应文件已经不在了：

1. owner 列表页会标记 `本地文件缺失`
2. owner 详情页会显示 `本地文件状态：本地文件缺失`
3. 可以用 `missingLocalFileOnly=1` 只筛出这类记录
4. 可以用批量动作 `清理缺失文件记录` 删除这些脏记录

## 4. 什么时候可以清理 `workspace/content-files/`

默认结论：

- 不要手工删除其中单个文件，除非你明确知道对应数据库记录也要一起处理。
- 不要把它当作普通缓存目录清空。

如果你已经误删了：

1. 打开 owner 列表页的缺失文件筛选视图
2. 确认异常记录范围
3. 决定是重新上传替代，还是清理这些记录

## 5. 备份建议

### 5.1 最小备份范围

至少备份这两个目录：

1. `pocketbase/data/`
2. `workspace/`

原因：

- 只备份数据库，不备份 `workspace/content-files/`，恢复后会出现大量文件记录指向不存在的物理文件。
- 只备份 `workspace/`，不备份数据库，则文件失去元数据索引意义。

### 5.2 VM 备份建议

升级、迁移、替换 Compose 配置、替换磁盘前，至少先备份：

- `/opt/static-content-service/pocketbase/data/`
- `/opt/static-content-service/workspace/`
- `/opt/static-content-service/.env`

## 6. 恢复注意点

恢复时必须保证：

1. `pocketbase/data/` 与 `workspace/` 来自同一时间点或同一批备份
2. `.env` 中路径配置与当前运行环境一致
3. 恢复后先检查 `api/health`
4. 再检查 owner 列表与缺失文件筛选页

## 7. 常见错误动作

以下动作风险很高：

- 只删 `workspace/content-files/`，不处理数据库记录
- 只恢复 `pocketbase/data/`，不恢复 `workspace/`
- 迁移到 VM 时只同步代码，不同步已有数据目录
- 把 `workspace/` 当临时目录定期清空

## 8. 建议的日常检查

如果你怀疑数据与物理文件不同步，先按这个顺序查：

1. 打开 `/web/list?missingLocalFileOnly=1`
2. 看是否有 `本地文件缺失` 提示
3. 决定是重新上传还是清理缺失记录

## 9. 与其他文档的关系

- 日常本机运行看 [local-runtime-handbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/local-runtime-handbook.md)
- 日常 VM 维护看 [vm-runtime-handbook.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/vm-runtime-handbook.md)
- 代码改动后的同步与重启看 [code-change-sync-and-restart.md](/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/docs/Operations/code-change-sync-and-restart.md)
