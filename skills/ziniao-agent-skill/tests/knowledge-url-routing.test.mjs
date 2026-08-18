import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const skill = readFileSync(new URL('../SKILL.md', import.meta.url), 'utf8');

test('does not reload knowledge only to discover a URL when a complete URL already exists', () => {
  assert.match(
    skill,
    /已有可验证的完整绝对 URL[\s\S]*不为获取 URL 再执行 `knowledge query` 或 `knowledge get`/,
  );
});

test('treats knowledge query as discovery rather than final URL evidence', () => {
  assert.match(
    skill,
    /`knowledge query`[\s\S]*只用于发现候选知识库并选出真实 `kb_id`/,
  );
  assert.match(
    skill,
    /不得把 `knowledge query` 返回的 URL[^\n]*作为最终 URL/,
  );
});

test('loads missing browser URLs with kb and selected-store context', () => {
  assert.match(
    skill,
    /没有可验证的完整绝对 URL[\s\S]*knowledge get --kb-id "<selected kb_id>" --platform-id "<private platform_id>" --site-id "<private site_id>"/,
  );
  assert.match(skill, /最终知识库 URL 只从本次 `knowledge get` 的真实响应中选择/);
});
