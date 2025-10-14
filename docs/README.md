# DBC 项目文档

本目录包含 DBC 项目的所有文档。

## 📚 文档列表

### 配置相关

- [**CONFIG.md**](./CONFIG.md) - 配置系统使用指南
    - 配置文件结构
    - 配置加载优先级
    - 环境变量覆盖
    - 配置验证
    - 在代码中使用配置
    - 添加新配置项
    - 常见问题

- [**ENVIRONMENT_VARIABLES.md**](./ENVIRONMENT_VARIABLES.md) - 环境变量配置指南
    - 环境变量清单（GitHub Actions / 应用运行时）
    - GitHub Web 界面配置教程
    - VS Code 本地开发配置（.env / launch.json）
    - 配置验证和故障排查
    - 安全最佳实践

### 数据库相关

- [**MIGRATION.md**](./MIGRATION.md) - 数据库迁移指南
    - Migration 核心概念
    - 快速开始和常用命令
    - 开发工作流程
    - Entity 设计最佳实践
    - 命名规范和技术细节
    - 故障排查和解决方案

### 日志相关

- [**LOGGER.md**](./LOGGER.md) - Pino 日志系统使用指南
    - 日志系统配置
    - 使用方式（NestJS Logger vs PinoLogger）
    - 结构化日志
    - HTTP 请求日志
    - 最佳实践

### 调试相关

- [**DEBUG_GUIDE.md**](./DEBUG_GUIDE.md) - VS Code 调试指南
    - 调试配置说明
    - 调试技巧
    - 快捷键参考
    - 常见问题解决

### CI/CD 和测试

- [**CI_TEST_STRATEGY.md**](./CI_TEST_STRATEGY.md) - CI/CD 测试策略
    - 智能按需测试策略
    - 变更检测脚本设计
    - GitHub Actions 工作流配置
    - 并行执行优化
    - 精确的 dependencies 检测（jq）
    - 构建产物复用
    - 技术细节和最佳实践

### 部署相关

- [**DEPLOYMENT_SUMMARY.md**](./DEPLOYMENT_SUMMARY.md) - 部署总结文档
    - Serverless Components + Layer 架构
    - 智能变更检测（jq 精确比较）
    - 部署流程和配置
    - 常见问题和最佳实践

## 🚀 快速开始

### 本地开发

1. 安装依赖：`pnpm install`
2. 启动数据库：`docker compose up -d`
3. 运行迁移：`pnpm migration run`
4. 启动开发服务：`pnpm start:dev:console` 或 `pnpm start:dev:miniapp`
5. 调试应用：按 `F5` 或查看 [DEBUG_GUIDE.md](./DEBUG_GUIDE.md)

### 配置管理

- 默认配置：`config/default.yaml`
- 环境配置：`config/development.yaml` 或 `config/production.yaml`
- 环境变量映射：`config/custom-environment-variables.yaml`

详细说明请查看 [CONFIG.md](./CONFIG.md)

### 数据库管理

```bash
# 生成 migration
pnpm migration generate AddNewFeature

# 运行 migrations
pnpm migration run

# 查看状态
pnpm migration show

# 回滚（如需要）
pnpm migration revert
```

详细说明请查看 [MIGRATION.md](./MIGRATION.md)

## 📝 文档维护

添加新功能时，请同步更新相关文档：

- 新增配置项 → 更新 `CONFIG.md`
- 数据库 schema 变更 → 生成 migration，更新 `MIGRATION.md`（如需要）
- 日志相关变更 → 更新 `LOGGER.md`
- 新增调试场景 → 更新 `DEBUG_GUIDE.md`
- 测试策略变更 → 更新 `CI_TEST_STRATEGY.md`
- 部署架构变更 → 更新 `DEPLOYMENT_SUMMARY.md` 和 `deployment/README.md`

## 🔗 相关资源

- [项目 README](../README.md) - 项目主页
- [NestJS 官方文档](https://docs.nestjs.com/)
- [TypeORM 官方文档](https://typeorm.io/)
- [Config 包文档](https://github.com/node-config/node-config)
- [Class Validator 文档](https://github.com/typestack/class-validator)
- [Pino 日志文档](https://getpino.io/)
