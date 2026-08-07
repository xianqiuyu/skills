---
name: temu-skill
description: Use the zn-eco CLI to query and operate Temu stores through official APIs, including orders, fulfillment, logistics, inventory, products, stock, shipping, and sales. Use when Codex must distinguish full-managed, semi-managed, and local stores; select CN, Partner, or regional gateways; diagnose access-token or Not Found errors; or retrieve Temu files without driving a browser.
---

# Temu 店铺运营

使用 `zn-eco` 发现 `temu-api` 的可用接口并通过代理调用。不要驱动浏览器，不要猜测接口 `type`、请求参数、网关或店铺类型。

## 开始前

1. 确认 `zn-eco` 可用；若命令不存在，说明依赖缺失并停止，不要改用直连请求。
2. 若当前上下文尚未包含 CLI 通用约定，运行 `zn-eco agent guide`。
3. 从用户或可信上下文取得目标店铺的账号 ID，并作为 `X-Account-Id` 传递。不要向用户展示该 ID。
4. 明确店铺主体（中国跨境或本土）及目标站点。无法排除中国跨境全托管/半托管歧义时，先执行店铺类型校验。

## 不可违反的规则

- 仅调用 `zn-eco skills` 已发现并读取过文档的接口；没有匹配接口时如实说明，不要拼凑相似接口。
- `zn-eco http` 的 Temu 代理路径始终为 `/proxy/{site}/{shop_type}`，不得使用 Swagger 中的 `/openapi/router` 或官方域名作为代理路径。
- `--module` 固定为 `temu-api`；请求体中不要传 `access_token`。
- 中国跨境店铺必须先用 `bg.mall.info.get` 确认全托管或半托管，除非同一账号在当前会话中已有仍然有效的校验结果。
- 对新增、修改、发货、取消等写操作，在调用前向用户确认具体操作和影响范围。查询类操作可直接执行。
- 不向用户暴露代理路径、module、账号 ID、`mallId`、`semiManagedMall`、原始 JSON、内部错误码或完整命令；只返回店铺名称和业务结果。诊断所必需的信息可以用业务语言概括。

## 校验中国跨境店铺类型

在拼接业务路径前运行：

```bash
zn-eco skills get --path "temu-api temu-cn-api authorization-api operations bg.mall.info.get.json"
zn-eco http POST /proxy/cn/cross-border-semi-managed \
  --module temu-api \
  --headers '{"X-Account-Id":"<account_id>"}' \
  --body '{"type":"bg.mall.info.get"}'
```

探测路径固定使用 `cn/cross-border-semi-managed`，目的是取得 CN 库存中的 token，并不代表已经判定为半托管。

| 响应字段 | 店铺类型 | 后续 `shop_type` |
| --- | --- | --- |
| `semiManagedMall=true` | 半托管 | `cross-border-semi-managed` |
| `semiManagedMall=false` | 全托管 | `cross-border-full-managed` |

- 探测失败且符合“未授权”信号时，按未授权流程处理；不得更换另一个 `shop_type` 继续碰撞业务接口。
- 只有 CN `bg.mall.info.get` 可判断中国跨境全托管/半托管。US、EU、Global 的 `bg.open.accesstoken.info.get`、`temu.local.mall.tags.get` 或 `mallType` 不能用于此判断。
- 已明确为本土店时跳过本步骤，使用 `local-semi-managed` 和对应区域的 `site`。

## 选择代理路径

```text
POST /proxy/{site}/{shop_type}
POST /proxy/{site}/{shop_type}/file_download
```

### 选择 `site`

| `site` | 使用条件 |
| --- | --- |
| `partner` | operation 文档包含 `openapi-b-partner.temu.com`、`x-temu-migration` 或 `partnerGatewayUrl` |
| `cn` | operation 属于 `temu-cn-api` 且仅指向 CN `/openapi/router`，没有 Partner 域名 |
| `us` / `eu` / `global` | 区域本土订单，或半托管订单、履约、物流；依据接口文档和订单站点选择 |

不要仅凭目录名 `temu-cn-api` 断定 `site=cn`；以 operation 文档中的网关为准。

### 选择 `shop_type`

- 中国跨境全托管 + CN 接口：`cn/cross-border-full-managed`
- 中国跨境全托管 + Partner 接口：`partner/cross-border-full-managed`
- 中国跨境半托管库存/商品 + CN：`cn/cross-border-semi-managed`
- 中国跨境半托管库存/商品 + Partner：`partner/cross-border-semi-managed`
- 半托管订单/履约/物流：`us|eu|global/cross-border-semi-managed`，依据订单站点选择区域
- 本土半托管：`us|eu|global/local-semi-managed`

中国跨境的 `shop_type` 必须来自上一节的校验结果。

## 执行工作流

1. 确认店铺账号 ID、店铺主体和目标站点。
2. 对中国跨境店先执行 `bg.mall.info.get`；本土店跳过。如果接口需要 `mallId` 或额外权限，再读取对应区域的 `authorization-api` 文档。
3. 逐层发现能力。路径叶子必须包含 `.json` 或 `.md`；省略后缀可能返回“文件未找到”。

   ```bash
   zn-eco skills get --path "temu-api"
   zn-eco skills get --path "temu-api temu-cn-api product-api operations bg.glo.goods.detail.get.json"
   ```

4. 读取 operation 文档，取得准确的 `type`、请求体字段和网关，再用已校验的 `shop_type` 组装代理路径。
5. 调用接口。例如：

   ```bash
   zn-eco http POST /proxy/cn/cross-border-semi-managed \
     --module temu-api \
     --headers '{"X-Account-Id":"<account_id>"}' \
     --body '{"type":"bg.goods.salesv2.get","<field>":"<value>"}'

   zn-eco http POST /proxy/partner/cross-border-semi-managed \
     --module temu-api \
     --headers '{"X-Account-Id":"<account_id>"}' \
     --body '{"type":"bg.glo.goods.detail.get","<field>":"<value>"}'
   ```

6. 解析响应并汇总业务结果。不要把示例占位字段直接用于真实调用；所有字段必须来自 operation 文档。

多店铺任务按店铺独立处理，每家店都必须单独校验账号和店铺类型。可以并行执行互不依赖的只读查询，但不要让一个店铺的校验结果污染另一个店铺。

## 文件结果

当 operation 返回文件 URL 时，优先按文档调用：

```bash
zn-eco http POST /proxy/{site}/{shop_type}/file_download \
  --module temu-api \
  --headers '{"X-Account-Id":"<account_id>"}' \
  --body '{"url":"<documented_url>"}'
```

将下载结果保存到用户可访问的工作区路径，并在回复中提供该本地文件的绝对路径链接。不要调用 Claw 专属的 `file-processing/scripts/upload_file.py`，不要把临时 URL 或沙箱临时路径冒充永久下载地址。如果当前 CLI 没有提供可保存的文件内容，则如实说明限制。

## 错误处理

### 未授权

仅将以下信号视为未授权：

- 响应包含 `access_token invalid`
- 响应包含 `access_token don't have this api access`
- HTTP 403 且上下文明确表示无权限

命中后停止调整参数或更换路径，不要推测授权链接。使用以下业务提示，并保留授权指引链接：

```markdown
店铺：[店铺名称] 未完成平台授权或授权已过期（Temu 授权有效期通常为 90 天），需要使用 Boss 账号在设置页面完成授权。

[授权操作指引](https://agent-swarm-resources-prod.oss-cn-shenzhen.aliyuncs.com/ai-client-resouces-envkit/20260805/e5703a97.jpg)
```

使用普通链接，不要嵌入图片，也不要修改 Temu 授权指引 URL。

### 路径和其他错误

- `{"detail":"Not Found"}` 且使用了 `/openapi/router`：这是代理路径错误。改为 `/proxy/{site}/{shop_type}` 后重试，不要当成未授权。
- Partner API 出现无权限或 `type` 不存在：先重新核对 operation 文档中的网关，不要直接换参数碰撞。
- 其他错误或无法解析 `envelope.ret`：如实说明业务请求失败，不要泄露原始响应中的内部字段。
- 同一接口最多尝试 3 次；每次重试必须有明确依据，不得盲目重复。

## 常见误区

| 错误做法 | 正确做法 |
| --- | --- |
| 根据用户查询意图默认全托管或半托管 | 中国跨境先查 `bg.mall.info.get` |
| 用 US/EU/Global 的 `mallType` 判断托管模式 | 仅使用 CN `bg.mall.info.get` |
| 业务接口失败后换一个 `shop_type` 重试 | 调用业务接口前完成店铺类型校验 |
| 使用 `/openapi/router` 或复制官方 URL | 使用 `/proxy/{site}/{shop_type}` |
| 看到 `temu-cn-api` 就固定选择 `cn` | 根据 operation 的实际网关选择 `cn` 或 `partner` |
| 发现接口时省略 `.json` 或 `.md` | 使用目录返回的完整文件名 |
| 把临时 URL、内部 ID 或原始 JSON 发给用户 | 返回业务结果；文件保存到用户可访问路径 |
| 仅凭 Swagger path 猜代理地址 | Swagger 只用于识别接口，代理地址遵循本 skill 的路径规则 |
