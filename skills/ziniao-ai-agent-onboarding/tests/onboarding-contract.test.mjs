import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const skillUrl = new URL('../SKILL.md', import.meta.url);
const openaiUrl = new URL('../agents/openai.yaml', import.meta.url);

test('declares the cross-platform onboarding skill', () => {
  assert.equal(existsSync(skillUrl), true, 'SKILL.md must exist');
  const skill = readFileSync(skillUrl, 'utf8');
  assert.match(skill, /^---\r?\nname: ziniao-ai-agent-onboarding\r?\n/m);
  assert.match(skill, /description: Use when .*紫鸟 ECO/s);
});

test('publishes typo-free UI metadata', () => {
  const openai = readFileSync(openaiUrl, 'utf8');
  assert.match(openai, /display_name: "紫鸟AI Agent 新手引导"/);
  assert.doesNotMatch(openai, /Anget/);
});

test('asks for platform before scenario and asks only one question at a time', () => {
  assert.equal(existsSync(skillUrl), true, 'SKILL.md must exist');
  const skill = readFileSync(skillUrl, 'utf8');
  assert.match(skill, /一次只问一个问题/);
  assert.match(skill, /1\. 亚马逊店铺[\s\S]*2\. TikTok Shop 店铺[\s\S]*3\. 其他平台/);
  assert.match(skill, /用户选择平台后[\s\S]*再展示[\s\S]*场景/);
});

test('waits for intent before handing the task to the main workflow', () => {
  assert.equal(existsSync(skillUrl), true, 'SKILL.md must exist');
  const skill = readFileSync(skillUrl, 'utf8');
  assert.match(skill, /不得在用户确认前执行/);
  assert.match(skill, /“开始”[\s\S]*“执行”[\s\S]*具体需求/);
  assert.match(skill, /ziniao-cross-border-workflow/);
  assert.match(skill, /不得绕过[\s\S]*确认/);
});

test('does not depend on one agent-specific invocation syntax or fixed path', () => {
  assert.equal(existsSync(skillUrl), true, 'SKILL.md must exist');
  const skill = readFileSync(skillUrl, 'utf8');
  assert.match(skill, /宿主环境[\s\S]*原生 Skill/);
  assert.match(skill, /无法加载[\s\S]*停止/);
  assert.doesNotMatch(skill, /C:\\\\Users|~\/\.agents|~\/\.claude/);
});

test('covers the approved platform scenarios without promising availability', () => {
  assert.equal(existsSync(skillUrl), true, 'SKILL.md must exist');
  const skill = readFileSync(skillUrl, 'utf8');
  for (const expected of [
    '#亚马逊前台-选品调研',
    '#⌈新规⌋亚马逊listing优化',
    '#亚马逊店铺健康深度诊断',
    '#TikTok-爆款选品',
    '#跨境电商专家',
    '#1688-选品找货',
    '#RPA专家',
  ]) {
    assert.match(skill, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(skill, /服务端[\s\S]*真实可用/);
});
