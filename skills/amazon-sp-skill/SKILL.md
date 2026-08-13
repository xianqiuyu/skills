---
name: amazon-sp-skill
description: Use when 用户通过 Amazon 官方 SP-API 查询或管理店铺经营数据，包括订单、库存、Listing、Reports、Finances、FBA、Feeds，以及处理 SP-API 未授权或鉴权错误，且不需要驱动浏览器。
---

# Amazon SP-API 平台数据（zn-open-eco）

用 **zn-open-eco** 渐进式发现 `amazon-sp-api`，再调用代理。不背接口、不驱动浏览器。

先执行下方“调用前账户解析闸门”。鉴权确认有效后，再读 CLI 通用约定；若已在当前上下文中完整读取，可跳过：

```bash
zn-open-eco agent guide
```

Amazon path、大区和未授权附图以本 Skill 为准，不要到 zn-open-eco 指南里寻找。

## 跨平台 CLI JSON 参数（必读）

执行 `zn-open-eco http` 前，先识别实际 Shell；不要把一种 Shell 的引号写法直接复制到另一种 Shell。`--headers`、`--query` 与 `--body` 都必须作为**一个完整 JSON 参数**传入。

| 环境 | JSON 参数写法示例 |
| --- | --- |
| macOS/Linux bash/zsh | `--headers '{"X-Account-Id":"<browser_id>"}'` |
| Windows PowerShell | `--headers '{\"X-Account-Id\":\"<browser_id>\"}'` |
| Windows cmd.exe | `--headers "{\"X-Account-Id\":\"<browser_id>\"}"` |

- `--query`、`--body`按同一规则转义；不要在 Windows `cmd.exe` 中使用单引号包裹 JSON。
- 不要对 npm/PowerShell 包装的 `zn-open-eco` 使用 `--%`；它可能使参数未被正确转交。
- 完成账户解析与授权检查后，先用已发现的最简单只读接口做一次验证，再发起业务请求。
- 若提示 `headers/query/body is invalid json`，先判定为本地 Shell 转义问题，不得将其归因于店铺授权或 SP-API；修正当前 Shell 的转义后仅重试一次。
- 若上述验证已成功、而后续请求收到 schema/字段校验错误，应将其与本地 JSON 转义错误分开报告，并保留请求字段来自 operation 文档的证据。

## 调用前账户解析闸门

任何 SP-API 能力发现或代理请求之前，必须按以下顺序完成；不得因为用户已经给出店铺名称或 ID 而跳过。

1. 首条 CLI 命令运行 `zn-open-eco auth status`。
   - 未配置或无效：立即停止，只提醒用户先配置 auth；此时不要询问或展示店铺。
   - 已配置：继续店铺解析。
2. 解析店铺并私下保留选中店铺的完整对象：
   - 用户给出店铺名称或关键词：运行 `zn-open-eco account stores --store-name "<名称或关键词>"`。先用返回对象中的店铺名称与用户输入做精确匹配：恰有一个精确同名时，即使同时返回其他模糊候选也直接选中；没有精确同名且仅有一个可用候选时直接选中；只有没有精确同名且存在多个可用候选时，才按下方规则让用户选择。
   - 用户给出店铺 ID：运行 `zn-open-eco account stores`，在完整结果中私下按 `browser_id` 精确匹配。不要把 ID 回显给用户。
   - 用户未给店铺：运行 `zn-open-eco account stores`，缓存本次完整结果并进入选择流程。
   - 任一店铺查询返回零条匹配：立即停止，告知用户没有匹配店铺并请其提供其他店铺名称或关键词；不得猜测、近似匹配、自动选择其他店铺或发起代理请求。
3. 店铺选择界面严格保持接口返回的稳定顺序，每页最多 20 条，只显示店铺名称，一行一个；不排序、不改变顺序，不显示序号、ID、国家、平台、授权状态或其他字段。提示用户可回复店铺名称、关键词、`上一页` 或 `下一页`。
   - `上一页`、`下一页`只切换缓存结果，不再次请求接口。
   - 第 1 页没有上一页，最后一页没有下一页；到达边界时保持当前页并告知用户，禁止首尾循环或越界。
   - 用户回复关键词时，运行 `zn-open-eco account stores --store-name "<关键词>"`，用新结果替换缓存并回到第 1 页。
   - 选中后仍只向用户显示店铺名称；完整店铺对象仅保留在当前代理上下文中，尤其不得暴露 `browser_id`。
4. 运行一次 `zn-open-eco account platform-auths --platform-type amazon-sp-api`，使用完整结果按私下保留的 `browser_id` 对每个选中店铺逐店精确匹配授权记录。
   - 未找到某店铺的授权记录：只停止该店铺；绝不为该店铺发起业务或其他代理请求，并把店铺名加入“未授权”一节的合并提示。
   - 已授权店铺：每店分别使用自己的 `browser_id` 作为 `X-Account-Id`，继续各自的 SP-API 业务流程并正常汇总。
   - 多店请求必须检查所有选中店铺。部分未授权时继续处理已授权店铺；全部未授权时不发起任何代理请求。

账户查询命令的原始响应只用于内部解析；不得向用户输出完整对象、JSON、ID 或平台授权记录。

## 铁律

1. 文件或报告 URL → 下载到当前环境可用的目录 → 必要时把压缩 JSON 转为 CSV。
2. 不向用户暴露 path、module、内部 ID、原始 JSON、`error_code` 或命令原文。
3. 写操作先说明影响并取得确认；读操作直接调用。
4. 没有对口接口时明确说明没有；禁止使用相似接口凑数。
5. 异步报告约每分钟轮询一次，自首次请求起最多十分钟。

## 代理 path 与大区

业务请求使用 `/proxy/{site}` 加 Swagger 原始 path。例如，Swagger path 为 `/orders/v0/orders` 时，北美请求 path 为 `/proxy/na/orders/v0/orders`。

授权类 path 使用 `/auth/...`，不添加 `/proxy/`。未授权引导不要调用授权接口，按“未授权”一节处理。

`site` 根据店铺国家（`browser_name`）选择：

| 大区 | site / region | 国家 |
| --- | --- | --- |
| 北美 | `na` / `NA` | US CA MX BR |
| 欧洲 | `eu` / `EU` | UK DE FR IT ES NL SE PL BE IE ZA SA EG TR AE IN |
| 远东 | `fe` / `FE` | JP AU SG |

无法判断时默认 `na`；多店请求分别使用各店所属大区。

```bash
zn-open-eco http GET /proxy/na/orders/v0/orders \
  --module amazon-sp-api \
  --headers '{"X-Account-Id":"<browser_id>"}' --query '{...}'
```

## 执行流程

1. **确定店铺**：必须先完成“调用前账户解析闸门”，再使用私下保留的 `browser_id` 作为 `X-Account-Id`；只使用 `amazon-sp-api`。
2. **渐进发现**：path 必须来自上一级发现结果，不得编造。

```bash
zn-open-eco skills
zn-open-eco skills get --path "amazon-sp-api"
zn-open-eco skills get --path "amazon-sp-api <业务模块>"
zn-open-eco skills get --path "amazon-sp-api <业务模块> operations <操作名>"
```

3. **调用接口**：按大区规则拼接代理 path；query、body 和 header 字段名以发现到的 Swagger 文档为准。
4. **判断读写**：GET 为读；DELETE、PUT、PATCH 为写；POST 根据用户意图和 `operationId` 判断，拿不准时按写操作处理。未确认不得调用写操作。
5. **处理响应**：向用户汇总业务结果；文件按“文件类结果”处理；未授权按“未授权”处理。

## 异步报告

1. 创建报告并取得报告标识。
2. 约每分钟查询一次状态。
3. 状态为 `DONE` 或等价完成状态后，再取得报告文档或下载 URL。
4. 下载到当前环境可用的目录，必要时解压或转换。
5. 自首次请求起十分钟仍未完成时停止轮询，告知用户报告仍在生成，可稍后重试。

状态为 `FATAL`、`FAILED`、`CANCELLED` 或等价失败状态时，如实告知，不得凑数。

## 未授权

仅以下信号表示店铺未完成平台授权：

1. 调用前的 `account platform-auths --platform-type amazon-sp-api` 结果中没有当前店铺的授权记录。
2. 内部响应的 `error_code` 为 `32002`，或文案包含“授权记录不存在”。
3. 响应仅为裸字符串 `"seller_account_id=<数字>"`。

命中后停止换参重试；不要调用 `/auth/authorize-url` 或其他接口取得授权链接；不要自造 Seller Central、二维码或视频链接。多店请求合并未授权店名。面向用户始终原样输出：

```markdown
店铺：[店铺名称1]、[店铺名称2]未完成平台授权，需由 Boss 账号在设置页面先完成授权操作。

附图：[授权操作指引](https://agent-swarm-resources-prod.oss-cn-shenzhen.aliyuncs.com/ai-client-resouces-envkit/20260805/8dae26d3.jpg)
```

将方括号中的占位符替换为实际店铺名称；方括号本身不输出。多个未授权店铺按模板用 `、` 合并，只输出一份提示。

- 附图必须使用 `[文字](url)`，不要使用 `![]()`；Amazon 链接不得修改。
- 设置入口参考：`AI` → `设置` → `平台授权管理` → `新增授权`。
- 已授权店铺继续正常汇总，只把未授权店铺列入提示。
- 不向用户暴露用于判断的内部 path、module、内部 ID、原始响应或 `error_code`。

其他错误，包括响应 envelope 解析失败以及非上述信号的错误，均如实反馈，不得当作未授权处理。

## 输出纪律

用户侧只包含业务结果与店铺名。不得输出 path、module、内部 ID、原始 JSON、`error_code`、报告标识、命令原文、本地路径或平台临时 URL。

如果用户追问接口细节，用一句话说明接口由 Amazon 官方 API 能力目录动态发现，然后继续给出业务结果；仍不披露内部代理细节。

## 能力边界

- 只使用 `zn-open-eco skills` 能发现的 `amazon-sp-api` 能力。
- 发现一轮对口能力即可；业务相关不等于接口匹配。
- 同一接口最多重试三次。
- 任何写操作必须在本次对话中取得用户确认。

## Red Flags — 停止并纠正

| 行为 | 纠正方式 |
| --- | --- |
| 向用户输出 path、module、报告标识或内部 ID | 删除内部细节，只保留业务结论 |
| 高频轮询报告或轮询超过十分钟 | 恢复约一分钟间隔；到十分钟立即停止 |
| 使用“差不多”的接口凑数据 | 明确说明没有对口接口 |
| 未确认就调用写操作 | 停止调用，先说明影响并请求确认 |
| 店铺国家与代理大区不匹配 | 按国家重新选择 `eu`、`fe` 或 `na` |
