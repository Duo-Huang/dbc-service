# DBC - NestJS Monorepo 项目

基于 NestJS 框架的 Monorepo 项目，专为腾讯云 Web Function 部署优化。

## 项目结构

```
dbc/
├── apps/
│   ├── console/          # 管理后台应用
│   └── miniapp/          # 小程序后端应用
├── libs/
│   ├── auth/             # 认证模块
│   └── core/             # 核心模块
├── database/             # 数据库相关
│   ├── config/           # Migration 专用配置
│   ├── migrations/       # 数据库迁移文件
│   ├── scripts/          # 数据库初始化脚本
│   ├── data-source.ts    # TypeORM 数据源配置
│   └── tsconfig.json     # Migration TypeScript 配置
├── deployment/           # 部署配置和脚本
│   ├── console/          # Console 服务配置
│   ├── miniapp/          # Miniapp 服务配置
│   ├── layers/           # Layer 配置
│   ├── build-layer.sh    # Layer 构建脚本
│   ├── ci-deploy.sh      # 部署主脚本
│   └── detect-changes.sh # 变更检测脚本
└── compose.yml           # Docker Compose 配置
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 数据库

```bash
# 启动数据库
docker compose up -d

# 运行迁移
pnpm migration run
```

**快速命令：**

```bash
pnpm migration generate <名称>    # 生成 migration
pnpm migration run                # 运行 migrations
pnpm migration show               # 查看状态
```

📖 详细说明请查看 [Migration 指南](docs/MIGRATION.md)

### 本地开发

```bash
# Console 应用（开发模式）
pnpm run start:dev:console

# Miniapp 应用（开发模式）
pnpm run start:dev:miniapp
```

### 构建项目

```bash
# 构建所有应用
pnpm build

# 单独构建
pnpm build:console
pnpm build:miniapp
```

### 运行测试

```bash
# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e                # 所有 E2E 测试
pnpm test:e2e:console        # 仅 Console
pnpm test:e2e:miniapp        # 仅 Miniapp

# 测试覆盖率
pnpm test:cov                # 单元测试覆盖率
pnpm test:e2e:cov            # E2E 测试覆盖率

# 代码检查
pnpm lint
```

---

## 部署到腾讯云

本项目采用**腾讯云 Serverless Components** 部署方式，使用 **Layer 管理依赖**，直接运行 Nest.js。

### 架构特点

- ✅ **Layer 管理依赖** - node_modules 独立管理，部署包更小
- ✅ **智能变更检测** - 自动检测代码变更，按需部署
- ✅ **自动化部署** - 使用 SCF CLI 一键部署
- ✅ **版本自动同步** - Layer 版本自动更新

### 快速部署

```bash
# 1. 构建项目
pnpm build

# 2. 智能检测并部署（推荐）
./deployment/ci-deploy.sh

# 3. 首次部署或强制部署所有
FORCE_BUILD=true ./deployment/ci-deploy.sh
```

**工作原理**：

- 自动检测 Layer、Console、Miniapp 变更
- 根据检测结果自动部署相应组件
- Layer 使用版本管理，自动递增

**📖 详细部署文档**:

- [部署总结](docs/DEPLOYMENT_SUMMARY.md) - 完整部署流程和说明
- [部署配置](deployment/README.md) - 脚本使用和配置
- [官方文档](https://cloud.tencent.com/document/product/1154/59447) - 腾讯云 SCF CLI 文档

---

## 项目特性

- ✅ **Monorepo 架构** - 多应用统一管理（Console / Miniapp）
- ✅ **PostgreSQL 数据库** - Docker Compose 配置，自动化初始化脚本
- ✅ **Pino 日志系统** - 高性能结构化日志，自动 HTTP 请求记录
- ✅ **配置管理** - 多环境配置支持，类型安全验证
- ✅ **代码规范** - ESLint & Prettier & Husky
- ✅ **智能测试** - Jest 单元测试 + E2E 测试，按需执行
- ✅ **CI/CD** - GitHub Actions 智能变更检测，自动构建部署
- ✅ **Web Function** - 适配腾讯云 Serverless 部署

**技术栈**: NestJS 11 + TypeScript 5 + PostgreSQL 18 + Pino + pnpm

---

## 📖 文档

| 类型         | 文档                                                      | 说明                                     |
| ------------ | --------------------------------------------------------- | ---------------------------------------- |
| **配置**     | [CONFIG.md](docs/CONFIG.md)                               | 配置管理、环境变量、类型验证             |
| **环境变量** | [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | 环境变量配置完整教程（GitHub / VS Code） |
| **数据库**   | [MIGRATION.md](docs/MIGRATION.md)                         | 数据库迁移完整指南                       |
| **日志**     | [LOGGER.md](docs/LOGGER.md)                               | Pino 日志系统使用指南                    |
| **调试**     | [DEBUG_GUIDE.md](docs/DEBUG_GUIDE.md)                     | VS Code 调试配置                         |
| **测试**     | [CI_TEST_STRATEGY.md](docs/CI_TEST_STRATEGY.md)           | CI/CD 测试策略和最佳实践                 |
| **部署**     | [DEPLOYMENT_SUMMARY.md](docs/DEPLOYMENT_SUMMARY.md)       | 腾讯云部署完整指南                       |
| **脚本**     | [deployment/README.md](deployment/README.md)              | 打包脚本使用说明                         |
| **索引**     | [docs/README.md](docs/README.md)                          | 所有文档目录                             |

---

## License

[MIT](LICENSE)
