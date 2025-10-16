#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

// 获取所有命令行参数
const argv = process.argv.slice(2); // [cmd, name, ...maybeTypeormArgs/--prod]

// 拆分具体含义
const cmd = argv[0];
let name = argv[1];

const isProd = argv.includes('--prod'); // 是否是生产环境模式(非local, 都是生产环境模式, 用于加载production.yaml的配置, 各个部署环境会通过环境变量覆盖production.yaml的配置)
const NODE_ENV = isProd ? 'production' : 'development';

const NODE_CONFIG_DIR = path.resolve(__dirname, '../config');
const DATA_SOURCE_PATH = path.resolve(__dirname, '../data-source.ts');

// 除去被本地脚本消耗的参数，其余一律透传
// 去掉 cmd（0）、name（1）、和所有 '--prod'
const restArgs = argv
    .slice(cmd === undefined ? 0 : 2) // 保证无 cmd/null 情况
    .filter((arg) => arg !== '--prod' && arg !== name);

// pnpm 命令（跨平台兼容）
const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

// 调用 typeorm CLI（通过 pnpm exec）
function runTypeorm(argsArr) {
    // 拼接透传参数
    const allArgs = argsArr.concat(restArgs);
    const result = spawnSync(
        pnpmCmd,
        ['exec', 'typeorm-ts-node-commonjs', ...allArgs],
        {
            stdio: 'inherit',
            env: {
                ...process.env,
                NODE_ENV,
                NODE_CONFIG_DIR,
                // 指定 TypeScript 配置文件
                TS_NODE_PROJECT: path.resolve(__dirname, '../tsconfig.json'),
            },
        },
    );
    if (result.error) {
        console.error(result.error);
        process.exit(1);
    }
    if (result.status !== 0) {
        process.exit(result.status);
    }
}

switch (cmd) {
    case 'generate':
        if (!name || name === '--prod') {
            console.error(
                'Missing migration name!\nUsage: node scripts/migration-helper.js generate MigrationName [typeorm_options] [--prod]',
            );
            process.exit(1);
        }
        runTypeorm([
            'migration:generate',
            `database/migrations/${name}`,
            '-d',
            DATA_SOURCE_PATH,
        ]);
        break;
    case 'create':
        if (!name || name === '--prod') {
            console.error(
                'Missing migration name!\nUsage: node scripts/migration-helper.js create MigrationName [typeorm_options] [--prod]',
            );
            process.exit(1);
        }
        runTypeorm(['migration:create', `database/migrations/${name}`]);
        break;
    case 'run':
        runTypeorm(['migration:run', '-d', DATA_SOURCE_PATH]);
        break;
    case 'revert':
        runTypeorm(['migration:revert', '-d', DATA_SOURCE_PATH]);
        break;
    case 'show':
        runTypeorm(['migration:show', '-d', DATA_SOURCE_PATH]);
        break;
    default:
        console.error(`Unknown command: ${cmd}`);
        console.error('Usage:');
        console.error(
            '  node scripts/migration-helper.js generate MigrationName [typeorm_options] [--prod]',
        );
        console.error(
            '  node scripts/migration-helper.js create MigrationName [typeorm_options] [--prod]',
        );
        console.error(
            '  node scripts/migration-helper.js run [typeorm_options] [--prod]',
        );
        console.error(
            '  node scripts/migration-helper.js revert [typeorm_options] [--prod]',
        );
        console.error(
            '  node scripts/migration-helper.js show [typeorm_options] [--prod]',
        );
        process.exit(1);
}
