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
│   ├── migration/        # 数据库迁移（待实现）
│   └── scripts/          # 数据库初始化脚本
├── deployment/           # 部署配置
└── compose.yml           # Docker Compose 配置
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 数据库

```bash
# 1. 启动本地数据库（使用 Docker Compose）
docker compose up -d
```

**数据库信息：**

- 数据库名：`dbc_local`
- 端口：`5433` (映射到容器的 5432)
- 用户：
    - `dbc_migrator` - 数据库迁移用户
    - `dbc_miniapp_writer` - Miniapp 应用用户
    - `dbc_console_writer` - Console 应用用户
    - `dbc_readonly` - 只读用户

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

# 测试覆盖率
pnpm run test:cov

# 代码检查
pnpm lint
```

---

## 部署到腾讯云

本项目采用**腾讯云 Web Function** 部署方式，直接运行 Nest.js，无需适配器或框架。

### 快速部署

```bash
# 1. 构建并打包
pnpm build
./deployment/ci-deploy.sh console  # 或 miniapp

# 2. 上传到腾讯云控制台
# 访问: https://console.cloud.tencent.com/sls
# 上传: serverless_package/console.zip
```

或推送到 `master` 分支，GitHub Actions 自动构建打包。

**📖 详细部署文档**:

- [部署总结](docs/DEPLOYMENT_SUMMARY.md) - 完整部署流程和说明
- [部署配置](deployment/README.md) - 脚本使用和配置
- [官方文档](https://cloud.tencent.com/document/product/1154/59341) - 腾讯云 Web Function 文档

---

## 项目特性

- ✅ **Monorepo 架构** - 多应用统一管理（Console / Miniapp）
- ✅ **PostgreSQL 数据库** - Docker Compose 配置，自动化初始化脚本
- ✅ **Pino 日志系统** - 高性能结构化日志，自动 HTTP 请求记录
- ✅ **配置管理** - 多环境配置支持，类型安全验证
- ✅ **代码规范** - ESLint & Prettier & Husky
- ✅ **自动化测试** - Jest 单元测试
- ✅ **CI/CD** - GitHub Actions 自动构建部署
- ✅ **Web Function** - 适配腾讯云 Serverless 部署

**技术栈**: NestJS 11 + TypeScript 5 + PostgreSQL 18 + Pino + pnpm

---

## 📖 文档

| 类型     | 文档                                                | 说明                         |
| -------- | --------------------------------------------------- | ---------------------------- |
| **配置** | [CONFIG.md](docs/CONFIG.md)                         | 配置管理、环境变量、类型验证 |
| **日志** | [LOGGER.md](docs/LOGGER.md)                         | Pino 日志系统使用指南        |
| **调试** | [DEBUG_GUIDE.md](docs/DEBUG_GUIDE.md)               | VS Code 调试配置             |
| **部署** | [DEPLOYMENT_SUMMARY.md](docs/DEPLOYMENT_SUMMARY.md) | 腾讯云部署完整指南           |
| **脚本** | [deployment/README.md](deployment/README.md)        | 打包脚本使用说明             |
| **索引** | [docs/README.md](docs/README.md)                    | 所有文档目录                 |

---

## License

[MIT](LICENSE)
