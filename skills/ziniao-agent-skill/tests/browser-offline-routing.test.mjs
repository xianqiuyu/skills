import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");

test("offline uniquely selected store opens without another user confirmation", () => {
  assert.match(
    skill,
    /目标店铺已唯一确认、任务 URL 已确定且操作内容清晰[\s\S]*?不得询问用户是否打开店铺浏览器[\s\S]*?直接执行一次 `browser open`/,
  );
});

test("missing store, URL, or operation still blocks opening", () => {
  assert.match(
    skill,
    /店铺尚未唯一确认、任务 URL 不完整或操作内容不清晰[\s\S]*?不得执行 `browser open`/,
  );
});
