# PocketBase

## 项目概述
**PocketBase** 是一个开源的 Go 后端，包含：
- 嵌入式数据库 (SQLite) 支持实时订阅
- 内置文件和用户管理
- 便捷的管理后台 UI
- 简单的 REST-ish API

## 官方文档
完整文档和示例请访问：https://pocketbase.io/docs

## 重要提示
PocketBase 仍处于积极开发中，在达到 v1.0.0 之前不保证完全向后兼容。

## API SDK 客户端
与 PocketBase Web API 交互的最简单方式是使用官方 SDK 客户端：

- **JavaScript - [pocketbase/js-sdk](https://github.com/pocketbase/js-sdk)** (浏览器、Node.js、React Native)
- **Dart - [pocketbase/dart-sdk](https://github.com/pocketbase/dart-sdk)** (Web、移动端、桌面端、CLI)

## 使用方式

### 1. 作为独立应用使用
从 [Releases 页面](https://github.com/pocketbase/pocketbase/releases) 下载预编译的可执行文件。

解压后在目录中运行 `./pocketbase serve`。

预编译的可执行文件基于 [`examples/base/main.go` 文件](https://github.com/pocketbase/pocketbase/blob/master/examples/base/main.go)，默认启用 JS VM 插件，允许使用 JavaScript 扩展 PocketBase。

### 2. 作为 Go 框架/工具包使用
PocketBase 作为常规 Go 库包分发，允许构建自定义应用特定的业务逻辑，最终生成单个可移植的可执行文件。

**最小示例：**

```go
package main

import (
    "log"
    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/core"
)

func main() {
    app := pocketbase.New()

    app.OnServe().BindFunc(func(se *core.ServeEvent) error {
        // 注册新的 "GET /hello" 路由
        se.Router.GET("/hello", func(re *core.RequestEvent) error {
            return re.String(200, "Hello world!")
        })

        return se.Next()
    })

    if err := app.Start(); err != nil {
        log.Fatal(err)
    }
}
```

**初始化和运行：**
```bash
go mod init myapp && go mod tidy
go run main.go serve
```

**构建静态链接的可执行文件：**
```bash
CGO_ENABLED=0 go build
./myapp serve
```

### 3. 构建和运行仓库 main.go 示例
在 `examples/base` 目录中运行 `go build` 来构建最小独立可执行文件。

**支持的构建目标：**
```
darwin  amd64/arm64
freebsd amd64/arm64
linux   386/amd64/arm/arm64/loong64/ppc64le/riscv64/s390x
windows 386/amd64/arm64
```

## 测试
```bash
go test ./...
```

## 安全
如发现安全漏洞，请发送邮件至 **support at pocketbase.io**。

## 贡献
PocketBase 是基于 [MIT License](LICENSE.md) 的免费开源项目。欢迎通过以下方式贡献：

- [贡献源代码](CONTRIBUTING.md)
- [建议新功能和报告问题](https://github.com/pocketbase/pocketbase/issues)

欢迎提交新 OAuth2 提供商、bug 修复、代码优化和文档改进的 PR。

## 项目链接
- 官网：https://pocketbase.io
- 文档：https://pocketbase.io/docs
- GitHub：https://github.com/pocketbase/pocketbase
