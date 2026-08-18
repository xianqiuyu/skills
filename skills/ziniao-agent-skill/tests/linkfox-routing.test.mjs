import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const skill = readFileSync(new URL('../SKILL.md', import.meta.url), 'utf8');

test('routes explicit linkfox task calls to a typed Linkfox subagent when supported', () => {
  assert.match(
    skill,
    /task\(subagent_type="linkfox"[\s\S]*能明确指定代理类型为 `linkfox`[\s\S]*启动且仅启动一个 Linkfox 子代理/,
  );
});

test('passes the loaded dynamic skill content and original user goal', () => {
  assert.match(
    skill,
    /用户本次原始目标[\s\S]*已选动态子 Skill 的完整 `content`/,
  );
});

test('falls back to the sibling linkfox-os skill only before subagent submission', () => {
  assert.match(
    skill,
    /只有在 Linkfox 子代理提交之前[\s\S]*linkfox-os\/SKILL\.md/,
  );
  assert.match(
    skill,
    /子代理一旦成功提交[\s\S]*不得并行或自动再派发 `linkfox-os`/,
  );
});

test('does not substitute an untyped generic subagent for Linkfox', () => {
  assert.match(skill, /不得用任意通用代理冒充 Linkfox/);
});
