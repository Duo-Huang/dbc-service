# DBC - NestJS Monorepo 项目

基于 NestJS 框架的 Monorepo 项目

## 项目结构

```
dbc/
├── apps/
│   ├── console/          # 管理后台应用
│   └── miniprogram/          # 小程序后端应用
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
│   ├── miniprogram/      # miniprogram 服务配置
│   ├── layers/           # Layer 配置
│   ├── build-layer.sh    # Layer 构建脚本
│   ├── ci-deploy.sh      # 部署主脚本
│   └── detect-changes.sh # 变更检测脚本
└── compose.yml           # Docker Compose 配置
```

## 快速开始

### 1. 环境配置

1. **确保 Node.js 版本**：

    ```bash
    # 检查 Node.js 版本 (必须是 20.19.5)
    node --version

    # 如果版本不匹配，请使用 nvm 切换
    nvm use
    ```

2. **复制环境变量模板**：

    ```bash
    cp .env.example .env
    ```

3. **修改配置**：
    - 编辑 `.env` 文件，设置本地开发环境的实际值
    - 非敏感配置可直接修改 `config/development.yaml`, 支持本地和生产(dev & prod) 差异化配置, 会提交, 请勿存放敏感信息!!!

4. **加载环境变量到 shell**：

    ```bash
    source .env
    ```

5. **启动应用**：
    ```bash
    pnpm run start:dev:console    # Console 应用
    pnpm run start:dev:miniprogram    # Miniprogram 应用
    ```

**说明**：

- 项目使用 `config` 包加载 YAML 配置文件
- `.env` 文件不会被项目自动加载，仅用于本地开发时注入环境变量
- 环境变量主要用于部署时覆盖 YAML 配置中的敏感信息

**配置优先级**：环境变量 > config/\*.yaml 文件

📖 **详细配置说明**：[环境变量配置指南](docs/ENVIRONMENT_VARIABLES.md)

### 2. 安装和启动

```bash
# 安装依赖
pnpm install

# 启动数据库
docker compose up -d

# 运行数据库迁移
pnpm migration run
```

### 3. 开发命令

```bash
# 构建项目
pnpm build                    # 构建所有应用
pnpm build:console            # 单独构建 Console
pnpm build:miniprogram        # 单独构建 Miniprogram

# 运行测试
pnpm test                    # 单元测试
pnpm test:e2e                # 所有 E2E 测试
pnpm test:e2e:console        # 仅 Console E2E 测试
pnpm test:e2e:miniprogram    # 仅 <iniprogram E2E 测试
pnpm test:cov                # 单元测试覆盖率
pnpm test:e2e:cov            # E2E 测试覆盖率

# 代码检查
pnpm lint                    # ESLint 检查
pnpm lint:fix                # 自动修复 ESLint 问题

# 数据库迁移
pnpm migration generate <名称>    # 根据entities生成 migration
pnpm migration run                # 运行 migrations
pnpm migration show               # 查看 migration 状态
pnpm migration revert            # 回滚最后一个 migration
```

**常用开发流程**：

```bash
# 1. 启动开发环境
docker compose up -d          # 启动数据库
source .env                   # 加载环境变量
pnpm run start:dev:console   # 启动 Console 应用

# 2. 开发过程中
pnpm migration generate AddUserTable    # 生成新的 migration
pnpm test                              # 运行测试
pnpm lint:fix                          # 修复代码格式

# 3. 部署前检查
pnpm build                            # 构建项目
pnpm test:all                         # 运行所有测试
```

📖 **详细开发指南**：[配置管理](docs/CONFIG.md) | [数据库迁移](docs/MIGRATION.md) | [日志系统](docs/LOGGER.md)

---

## 部署到腾讯云

本项目采用**腾讯云 Serverless Components** 部署方式，使用 **Layer 管理依赖**，直接运行 Nest.js。

### 架构特点

- ✅ **Layer 管理依赖** - node_modules 独立管理，部署包更小
- ✅ **智能变更检测** - 基于 tag 的变更检测，精准可靠
- ✅ **手动触发部署** - 三个独立 workflow，避免意外部署
- ✅ **版本一致性** - PROD 只能从 `dev-latest` 部署
- ✅ **数据库 Migration** - 部署前自动运行数据库迁移
- ✅ **单次回滚** - PROD 支持回滚到上一版本

### GitHub Actions 部署（推荐）

本项目提供三个手动触发的 workflow：

- **Deploy to DEV** - 部署到 DEV 环境，支持从任意分支部署
- **Deploy to PROD** - 从 `dev-latest` 部署到生产，需要确认码
- **Rollback PROD** - 回滚生产环境到上一版本

**快速开始：**

```bash
# 1. 在 GitHub Actions 页面选择对应的 workflow
# 2. 点击 "Run workflow"
# 3. 填写必要参数（如确认码）
# 4. 等待部署完成
```

**Tag 管理：**

- `dev-latest` - DEV 当前版本
- `prod-latest` - PROD 当前版本
- `prod-prev` - PROD 上一版本（用于回滚）

📖 **详细 CI/CD 流程和策略**：[CI_TEST_STRATEGY.md](docs/CI_TEST_STRATEGY.md)

### 本地部署

```bash
# 1. 构建项目
pnpm build

# 2. 智能检测并部署（推荐）
./deployment/ci-deploy.sh

# 3. 首次部署或强制部署所有
FORCE_BUILD=true ./deployment/ci-deploy.sh
```

**工作原理**：

- 自动检测 Layer、Console、Miniprogram 变更
- 根据检测结果自动部署相应组件
- Layer 使用版本管理，自动递增

**环境变量配置**：

```bash
# 本地开发
cp .env.example .env
# 编辑 .env 文件设置本地配置

# GitHub Actions 部署
# 在仓库 Settings → Secrets and variables → Actions -> Secrets 中配置
```

**📖 详细部署文档**:

- [CI/CD 策略](docs/CI_TEST_STRATEGY.md) - 测试和部署策略
- [部署总结](docs/DEPLOYMENT_SUMMARY.md) - 完整部署流程和说明
- [环境变量配置](docs/ENVIRONMENT_VARIABLES.md) - GitHub 和本地环境变量配置
- [部署脚本](deployment/README.md) - 脚本使用和配置

---

## 项目特性

- ✅ **Monorepo 架构** - 多应用统一管理（Console / Miniprogram）
- ✅ **PostgreSQL 数据库** - Docker Compose 配置，自动化初始化脚本
- ✅ **Pino 日志系统** - 高性能结构化日志，自动 HTTP 请求记录
- ✅ **配置管理** - 多环境配置支持，类型安全验证
- ✅ **代码规范** - ESLint & Prettier & Husky
- ✅ **智能测试** - Jest 单元测试 + E2E 测试，按需执行
- ✅ **CI/CD** - GitHub Actions 智能变更检测，自动构建部署
- ✅ **Web Function** - 适配腾讯云 Serverless 部署
- ✅ **版本一致性** - 本地开发与生产环境 Node.js 版本严格一致

**技术栈**: NestJS 11 + TypeScript 5 + PostgreSQL 18 + Pino + pnpm

**Node.js 版本**: 20.19.5 (与腾讯云 Serverless 环境保持一致)

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
