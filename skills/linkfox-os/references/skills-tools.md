# 通用工具 skills

**14 个 skill**，覆盖报告落盘 / 定时任务 / skill 创建 / SuperAgent 编排 / 网页爬取 / Google 趋势 / AI 搜索 / 飞书表格 / 商品库变体 CRUD。

**归属 agent**：大部分挂在 `default`。

**不确定用哪个 agent？** → 用 `default`

## Skills

| skill | 类型 | 用途 | 入参（关键字段） | 返回摘要 | 归属 agent |
|---|---|---|---|---|---|

| `linkfox-ai-mode-google-search` | AI 搜索 | 用 Google AI Overview 抓单关键词深度调研 | `keyword`(必填) | Markdown 全文 + citations，落盘 JSON，超 8KB 只回摘要 | default / market / selection |
| `linkfox-ecommerce-skill-creator` | skill 创建 | 电商 Tier2/3 多步业务流程 skill 生成器 | mode(新建/复刻/微调), skill 名, 业务流程访谈信息 | 生成产物目录+`SKILL.md`+scripts+references，走六环验收 | default / listing / market / selection |
| `linkfox-google-trend-get-trend-by-keys` | Google 趋势 | 按关键词查 Google Trends 搜索热度 | `keyword`(必填), `region`, `dayRangeStart`, `dayRangeEnd` | JSON 0-100 归一化趋势曲线，落盘 + 摘要，超 8KB 只回摘要 | default / market / selection |
| `linkfox-google-trend-get-trend-by-time` | Google 趋势 | 按时间窗查区域实时热搜话题 | `days`(默认7), `region`(默认US) | JSON：query/searchVolume/increasePercentage 列表，落盘 | default / market / selection |
| `linkfox-plugin-web-data-crawler` | 网页爬取 | 浏览器插件采集商品详情页字段 | `--site`, `--url`(或 ASIN), `--category`, `--reuse-tab` | JSON：标题/价/图/评分/五点/规格，落盘 + `[Saved]` 路径 | default |