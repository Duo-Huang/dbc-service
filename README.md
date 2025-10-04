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
└── deployment/           # 部署配置
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

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

本项目采用**腾讯云 Web Function**部署方式，这是腾讯云官方推荐的 Nest.js 部署方案。

### 🎯 为什么选择 Web Function？

✅ **原生支持** - 直接运行 Nest.js，无需适配层
✅ **配置简单** - 只需修改监听端口和添加启动脚本
✅ **官方推荐** - 腾讯云官方文档支持
✅ **成本低廉** - 按量计费，小流量几乎免费
✅ **自动扩展** - 根据流量自动扩缩容

**官方文档**: [快速部署 Nestjs 框架](https://cloud.tencent.com/document/product/1154/59341)

### 快速部署

#### 1. 自动部署（推荐）

```bash
# 推送代码到 main 分支
git push origin main

# GitHub Actions 会自动:
# - 运行 Lint & Test
# - 构建项目
# - 安装生产依赖
# - 打包成 console.zip 和 miniapp.zip
```

#### 2. 上传到腾讯云

1. 下载 GitHub Actions 生成的部署包
2. 访问 [Serverless 控制台](https://console.cloud.tencent.com/sls)
3. 新建应用 → Web 应用 → Nest.js 框架
4. 本地上传 → 选择 `console.zip` 或 `miniapp.zip`
5. 完成部署

#### 3. 本地手动部署

```bash
# 1. 构建
pnpm build

# 2. 安装生产依赖
rm -rf node_modules
pnpm install --prod

# 3. 准备部署包
mkdir -p deploy/console
cp -r dist/ deploy/console/
cp -r node_modules/ deploy/console/
cp scf_bootstrap_console deploy/console/scf_bootstrap
chmod 777 deploy/console/scf_bootstrap

# 4. 打包
cd deploy/console && zip -r console.zip . && cd ../..

# 5. 上传到腾讯云控制台
```

### 部署包结构

```
console.zip
├── dist/                  # 构建产物
│   └── apps/console/main.js
├── node_modules/          # 生产依赖（必须包含）
├── scf_bootstrap          # 启动脚本（监听 0.0.0.0:9000）
└── package.json
```

### 详细文档

📖 [腾讯云 Web Function 部署指南](TENCENT_WEBFUNCTION_DEPLOYMENT.md)

---

## CI/CD Pipeline

项目配置了完整的 GitHub Actions CI/CD 流程：

```
推送代码
  ↓
┌─────────────┬─────────────┐
│   Lint      │    Test     │  并行执行
└──────┬──────┴──────┬──────┘
       └──────┬───────┘
              ↓
       ┌─────────────┐
       │   Build     │
       └──────┬──────┘
              ↓
       ┌─────────────┐
       │   Package   │  打包 zip (含 node_modules)
       └──────┬──────┘
              ↓
       ┌─────────────┐
       │   Upload    │  上传 Artifact
       └─────────────┘
```

**工作流文件**: `.github/workflows/deploy-tencent-webfunction.yml`

---

## 本地测试

### 测试编译后的代码

```bash
# 构建项目
pnpm build

# 设置环境变量（模拟 Web Function 环境）
export PORT=9000
export HOST=0.0.0.0

# 运行
node dist/apps/console/main.js

# 访问测试
curl http://localhost:9000
```

---

## 项目特性

### 已配置的功能

- ✅ **Monorepo 架构** - 多应用统一管理
- ✅ **共享库** - Auth、Core 等通用模块
- ✅ **TypeScript** - 类型安全
- ✅ **ESLint & Prettier** - 代码规范
- ✅ **Jest** - 单元测试
- ✅ **Husky** - Git Hooks
- ✅ **GitHub Actions** - CI/CD 自动化
- ✅ **Web Function Ready** - 适配腾讯云部署

### 技术栈

- **框架**: NestJS 11
- **语言**: TypeScript 5
- **包管理**: pnpm
- **测试**: Jest
- **部署**: 腾讯云 Web Function

---

## 环境要求

- Node.js >= 20
- pnpm >= 9

---

## 费用估算

### 腾讯云 Web Function 免费额度（每月）

- 调用次数：100万次
- 资源使用：40万 GBs
- 外网流量：1GB

### 示例：小程序后端

- 100万次调用/月
- 512MB 内存，200ms 执行时间
- **月费用**: 约 ¥6.66（超出免费额度部分）

非常适合初创项目！💰

---

## 相关资源

- [NestJS 文档](https://docs.nestjs.com)
- [腾讯云 Serverless](https://cloud.tencent.com/product/sls)
- [腾讯云 Web Function 文档](https://cloud.tencent.com/document/product/1154/59341)

---

## License

[MIT](LICENSE)
