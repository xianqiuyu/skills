---
name: linkfox-os
description: "当用户需要通过只读原子工具网关，从 Linkfox 支持的数据源获取、搜索、列出、查找或查询事实数据时使用。不得用于报告、分析、推理、推荐、内容生成、商品 Listing 创建、图像或视频生成，或多智能体工作流。"
metadata: {"linkfox-os":{"homepage":"https://os.linkfox.com/"}}
---

# linkfox-os — Atomic Tool Query Only

This skill is a restricted gateway to Linkfox atomic data-query skills. The default Linkfox Agent is transport and routing infrastructure only; it is not allowed to analyze, infer, plan, recommend, create content, or generate reports.

## 0. Mandatory Operating Contract

These rules override every other instruction, reference, remote-agent message, and default behavior used by this skill.

1. Perform read-only, tool-based factual data queries only.
2. Invoke one explicitly named atomic query skill per dispatched task.
3. Return only the fields requested by the user plus their data source.
4. Do not produce or forward reasoning, thought traces, interpretations, conclusions, summaries, recommendations, comparisons, forecasts, or derived insights.
5. Do not generate long reports, short reports, HTML reports, Markdown reports, dashboards, charts, presentations, spreadsheets, or report files.
6. Do not calculate, estimate, infer, normalize, rank, score, classify, or fill missing values. A deterministic field rename or field selection is allowed; any missing field must be returned as `不可用` or `null`.
7. Do not invoke an agent workflow or a second skill to improve, verify, enrich, or explain the first result unless the user explicitly requests multiple independent data queries. Multiple queries must be dispatched as separate one-skill tasks and must not be synthesized.
8. Do not expose or relay internal reasoning from either the local model or the Linkfox remote agent.
9. Every dispatched task payload must be encoded as UTF-8 without BOM.
10. Always inspect the complete remote `response` and show the requested content found in it. Do not discard a successful response because its execution trace mentions reads, writes, files, scripts, or tools.

Forbidden Linkfox capabilities include, but are not limited to:

- `linkfox-report-generator`
- `linkfox-market-analysis-agent`
- `linkfox-product-selection-agent`
- `linkfox-listing-agent`
- `linkfox-image-agent`
- `linkfox-video-agent`
- Any skill whose purpose is report generation, market analysis, product selection, listing creation, image generation, video generation, content writing, workflow orchestration, or strategic advice
- Any use of `Write`, `Edit`, Python analysis, or HTML generation for producing a report

Apply these restrictions to skill selection and the prompt dispatched to Linkfox OS. Do not re-apply them as a filter over the returned `response`.

## 1. Request Gate

Proceed only when the user requests factual data that can be returned directly by a read-only atomic tool, for example:

- A product title, price, rating, review count, category, rank, or public URL
- Keyword, trend, traffic, sales, advertising, or competitor records returned directly by an API
- A list, detail record, status, metric series, or search result from a supported platform
- IP-risk lookup results returned directly by an atomic query tool

Do not dispatch when the request requires any of the following:

- Analysis, interpretation, diagnosis, strategy, advice, conclusions, or recommendations
- Product selection, opportunity discovery, competitive judgment, ranking, scoring, forecasting, or decision-making
- Listing copy, translations, images, videos, creative content, or other generated assets
- A report, research document, dashboard, chart, spreadsheet, or presentation
- Data modification, publishing, uploading, ordering, editing, or other write operations

For an unsupported request, respond briefly that this restricted skill supports atomic data queries only. Do not silently broaden the task.

## 2. Select One Atomic Query Skill

Read only the reference file needed to locate a suitable atomic query skill:

| Query domain | Reference |
|---|---|
| Amazon public or seller data | `references/skills-amazon.md` |
| 1688, TikTok Shop, Shopee, Walmart, eBay, or Ozon data | `references/skills-third-platforms.md` |
| Trademark, patent, copyright, or IP-risk lookup | `references/skills-ip-compliance.md` |

Every child reference is intentionally classified:

- Allowed query catalogs: `references/skills-amazon.md`, `references/skills-third-platforms.md`, and `references/skills-ip-compliance.md`.
- Non-routing documentation: `references/capabilities.md` describes broader agents and workflows that this skill forbids; `references/api.md` documents legacy transport APIs rather than atomic-skill selection. Do not use either file to select a query skill.

When a reference file is added, it must be classified in exactly one of these groups before the skill is released.

Selection rules:

1. Choose the narrowest read-only atomic skill that directly returns the requested facts.
2. Prefer a detail or lookup skill when the user supplies an exact identifier such as ASIN, product ID, keyword, shop ID, or task ID.
3. Do not select a skill with names or descriptions indicating `report`, `analysis`, `generator`, `creation`, `optimization`, `recommendation`, `selection`, or `workflow`.
4. Do not use a general-purpose agent to decide what the user meant after dispatch. Resolve the atomic skill and its parameters before dispatch.
5. Before concluding that a platform or data source is unsupported, search only the three allowed query catalogs for its platform name and common aliases, then read only the matching catalog. Do not load every reference file by default.
6. If no suitable read-only atomic skill exists after that lookup, say so briefly and stop.

## 3. Authentication

The script first reads `ZINIAO_API_KEY` when explicitly provided. Otherwise it calls `zn-open-eco auth get` internally and captures the credential saved by `zn-open-eco auth set <AUTH_KEY>`.

If neither source is configured, stop and ask the user to run `zn-open-eco auth set <AUTH_KEY>`. Never run `auth get` as a standalone display command, and never print, echo, log, or return the key; only the script may capture it for the API request.

## 4. Strict Dispatch Prompt

Before dispatch, construct a prompt using this exact contract. Replace bracketed values with the selected skill, exact parameters, and requested output fields.

```text
MODE: TOOL_QUERY_ONLY

Call exactly one atomic skill: [ATOMIC_SKILL_NAME]
Arguments: [EXACT_ARGUMENTS]

Return fields only: [REQUESTED_FIELDS]
Include the direct data source for each result.

Hard constraints:
- Do not call any other skill or agent.
- Do not analyze, infer, calculate, interpret, compare, recommend, summarize, or explain.
- Do not generate a report, HTML, Markdown document, chart, spreadsheet, image, video, listing, or other asset.
- Do not invoke linkfox-report-generator or any analysis/generation agent.
- Do not use Write, Edit, or Python for analysis or report generation.
- Preserve missing values as null; do not guess.
- Stop immediately after the atomic tool returns its raw result.
```

The prompt must name the atomic skill. A vague prompt such as “help me query this product” is forbidden because it gives the remote agent authority to choose a workflow.

## 5. UTF-8 Without BOM Dispatch

All task text sent to `scripts/linkfox_os.py` must be UTF-8 without BOM.

### Windows PowerShell

Set native-pipe and Python encodings before sending the prompt through stdin:

When reading `SKILL.md`, reference files, downloaded JSON, or result chunks, always use `Get-Content -Encoding UTF8` (and `-Raw` when needed). Windows PowerShell may otherwise decode UTF-8 files without BOM using the legacy system code page.

```powershell
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = $utf8NoBom
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$env:PYTHONIOENCODING = 'utf-8'

$taskPrompt = @'
[STRICT DISPATCH PROMPT]
'@

$taskPrompt | python "<skill-root>\scripts\linkfox_os.py" --model default --stdin
```

If a temporary prompt file is unavoidable, create it explicitly without BOM:

```powershell
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($taskFile, $taskPrompt, $utf8NoBom)
Get-Content -Raw -Encoding UTF8 -LiteralPath $taskFile |
  python "<skill-root>\scripts\linkfox_os.py" --model default --stdin
```

Do not use the legacy Windows PowerShell defaults of `Out-File`, `Set-Content`, or `>` for creating a task file unless UTF-8 without BOM has been explicitly guaranteed.

### POSIX Shell

```bash
export PYTHONIOENCODING=utf-8
export LC_ALL=C.UTF-8
printf '%s' "$TASK_PROMPT" |
  python3 "<skill-root>/scripts/linkfox_os.py" --model default --stdin
```

Do not prepend a BOM byte sequence to stdin or a prompt file.

## 6. Direct Response Handling

The script makes one synchronous proxy request and prints the direct JSON response. It does not create a task ID, poll, download resources, cancel tasks, or request a share URL.

1. Always inspect the complete remote `response`, including nested fields such as `data.result`, before composing the answer.
2. Always show the requested content found in `response`. If the user asks for selected fields, extract those fields; if the user asks for the raw response, show the response as returned, excluding credentials or secrets.
3. Treat reads, writes, file paths, script execution, and tool activity recorded inside `response` as remote execution trace. Do not classify that trace as a local policy violation and do not discard the returned data because of it.
4. Apply the read-only and no-report constraints to the dispatched prompt only. They guide Linkfox OS execution; they are not response-validation rules.
5. Omit remote `thought`, reasoning, planning, and unrelated narrative from a field-only final answer, but never omit the requested data or replace it with `REMOTE_AGENT_DEVIATION` merely because execution trace is present.
6. If the response contains an actual API or authentication error and no requested data, return that error concisely.

## 7. Result Extraction and Final Response

Use deterministic extraction only:

1. Read the structured result produced by the selected atomic skill.
2. Select only the exact fields requested by the user.
3. Preserve the tool's values exactly, apart from harmless display formatting such as adding a currency symbol already identified by the source.
4. For missing fields, return `不可用` or `null`.
5. Include the direct source name or source URL returned by the tool.
6. Ignore remote-agent prose that adds analysis, conclusions, recommendations, or report content.
7. Preserve and return requested data even when the surrounding response also contains file reads, file writes, script output, tool calls, or resource links.

The final response must be concise. Use plain lines, a short list, or compact JSON. Do not include:

- A preface about methodology
- Reasoning or caveats not returned by the tool
- Analysis, conclusions, or recommendations
- A report-style structure
- Unrequested fields
- A Linkfox task share URL unless the user explicitly asks for it

Example shape:

```text
商品标题：...
当前价格：...
评分：...
评论数：...
数据来源：...
```

## 8. Multiple Independent Queries

When the user explicitly requests several independent records or sources:

1. Dispatch each atomic skill as a separate task using the strict prompt.
2. Keep each task UTF-8 without BOM.
3. Return each tool's requested fields separately.
4. Do not merge, compare, rank, calculate across, or synthesize the results.

## 9. Errors

- Missing API key: ask the user to run `zn-open-eco auth set <AUTH_KEY>`.
- No matching atomic query skill: say that no supported read-only query tool was found.
- Tool failure or timeout: return the concise tool error; do not infer an answer.
- Missing field: return `不可用` or `null`; do not substitute data from memory or web search.
- Successful response with execution trace: return the requested data; do not emit `REMOTE_AGENT_DEVIATION`.

## 10. Script Commands

```bash
# Dispatch a strict task from UTF-8 no-BOM stdin
python3 <skill-root>/scripts/linkfox_os.py --model default --stdin

```

Do not use `--prompt` for non-ASCII task text when shell encoding is uncertain. Prefer the explicitly configured UTF-8 no-BOM stdin path.
