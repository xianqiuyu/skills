---
name: amazon-ads-skill
description: Use when 用户通过 Amazon 官方 Ads API 查询或管理广告经营数据，包括 profiles、campaigns、ad groups、keywords、targeting、budgets、广告表现和报告，以及处理 Ads API 未授权、鉴权或 profile 错误，且不需要驱动浏览器。
---

# Amazon Ads API 平台数据（zn-eco）

用 **zn-eco** 渐进式发现 `amazon-ads-api`，再调用代理。不背接口、不驱动浏览器。

先读 CLI 通用约定；若已在当前上下文中完整读取，可跳过：

```bash
zn-eco agent guide
```

Amazon path、大区和未授权附图以本 Skill 为准，不要到 zn-eco 指南里寻找。

## 铁律

1. 文件或报告 URL → 下载到当前环境可用的临时目录 → 必要时把压缩 JSON 转为 CSV → 使用当前环境实际可用的永久文件上传能力 → 只向用户提供永久 `file_url`。禁止提供平台临时 URL 或本地临时路径。
2. 不向用户暴露 path、module、profile ID、内部 ID、原始 JSON、`error_code` 或命令原文。
3. 写操作先说明影响并取得确认；读操作直接调用。
4. 没有对口接口时明确说明没有；禁止使用相似接口凑数。
5. 异步报告约每分钟轮询一次，自首次请求起最多十分钟。

## 代理 path 与大区

业务请求使用 `/proxy/{site}` 加 Swagger 原始 path。例如，Swagger path 为 `/v2/profiles` 时，北美请求 path 为 `/proxy/na/v2/profiles`。

授权类 path 使用 `/auth/...`，不添加 `/proxy/`。未授权引导不要调用授权接口，按“未授权”一节处理。

`site` 根据店铺国家（`browser_name`）选择：

| 大区 | site / region | 国家 |
| --- | --- | --- |
| 北美 | `na` / `NA` | US CA MX BR |
| 欧洲 | `eu` / `EU` | UK DE FR IT ES NL SE PL BE IE ZA SA EG TR AE IN |
| 远东 | `fe` / `FE` | JP AU SG |

无法判断时默认 `na`；多店请求分别使用各店所属大区。

```bash
zn-eco http GET /proxy/na/v2/profiles \
  --module amazon-ads-api \
  --headers '{"X-Account-Id":"<browser_id>"}'
```

## 执行流程

1. **确定店铺**：使用 `browser_id` 作为 `X-Account-Id`；只使用 `amazon-ads-api`。
2. **渐进发现**：path 必须来自上一级发现结果，不得编造。

```bash
zn-eco skills
zn-eco skills get --path "amazon-ads-api"
zn-eco skills get --path "amazon-ads-api <业务模块>"
zn-eco skills get --path "amazon-ads-api <业务模块> operations <操作名>"
```

3. **取得 profile**：先调用发现到的 profiles 查询操作。已确认原始 path 为 `/v2/profiles` 时，调用 `GET /proxy/{site}/v2/profiles`，选择与当前店铺和市场匹配的 profile。
4. **设置 scope**：后续广告请求的 header 必须包含 `Amazon-Advertising-API-Scope: <profileId>`。不得改 header 名，也不得把 profile ID 放进 path。
5. **调用接口**：按大区规则拼接代理 path；query、body 和其他 header 字段名以发现到的 Swagger 文档为准。
6. **判断读写**：GET 为读；DELETE、PUT、PATCH 为写；POST 根据用户意图和 `operationId` 判断，拿不准时按写操作处理。未确认不得调用写操作。
7. **处理响应**：向用户汇总业务结果；文件按“文件类结果”处理；未授权按“未授权”处理。

出现 `profile ID required` 或等价的 profile 缺失错误时，检查 `Amazon-Advertising-API-Scope` header 并纠正。包含首次调用在内，同一接口最多尝试三次，之后停止并如实反馈。

## 异步广告报告

1. 创建报告并取得报告标识。
2. 约每分钟查询一次状态。
3. 状态为 `COMPLETED`、`DONE` 或等价完成状态后，再取得报告文档或下载 URL。
4. 下载到当前环境可用的临时目录；如果结果为 `json.gz`，先解压并转换为 CSV。
5. 使用当前环境实际可用的永久文件上传能力上传转换后的文件。
6. 只向用户提供永久文件链接，不提供报告标识、profile ID、内部 path、本地路径或平台临时 URL。
7. 自首次请求起十分钟仍未完成时停止轮询，告知用户报告仍在生成，可稍后重试。

状态为 `FATAL`、`FAILED`、`CANCELLED` 或等价失败状态时，如实告知，不得凑数。

## 文件类结果

文件必须先下载到当前环境可用的临时目录，必要时解压和转换，再使用当前环境实际存在的永久上传工具或能力上传，并从上传结果中取得永久 `file_url`。

如果当前环境没有永久文件上传能力，说明暂时无法安全交付该文件。不得把本地文件路径或 Amazon 临时下载 URL 交给用户。

## 未授权

仅以下信号表示店铺未完成平台授权：

1. 内部响应的 `error_code` 为 `32002`，或文案包含“授权记录不存在”。
2. 响应仅为裸字符串 `"seller_account_id=<数字>"`。

命中后停止换参重试；不要调用 `/auth/authorize-url` 或其他接口取得授权链接；不要自造 Seller Central、二维码或视频链接。多店请求合并未授权店名。面向用户始终原样输出：

```markdown
店铺：[店铺名称1]、[店铺名称2]未完成平台授权，需由 Boss 账号在设置页面先完成授权操作。

附图：[授权操作指引](https://agent-swarm-resources-prod.oss-cn-shenzhen.aliyuncs.com/ai-client-resouces-envkit/20260805/8dae26d3.jpg)
```

- 附图必须使用 `[文字](url)`，不要使用 `![]()`；Amazon 链接不得修改。
- 设置入口参考：`AI` → `设置` → `平台授权管理` → `新增授权`。
- 已授权店铺继续正常汇总，只把未授权店铺列入提示。
- 不向用户暴露用于判断的内部 path、module、profile ID、内部 ID、原始响应或 `error_code`。

其他错误，包括响应 envelope 解析失败以及非上述信号的错误，均如实反馈，不得当作未授权处理。

## 输出纪律

用户侧只包含业务结果与店铺名。不得输出 path、module、profile ID、内部 ID、原始 JSON、`error_code`、报告标识、命令原文、本地路径或平台临时 URL。

如果用户追问接口细节，用一句话说明接口由 Amazon 官方 API 能力目录动态发现，然后继续给出业务结果；仍不披露内部代理细节。

## 能力边界

- 只使用 `zn-eco skills` 能发现的 `amazon-ads-api` 能力。
- 发现一轮对口能力即可；业务相关不等于接口匹配。
- 同一接口最多重试三次。
- 任何写操作必须在本次对话中取得用户确认。

## Red Flags — 停止并纠正

| 行为 | 纠正方式 |
| --- | --- |
| 向用户输出 path、module、profile ID、报告标识或内部 ID | 删除内部细节，只保留业务结论 |
| 向用户提供平台临时 URL 或本地临时路径 | 先永久上传；没有上传能力就说明无法安全交付 |
| 高频轮询报告或轮询超过十分钟 | 恢复约一分钟间隔；到十分钟立即停止 |
| 使用“差不多”的接口凑数据 | 明确说明没有对口接口 |
| 未确认就调用写操作 | 停止调用，先说明影响并请求确认 |
| 店铺国家与代理大区不匹配 | 按国家重新选择 `eu`、`fe` 或 `na` |
| 缺少 profile 时把 profile ID 塞进 path | 使用准确的 `Amazon-Advertising-API-Scope` header |

