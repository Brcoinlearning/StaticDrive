# P5 Phase 1 Closeout

本文档记录 P5 第一阶段补充收口结果：在既有“内容对象接入边界”基础上，继续完成 `bodyFormat + Markdown` 的单一契约闭环，并把写入、更新、查询、owner/public 展示与演示入口统一到同一条 `contents` 主链路。

## 1. 本轮完成目标

本轮完成了以下目标：

1. 固化 `body_source / body_format / html_content` 与 `body / bodyFormat / renderedBodyHtml / htmlContent` 的单一映射规则。
2. 完成 `POST /api/write/content` 对 `html | markdown` 两种正文格式的写入支持。
3. 完成 `POST /api/write/update` 对 `html | markdown` 两种正文格式的更新支持。
4. 完成查询输出与 owner/public 页面对最终展示 HTML 的统一复用。
5. 更新 P5 演示脚本，使 Markdown 主链路可以真实演示。

## 2. 当前统一规则

当前已落定的统一规则如下：

1. `body_source -> body`
2. `body_format -> bodyFormat`
3. `html_content -> renderedBodyHtml`
4. `htmlContent` 作为兼容字段，始终与 `renderedBodyHtml` 等值
5. Markdown 转换只允许发生在写入 / 更新期
6. 查询与页面层只消费最终 HTML，不在页面层动态转换 Markdown

## 3. 本轮完成内容

本轮已完成：

1. `POST /api/write/content` 支持 `bodyFormat=html|markdown`。
2. `POST /api/write/update` 支持 `body + bodyFormat` 更新。
3. 查询对象统一返回 `body / bodyFormat / renderedBodyHtml / htmlContent`。
4. owner 详情页预览统一使用 `renderedBodyHtml`。
5. public 页面预览统一使用 `renderedBodyHtml`。
6. owner 更新表单改为编辑 `body + bodyFormat`，不再停留在旧 `htmlContent` 心智。
7. P5 demo 脚本默认演示 Markdown 写入、查询、公开展示主链路。

## 4. 范围外仍未进入内容

以下内容仍未进入本轮：

1. 图片上传、托管和清理生命周期。
2. 第二套公开访问体系。
3. 第二套平行内容存储模型。
4. HTML 清洗层。
5. 资源访问密码。
6. 完整 Markdown 规范兼容。

## 5. 自动化验证结果

本轮已完成并通过以下验证：

```bash
npm test -- tests/content.test.js
npm test
bash -n scripts/p5_demo_common.sh \
  scripts/p5_demo_step1_write_content.sh \
  scripts/p5_demo_step2_query_and_share.sh \
  scripts/p5_demo_step3_print_access_info.sh \
  scripts/p5_demo_step4_cleanup_content.sh
```

实际结果：

1. `tests/content.test.js`：通过
2. `npm test`：`95 passed, 0 failed`
3. P5 demo 脚本语法检查通过

## 6. 本轮覆盖的 Contract 项

本轮已覆盖：

1. `MF-1`：html 正文写入成功。
2. `MF-2`：markdown 正文写入成功，并转换为最终展示 HTML。
3. `MF-3`：markdown 正文更新成功，并同步更新最终展示 HTML。
4. `MF-4`：查询输出与页面展示围绕同一份最终 HTML 工作。
5. `EF-1`：`bodyFormat=html` 时原始正文与最终展示 HTML 关系正确。
6. `EF-2`：`bodyFormat=markdown` 时原文与转换结果并存。
7. `EF-4`：旧 `POST /api/write/html` 继续兼容。
8. `EF-5`：`htmlContent === renderedBodyHtml`。
9. `FF-2`：非法 `bodyFormat` 被拒绝。
10. `FF-3`：Markdown 渲染失败时写入 / 更新被拒绝。
11. `FF-4`：不存在内容查询返回业务 `404`。
12. `FF-5`：页面层未引入 Markdown 动态转换。

## 7. 人工演示入口

当前可用的 P5 演示脚本：

1. `scripts/p5_demo_step1_write_content.sh`
2. `scripts/p5_demo_step2_query_and_share.sh`
3. `scripts/p5_demo_step3_print_access_info.sh`
4. `scripts/p5_demo_step4_cleanup_content.sh`

默认演示顺序：

1. 写入一条 Markdown 内容对象。
2. 查询内容对象，确认 `body / bodyFormat / renderedBodyHtml / htmlContent`。
3. 打开 owner 详情页，确认预览使用最终 HTML、更新表单保留原始 `body + bodyFormat`。
4. 打开 public 页面，确认公开访问展示的是渲染后的 HTML。
5. 清理演示数据。

## 8. 残余风险

当前残余风险主要有：

1. 当前 Markdown renderer 是最小实现，不是完整 Markdown 规范实现。
2. owner 页面目前只提供基础文本域和格式选择，没有更强的富文本 / Markdown 编辑体验。
3. 图片当前只支持正文引用已有可访问 URL，不进入托管责任。

## 9. 下一步建议

P5 第一阶段补充内容完成后，更合理的下一步是：

1. 若继续收口本轮，优先做更完整的演示和人工验证记录。
2. 若进入后续阶段，应单独开启资源访问密码或更强内容格式能力的新准备链。
