# 部署配置

本目录包含所有部署相关的配置和脚本。每个服务独立配置，互不影响。

## 📁 目录结构

```
deployment/
├── README.md                   # 部署文档（本文件）
├── ci-deploy.sh                # CI/CD 部署脚本
├── console/                    # Console 应用部署配置
│   ├── serverless.yml         # Serverless 配置
│   ├── scf_bootstrap          # Web Function 启动脚本
│   └── .serverless/           # Serverless 临时文件（自动生成，已在 .gitignore）
└── miniapp/                    # Miniapp 应用部署配置
    ├── serverless.yml         # Serverless 配置
    ├── scf_bootstrap          # Web Function 启动脚本
    └── .serverless/           # Serverless 临时文件（自动生成，已在 .gitignore）
```

## 🚀 快速部署

> **重要**：生产环境部署仅通过 CI/CD 流程，避免直接手动部署。

### CI/CD 自动部署（推荐）

推送代码到指定分支，GitHub Actions 自动触发部署：

```bash
# 推送到 main 分支 → 自动部署到生产环境
git push origin main
```

CI 流程会自动：

1. 运行 Lint & Test
2. 构建项目
3. 打包部署文件
4. 部署到腾讯云

### 本地手动部署（开发/测试环境）

仅用于开发环境测试，**不要用于生产环境**。

#### 部署 Console 应用

```bash
cd deployment/console

# 配置腾讯云凭证
export TENCENT_SECRET_ID=your-secret-id
export TENCENT_SECRET_KEY=your-secret-key

# 部署到开发环境
serverless deploy --stage dev

# 查看部署信息
serverless info

# 查看日志
serverless logs -f console

# 删除服务
serverless remove
```

#### 部署 Miniapp 应用

```bash
cd deployment/miniapp

# 配置腾讯云凭证
export TENCENT_SECRET_ID=your-secret-id
export TENCENT_SECRET_KEY=your-secret-key

# 部署到开发环境
serverless deploy --stage dev

# 查看部署信息
serverless info

# 查看日志
serverless logs -f miniapp

# 删除服务
serverless remove
```

## ⚙️ 配置说明

### serverless.yml

每个服务有独立的 `serverless.yml` 配置文件：

- `console/serverless.yml` - Console 应用配置
- `miniapp/serverless.yml` - Miniapp 应用配置

主要配置项：

- **service**: 服务名称（dbc-console / dbc-miniapp）
- **runtime**: Node.js 版本（Nodejs22.20.0）
- **region**: 部署区域（ap-chengdu）
- **memorySize**: 内存大小（512MB）
- **timeout**: 超时时间（30秒）
- **environment**: 环境变量
- **package.artifact**: 部署包路径

### scf_bootstrap

每个服务目录下都有独立的 `scf_bootstrap` 启动脚本。

腾讯云 Web Function 启动脚本，负责：

1. 设置环境变量（NODE_ENV, PORT）
2. 启动 NestJS 应用
3. 使用云函数标准 Node.js 路径

**重要**：脚本已设置执行权限，如需修改后重新设置：

```bash
chmod +x console/scf_bootstrap
chmod +x miniapp/scf_bootstrap
```

## 📦 打包部署流程

### 完整流程（推荐使用脚本）

项目提供了一键打包脚本 `ci-deploy.sh`，**支持单独或批量打包应用**。

**基本用法：**

```bash
# 1. 构建项目
pnpm run build

# 2. 运行打包脚本
./deployment/ci-deploy.sh [app]

# 参数说明:
#   console - 只打包 Console 应用
#   miniapp - 只打包 Miniapp 应用
#   all     - 打包所有应用（默认）
```

**示例：**

```bash
# 只打包 Console 应用（用于单独部署）
./deployment/ci-deploy.sh console

# 只打包 Miniapp 应用（用于单独部署）
./deployment/ci-deploy.sh miniapp

# 打包所有应用
./deployment/ci-deploy.sh all
# 或
./deployment/ci-deploy.sh
```

**脚本会自动：**

1. ✅ 检查构建产物
2. ✅ 复制 dist 目录
3. ✅ 复制 package.json 和 pnpm-lock.yaml
4. ✅ **安装生产依赖（不含 devDependencies）**
5. ✅ 复制 scf_bootstrap 启动脚本
6. ✅ 设置正确的文件权限
7. ✅ 打包成 zip 文件

**生成的部署包：**

- `serverless_package/console.zip` - Console 应用
- `serverless_package/miniapp.zip` - Miniapp 应用

**分离部署的优势：**

- 🎯 **独立打包**：可以单独打包某个应用，不影响其他
- ⚡ **节省时间**：只需打包改动的应用（例如只改了 console，就只打包 console）
- 💾 **节省空间**：避免重复打包未修改的应用
- 🔒 **降低风险**：单独部署某个应用，不影响其他服务

### 手动打包（不推荐）

如果需要手动打包，按以下步骤操作：

#### 1. 构建项目

```bash
pnpm run build
```

#### 2. 准备临时目录

```bash
mkdir -p deployment_temp/console
mkdir -p deployment_temp/miniapp
```

#### 3. 复制文件并安装生产依赖

```bash
# Console 应用
cp -r dist/ deployment_temp/console/
cp package.json deployment_temp/console/
cp pnpm-lock.yaml deployment_temp/console/
cd deployment_temp/console
pnpm install --prod --frozen-lockfile  # ← 关键：只安装生产依赖
cd ../..

# 复制启动脚本
cp deployment/console/scf_bootstrap deployment_temp/console/
chmod +x deployment_temp/console/scf_bootstrap
```

#### 4. 打包

```bash
# Console 应用
cd deployment_temp/console
zip -r ../../serverless_package/console.zip .
cd ../..

# Miniapp 应用类似...
```

#### 5. 部署

```bash
# 部署 Console
cd deployment/console
serverless deploy --stage dev

# 部署 Miniapp
cd deployment/miniapp
serverless deploy --stage dev
```

### 部署包结构

正确的部署包应该包含：

```
console.zip
├── scf_bootstrap          # ← Web Function 启动脚本（必须在根目录）
├── dist/                  # ← 构建产物
│   └── apps/
│       └── console/
│           ├── main.js
│           └── config/    # ← 配置文件（webpack 自动复制）
├── node_modules/          # ← 仅生产依赖
├── package.json
└── pnpm-lock.yaml
```

**重要说明：**

1. ⚠️ `scf_bootstrap` 必须在 zip 包的根目录
2. ⚠️ `node_modules` 只能包含生产依赖（不含 devDependencies）
3. ⚠️ `scf_bootstrap` 必须有执行权限（777 或 755）
4. ⚠️ 应用必须监听 `0.0.0.0:9000` 端口

## 🔧 环境变量

部署时可以通过环境变量配置：

| 变量                  | 说明             | 默认值     |
| --------------------- | ---------------- | ---------- |
| `NODE_ENV`            | 运行环境         | production |
| `SERVER_CONSOLE_PORT` | Console 端口     | 9000       |
| `SERVER_MINIAPP_PORT` | Miniapp 端口     | 9000       |
| `TENCENT_SECRET_ID`   | 腾讯云 SecretId  | -          |
| `TENCENT_SECRET_KEY`  | 腾讯云 SecretKey | -          |

在 `serverless.yml` 中可以添加更多环境变量：

```yaml
functions:
    console:
        environment:
            NODE_ENV: production
            SERVER_CONSOLE_PORT: 9000
            CUSTOM_VAR: value
```

## 📚 相关文档

- [腾讯云 Web Function](https://cloud.tencent.com/document/product/1154/59341)
- [Serverless Framework](https://www.serverless.com/framework/docs)
- [NestJS 部署](https://docs.nestjs.com/deployment)

## 🐛 故障排查

### 部署失败

1. 检查腾讯云凭证是否正确
2. 确认部署包大小未超过限制（50MB 压缩包 / 500MB 解压后）
3. 查看 Serverless Framework 日志

### 应用无法启动

1. 检查 `scf_bootstrap_*` 脚本权限
2. 确认 Node.js 版本匹配（Nodejs22.20.0）
3. 检查环境变量配置
4. 查看云函数日志

### 配置未生效

1. 确认 `config/` 目录已包含在部署包中
2. 检查 `NODE_ENV` 环境变量
3. 验证配置文件格式（YAML）

## 💡 最佳实践

1. **独立部署**：Console 和 Miniapp 完全独立，可单独部署和回滚
2. **CI/CD 控制**：生产环境部署仅通过 CI/CD，避免误操作
3. **分环境部署**：使用 `--stage` 区分开发/生产环境
4. **版本管理**：在 `serverless.yml` 中使用版本号
5. **监控告警**：配置云函数监控和日志告警
6. **灰度发布**：使用 API 网关流量管理
7. **回滚策略**：服务独立，可单独回滚而不影响其他服务

## ✨ 独立部署的优势

- ✅ **降低风险**：一个服务的问题不影响另一个
- ✅ **灵活发布**：可以按需单独发布某个服务
- ✅ **独立回滚**：出问题时只回滚有问题的服务
- ✅ **清晰职责**：配置文件独立，易于管理
- ✅ **CI/CD 优化**：可以配置只在相关代码改变时才部署
