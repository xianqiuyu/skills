import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

let hubu = {};
try {
  hubu = await import('../scripts/hubu-dhttp.mjs');
} catch {
  // RED phase: assertions below describe the missing production behavior.
}

test('preserves nested task_params_json as one unchanged CLI argument', () => {
  assert.equal(typeof hubu.buildHubuInvocation, 'function');

  const payload = '{"task_params_json":"{\\"name\\":\\"probe\\",\\"scriptList\\":[{\\"scriptId\\":\\"1045\\"}]}"}';
  const invocation = hubu.buildHubuInvocation('create_hubu_rpa', payload);

  assert.deepEqual(invocation.args, [
    'dhttp',
    'POST',
    '/open-api/hubu/rpa/create',
    '--body',
    payload,
  ]);
});

test('maps only the three supported Hubu methods', () => {
  assert.equal(typeof hubu.buildHubuInvocation, 'function');

  assert.equal(
    hubu.buildHubuInvocation('get_hubu_store_list', '{}').args[2],
    '/open-api/hubu/store/list',
  );
  assert.equal(
    hubu.buildHubuInvocation('poll_hubu_rpa', '{"planId":"p1"}').args[2],
    '/open-api/hubu/rpa/poll',
  );
  assert.throws(
    () => hubu.buildHubuInvocation('create_hubu_task', '{}'),
    /unsupported Hubu method/,
  );
});

test('rejects malformed or non-object payloads before invoking the CLI', () => {
  assert.equal(typeof hubu.buildHubuInvocation, 'function');

  assert.throws(
    () => hubu.buildHubuInvocation('create_hubu_rpa', '{bad json}'),
    /payload is invalid JSON/,
  );
  assert.throws(
    () => hubu.buildHubuInvocation('create_hubu_rpa', '[]'),
    /payload must be a JSON object/,
  );
});

test('validates create_hubu_rpa nested task_params_json before invoking the CLI', () => {
  assert.equal(typeof hubu.buildHubuInvocation, 'function');

  assert.throws(
    () => hubu.buildHubuInvocation('create_hubu_rpa', '{"task_params_json":{}}'),
    /task_params_json must be a JSON string/,
  );
  assert.throws(
    () => hubu.buildHubuInvocation('create_hubu_rpa', '{"task_params_json":"{bad}"}'),
    /task_params_json is invalid JSON/,
  );
});

test('resolves official native package names for Windows and macOS', () => {
  assert.equal(typeof hubu.nativePackageSpec, 'function');

  assert.deepEqual(hubu.nativePackageSpec('win32', 'x64'), {
    packageName: '@xianqiu/open-eco-win32-x64',
    executableName: 'zn-open-eco.exe',
  });
  assert.deepEqual(hubu.nativePackageSpec('win32', 'arm64'), {
    packageName: '@xianqiu/open-eco-win32-arm64',
    executableName: 'zn-open-eco.exe',
  });
  assert.deepEqual(hubu.nativePackageSpec('darwin', 'x64'), {
    packageName: '@xianqiu/open-eco-darwin-x64',
    executableName: 'zn-open-eco',
  });
  assert.deepEqual(hubu.nativePackageSpec('darwin', 'arm64'), {
    packageName: '@xianqiu/open-eco-darwin-arm64',
    executableName: 'zn-open-eco',
  });
  assert.throws(() => hubu.nativePackageSpec('linux', 'x64'), /unsupported platform/);
});

test('locates the native CLI bundled under the official global npm package', () => {
  assert.equal(typeof hubu.resolveNativeExecutable, 'function');

  const root = mkdtempSync(join(tmpdir(), 'hubu-native-'));
  try {
    const expected = join(
      root,
      '@xianqiu',
      'open-eco',
      'node_modules',
      '@xianqiu',
      'open-eco-win32-x64',
      'bin',
      'zn-open-eco.exe',
    );
    mkdirSync(dirname(expected), { recursive: true });
    writeFileSync(expected, 'fixture');

    assert.equal(
      hubu.resolveNativeExecutable({ npmRoot: root, platform: 'win32', arch: 'x64' }),
      expected,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('passes nested JSON unchanged through the child-process argument array', () => {
  assert.equal(typeof hubu.spawnNative, 'function');

  const payload = '{"task_params_json":"{\\"name\\":\\"probe\\"}"}';
  const probe = 'console.log(JSON.stringify(process.argv.slice(1)))';
  const result = hubu.spawnNative(
    process.execPath,
    ['-e', probe, '--', 'dhttp', 'POST', '/probe', '--body', payload],
    { stdio: 'pipe' },
  );

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout.toString()), [
    'dhttp',
    'POST',
    '/probe',
    '--body',
    payload,
  ]);
});

test('discovers the active global npm root used by the installed CLI', () => {
  assert.equal(typeof hubu.resolveGlobalNpmRoot, 'function');

  const npmRoot = hubu.resolveGlobalNpmRoot();

  assert.equal(existsSync(join(npmRoot, '@xianqiu', 'open-eco')), true);
});
