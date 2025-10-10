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

### 调试相关

- [**DEBUG_GUIDE.md**](./DEBUG_GUIDE.md) - VS Code 调试指南
    - 调试配置说明
    - 调试技巧
    - 快捷键参考
    - 常见问题解决

### 部署相关

- [**DEPLOYMENT_SUMMARY.md**](./DEPLOYMENT_SUMMARY.md) - 部署总结文档
    - 部署流程
    - 部署配置
    - 部署注意事项

## 🚀 快速开始

### 本地开发

1. 安装依赖：`pnpm install`
2. 启动开发服务：`pnpm start:dev:console` 或 `pnpm start:dev:miniapp`
3. 调试应用：按 `F5` 或查看 [DEBUG_GUIDE.md](./DEBUG_GUIDE.md)

### 配置管理

- 默认配置：`config/default.yaml`
- 环境配置：`config/development.yaml` 或 `config/production.yaml`
- 环境变量映射：`config/custom-environment-variables.yaml`

详细说明请查看 [CONFIG.md](./CONFIG.md)

## 📝 文档维护

添加新功能时，请同步更新相关文档：

- 新增配置项 → 更新 `CONFIG.md`
- 新增调试场景 → 更新 `DEBUG_GUIDE.md`
- 部署变更 → 更新 `DEPLOYMENT_SUMMARY.md`

## 🔗 相关资源

- [项目 README](../README.md) - 项目主页
- [NestJS 官方文档](https://docs.nestjs.com/)
- [Config 包文档](https://github.com/node-config/node-config)
- [Class Validator 文档](https://github.com/typestack/class-validator)
