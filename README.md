# Agent Skills

用于紫鸟 Agent、Temu、Amazon Selling Partner API、Amazon Ads 和 Linkfox 工作流的 Agent Skills。

## 可用技能

| Skill | 用途 |
| --- | --- |
| `temu-skill` | Temu 订单、商品、库存、履约和物流等官方 API 工作流 |
| `amazon-sp-skill` | Amazon Selling Partner API 订单、商品、库存和履约工作流 |
| `amazon-ads-skill` | Amazon Ads 广告活动、报表和投放数据工作流 |
| `linkfox-os` | 通过 Linkfox 只读工具网关查询电商、市场与合规数据 |
| `ziniao-agent-skill` | 使用 `zn-open-eco` 发现 Product Skill、知识库，并编排本地紫鸟浏览器自动化任务 |
| `ziniao-ai-agent-onboarding` | 紫鸟 ECO CLI 安装授权完成后的新手引导与首个任务推荐 |

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
npx skills add xianqiuyu/skills --skill ziniao-agent-skill -g -y
npx skills add xianqiuyu/skills --skill ziniao-ai-agent-onboarding -g -y
```

不加 `-g` 时，技能将安装到当前项目。更多参数参见 [skills CLI](https://github.com/vercel-labs/skills)。
