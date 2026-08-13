# Agent Skills

用于 Temu、Amazon Selling Partner API、Amazon Ads 和 Linkfox 数据查询工作的 Agent Skills。

## 可用技能

| Skill | 用途 |
| --- | --- |
| `temu-skill` | Temu 订单、商品、库存、履约和物流等官方 API 工作流 |
| `amazon-sp-skill` | Amazon Selling Partner API 订单、商品、库存和履约工作流 |
| `amazon-ads-skill` | Amazon Ads 广告活动、报表和投放数据工作流 |
| `linkfox-os` | 通过 Linkfox 只读工具网关查询电商、市场与合规数据 |

## 安装

查看可用技能：

```bash
npx skills add xianqiuyu/skills --list
```

将全部技能全局安装到 Codex：

```bash
npx skills add xianqiuyu/skills --skill '*' --agent codex -g -y
```

安装单个技能：

```bash
npx skills add xianqiuyu/skills --skill temu-skill -g -y
npx skills add xianqiuyu/skills --skill amazon-sp-skill -g -y
npx skills add xianqiuyu/skills --skill amazon-ads-skill -g -y
npx skills add xianqiuyu/skills --skill linkfox-os -g -y
```

不加 `-g` 时，技能将安装到当前项目。更多参数参见 [skills CLI](https://github.com/vercel-labs/skills)。
