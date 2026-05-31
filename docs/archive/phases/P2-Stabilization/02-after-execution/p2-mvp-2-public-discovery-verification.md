---
doc_id: "p2_mvp_2_public_discovery_verification"
phase: "executing-plans"
artifact: "verification_record"
status: "draft"
derived_from:
  - "p2_t1_mvp_scope_freeze"
  - "phase_2_tasks"
updated_at: "2026-04-19"
---

# P2-MVP-2 Public Discovery Verification

## 1. 目标

本记录用于证明 `P2-MVP-2` 已补齐公开访客的 `公开列表 -> 公开搜索 -> 公开详情` 最小闭环。

## 2. 本轮实现结论

- 新增公开列表页：`/web/public/list`
- 新增公开搜索页：`/web/public/search?q=关键词`
- 公开列表与搜索结果统一跳转到：`/web/public/content/:contentHash`
- 公开列表与搜索底层只查询 `is_shared = true` 的内容

## 3. 自动化验证证据

验证命令：

```bash
node --test
```

最近一次结果：`51/51` 通过。

关键用例：

- `public list returns only shared content summaries`
- `public search returns shared matches with public detail urls`
- `web public list renders shared content discovery page`
- `web public search renders only public discovery results`

## 4. 验收口径

本任务按以下口径视为通过：

1. 公开访客无需预先拿到 hash，也能从页面入口发现内容。
2. 公开发现页只暴露已公开内容。
3. 列表与搜索结果都能进入公开详情页。
4. owner 页面与公开访客页面仍然分离。

## 5. 手工复验建议

建议先创建两条已分享内容，再访问：

```text
http://127.0.0.1:8787/web/public/list
```

确认：

- 可看到已分享内容
- 点击可进入公开详情页

再访问：

```text
http://127.0.0.1:8787/web/public/search?q=样例
```

确认：

- 搜索结果只返回公开内容
- 搜索结果链接正确

## 6. 当前结论

`P2-MVP-2` 的自动化证据已经成立。当前系统已具备公开访客的公开列表、公开搜索与公开详情最小闭环。
