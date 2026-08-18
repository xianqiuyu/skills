import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HUBU_PATHS = Object.freeze({
  get_hubu_store_list: '/open-api/hubu/store/list',
  create_hubu_rpa: '/open-api/hubu/rpa/create',
  poll_hubu_rpa: '/open-api/hubu/rpa/poll',
});

export function buildHubuInvocation(method, payloadJson) {
  const endpoint = HUBU_PATHS[method];
  if (!endpoint) {
    throw new Error(`unsupported Hubu method: ${method}`);
  }

  let payload;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    throw new Error('Hubu payload is invalid JSON');
  }
  if (payload === null || Array.isArray(payload) || typeof payload !== 'object') {
    throw new Error('Hubu payload must be a JSON object');
  }
  if (method === 'create_hubu_rpa') {
    if (typeof payload.task_params_json !== 'string') {
      throw new Error('create_hubu_rpa task_params_json must be a JSON string');
    }
    try {
      const taskParams = JSON.parse(payload.task_params_json);
      if (taskParams === null || Array.isArray(taskParams) || typeof taskParams !== 'object') {
        throw new Error('not an object');
      }
    } catch {
      throw new Error('create_hubu_rpa task_params_json is invalid JSON');
    }
  }

  return {
    args: ['dhttp', 'POST', endpoint, '--body', payloadJson],
  };
}

export function nativePackageSpec(platform, arch) {
  if (!['win32', 'darwin'].includes(platform)) {
    throw new Error(`unsupported platform: ${platform}`);
  }
  if (!['x64', 'arm64'].includes(arch)) {
    throw new Error(`unsupported architecture: ${arch}`);
  }

  return {
    packageName: `@xianqiu/open-eco-${platform}-${arch}`,
    executableName: platform === 'win32' ? 'zn-open-eco.exe' : 'zn-open-eco',
  };
}

export function resolveNativeExecutable({ npmRoot, platform, arch }) {
  const { packageName, executableName } = nativePackageSpec(platform, arch);
  const packageParts = packageName.split('/');
  const candidates = [
    join(
      npmRoot,
      '@xianqiu',
      'open-eco',
      'node_modules',
      ...packageParts,
      'bin',
      executableName,
    ),
    join(npmRoot, ...packageParts, 'bin', executableName),
  ];

  const executable = candidates.find((candidate) => existsSync(candidate));
  if (!executable) {
    throw new Error(`official native zn-open-eco executable was not found for ${platform}-${arch}`);
  }
  return executable;
}

export function spawnNative(executable, args, { stdio = 'inherit' } = {}) {
  return spawnSync(executable, args, {
    stdio,
    windowsHide: true,
  });
}

export function resolveGlobalNpmRoot() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['root', '-g'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error('unable to resolve the global npm root');
  }

  const npmRoot = result.stdout.trim();
  if (!npmRoot) {
    throw new Error('global npm root is empty');
  }
  return npmRoot;
}

async function readPayloadFromStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8').trim();
}

async function main() {
  const [method, ...extraArgs] = process.argv.slice(2);
  if (!method || extraArgs.length > 0) {
    throw new Error('usage: node hubu-dhttp.mjs <Hubu method>; pass payload JSON on stdin');
  }

  const payloadJson = await readPayloadFromStdin();
  const invocation = buildHubuInvocation(method, payloadJson);
  const npmRoot = resolveGlobalNpmRoot();
  const executable = resolveNativeExecutable({
    npmRoot,
    platform: process.platform,
    arch: process.arch,
  });
  const result = spawnNative(executable, invocation.args);
  if (result.error) {
    throw new Error(`failed to start native zn-open-eco: ${result.error.message}`);
  }
  process.exitCode = result.status ?? 1;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  });
}
