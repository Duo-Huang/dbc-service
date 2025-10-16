# 腾讯云 Serverless 部署总结

## 🎯 部署方案概述

本项目采用**腾讯云 Serverless Components** 部署方式，使用 **Layer 管理依赖**，实现高效的 Nest.js 应用部署。

### 核心优势

| 特性           | Serverless Components + Layer | 传统 Web Function |
| -------------- | ----------------------------- | ----------------- |
| **依赖管理**   | ✅ Layer 独立管理             | ❌ 每次打包进 zip |
| **部署包大小** | ✅ 小（~1MB）                 | ❌ 大（~100MB）   |
| **部署速度**   | ✅ 快（增量更新）             | ❌ 慢（全量上传） |
| **版本管理**   | ✅ Layer 自动版本控制         | ❌ 无版本控制     |
| **自动化程度** | ✅ 智能变更检测               | ❌ 手动判断       |

### 相关文档

- 📖 **CI/CD 策略**：[CI_TEST_STRATEGY.md](CI_TEST_STRATEGY.md) - 测试和部署策略
- 📖 **环境变量配置**：[ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - 环境变量配置指南

---

## 🏗️ 架构设计

### 组件结构

```
部署架构
├── Layer (dbc-deps-layer)
│   └── node_modules/          # 所有生产依赖
│       ├── @nestjs/
│       ├── typeorm/
│       └── ...
│
├── Console Function
│   ├── dist/apps/console/     # 构建产物
│   ├── scf_bootstrap          # 启动脚本
│   └── serverless.yml         # 配置文件
│
└── Miniapp Function
    ├── dist/apps/miniapp/     # 构建产物
    ├── scf_bootstrap          # 启动脚本
    └── serverless.yml         # 配置文件

部署脚本结构
deployment/
├── build-layer.sh             # Layer 构建脚本
├── ci-deploy.sh               # 部署主脚本
├── detect-changes.sh          # 变更检测脚本
├── console/
│   ├── scf_bootstrap          # Console 启动脚本
│   └── serverless.yml         # Console 配置
├── miniapp/
│   ├── scf_bootstrap          # Miniapp 启动脚本
│   └── serverless.yml         # Miniapp 配置
└── layers/dep/
    └── serverless.yml         # Layer 配置
```

### 部署流程

```
1. 检测变更
   ├── dependencies 字段变更？ → 部署 Layer
   ├── apps/console/ 变更？    → 部署 Console
   ├── apps/miniapp/ 变更？    → 部署 Miniapp
   └── libs/、config/ 变更？   → 部署 Console + Miniapp

2. 部署 Layer（如果需要）
   ├── 构建 node_modules
   ├── 部署到腾讯云
   ├── 版本号 +1
   └── 更新服务配置中的 Layer 版本

3. 部署应用（按需）
   ├── 部署 Console
   └── 部署 Miniapp
```

---

## 🚀 快速部署

### 前置要求

1. **安装 SCF CLI**

    ```bash
    # 首次使用 pnpm 全局安装需要先配置
    pnpm setup
    source ~/.zshrc  # 或 source ~/.bashrc (根据你的 shell)

    # 安装 SCF CLI
    pnpm add -g serverless-cloud-framework@1.3.2

    # 验证安装
    scf --version
    ```

    **说明：**
    - `pnpm setup` 会配置全局 bin 目录（`PNPM_HOME`）
    - 只需要首次运行一次，之后就不需要了
    - 如果遇到 `ERR_PNPM_NO_GLOBAL_BIN_DIR` 错误，运行 `pnpm setup` 即可解决

2. **配置腾讯云凭证**

    ```bash
    # 方式1: 环境变量
    export TENCENT_SECRET_ID=your-secret-id
    export TENCENT_SECRET_KEY=your-secret-key

    # 方式2: 配置文件
    # ~/.serverlessrc
    ```

    📖 详细配置教程请查看：[环境变量配置指南](./ENVIRONMENT_VARIABLES.md)

### 部署步骤

#### 方式一：智能检测部署（推荐）

```bash
# 1. 构建项目
pnpm build

# 2. 智能检测并部署到 DEV 环境（默认）
./deployment/ci-deploy.sh

# 3. 部署到 PRODUCTION 环境 [禁止本地操作生产]
STAGE=prod ./deployment/ci-deploy.sh

# 脚本会自动:
# - 检测 Layer、Console、Miniapp 变更
# - 根据检测结果自动部署相应组件
# - Layer 版本自动更新
```

**环境说明：**

- `dev` - 开发/测试环境（默认）
- `prod` - 生产环境

#### 方式二：强制部署所有（首次部署）

```bash
# 1. 构建项目
pnpm build

# 2. 强制部署所有组件
FORCE_BUILD=true ./deployment/ci-deploy.sh

# 会强制部署:
# - Layer
# - Console
# - Miniapp
```

#### 方式三：GitHub Actions 自动化部署（推荐）

本项目采用手动触发的部署策略，通过三个独立的 workflow 管理部署和回滚。

**Workflows：**

- `deploy-dev.yml` - DEV 环境部署
- `deploy-prod.yml` - 生产环境部署（从 `dev-latest` 部署）
- `rollback-prod.yml` - 生产环境回滚

**核心特性：**

- ✅ 手动触发，避免意外部署
- ✅ 基于 tag 的变更检测（`dev-latest`, `prod-latest`, `prod-prev`）
- ✅ 版本一致性（PROD 只能从 `dev-latest` 部署）
- ✅ 自动运行数据库 migration
- ✅ 支持单次回滚

📖 **详细的 CI/CD 流程和策略请查看：[CI_TEST_STRATEGY.md](./CI_TEST_STRATEGY.md)**

---

## 📦 配置文件说明

### Layer 配置 (`deployment/layers/dep/serverless.yml`)

```yaml
component: layer
name: dbc-deps-layer
org: qypeak
app: dbc
stage: dev

inputs:
    name: dbc-deps-layer
    region: ap-chengdu
    src: ./node_modules
    targetDir: /node_modules
    runtimes:
        - Nodejs20.19
    description: DBC 项目生产依赖 Layer
    version: 1 # 自动递增
```

### 应用配置 (`deployment/console/serverless.yml`)

```yaml
component: scf
name: dbc-console
org: qypeak
app: dbc
stage: dev

inputs:
    name: dbc-console
    src:
        src: ../../dist/apps/console
        exclude:
            - .env
    handler: scf_bootstrap
    runtime: Nodejs20.19
    region: ap-chengdu
    memorySize: 512
    timeout: 30
    environment:
        variables:
            NODE_ENV: production
            CONSOLE_SERVER_PORT: 9000
    layers:
        - name: dbc-deps-layer
          version: 1 # 引用 Layer
    events:
        - apigw:
              parameters:
                  protocols:
                      - http
                      - https
                  serviceName: dbc-console-api
                  description: DBC Console API Gateway
                  environment: release
                  endpoints:
                      - path: /
                        method: ANY
```

---

## 🛠️ 环境配置

### pnpm 全局安装配置

首次使用 pnpm 全局安装包时，需要配置全局 bin 目录：

```bash
# 1. 配置 pnpm 全局 bin 目录
pnpm setup

# 2. 重新加载 shell 配置
source ~/.zshrc  # 如果使用 zsh
# 或
source ~/.bashrc  # 如果使用 bash

# 3. 验证配置
echo $PNPM_HOME
# 应该输出类似: /Users/your-username/Library/pnpm
```

**这会在你的 shell 配置文件中添加：**

```bash
export PNPM_HOME="/Users/your-username/Library/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
```

**常见错误：**

```
ERR_PNPM_NO_GLOBAL_BIN_DIR  Unable to find the global bin directory
```

**解决方法：** 运行 `pnpm setup` 并重新加载 shell 配置

---

## 🔧 环境变量

📖 **完整的环境变量配置教程**：[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)

### 部署脚本环境变量

| 变量          | 说明                       | 示例                              | 默认值 |
| ------------- | -------------------------- | --------------------------------- | ------ |
| `FORCE_BUILD` | 跳过变更检测，强制部署所有 | `FORCE_BUILD=true ./ci-deploy.sh` | -      |
| `STAGE`       | 部署环境 (dev/prod)        | `STAGE=prod ./ci-deploy.sh`       | `dev`  |

### 环境变量配置

📖 **详细的环境变量配置教程**：[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)

**配置方法**：

- GitHub Actions：仓库 Settings → Secrets and variables → Actions -> Secrets
- 本地开发：复制 `.env.example` 为 `.env` 并修改
- 生产环境：通过云平台环境变量设置

**环境隔离：**

- DEV 和 PRODUCTION 使用不同的腾讯云凭证和数据库
- 推荐使用不同的子账号，配置不同的权限
- 数据库建议使用不同的实例或 schema 隔离

### 应用环境变量

在 `serverless.yml` 的 `environment.variables` 中配置：

```yaml
environment:
    variables:
        NODE_ENV: production
        CONSOLE_SERVER_PORT: 9000
        DATABASE_HOST: your-db-host
        DATABASE_PORT: 5432
        # ... 其他环境变量
```

---

## 📊 变更检测逻辑

### 两种检测模式

#### 1. Tag-based 模式（CI 推荐）

通过环境变量 `BASE_TAG` 和 `TARGET_REF` 指定比对基准：

```bash
# DEV 部署：比对 dev-latest vs 当前分支
BASE_TAG=dev-latest TARGET_REF=master ./detect-changes.sh

# PROD 部署：比对 prod-latest vs dev-latest
BASE_TAG=prod-latest TARGET_REF=dev-latest ./detect-changes.sh
```

**首次部署处理：**

- 如果 `BASE_TAG` 不存在（如首次部署）
- 自动标记全量部署（所有组件 `CHANGED=true`）
- 不会报错，优雅处理

#### 2. Commit-based 模式（本地兼容）

不提供 `BASE_TAG` 时，自动使用传统方式：

```bash
# 比对 HEAD~1 vs HEAD
./detect-changes.sh
```

### Layer 变更检测（精确到字段）

使用 `jq` 工具**精确比较** `package.json` 中的 `dependencies` 字段：

```bash
# Tag-based 模式
DEPS_OLD=$(git show $COMPARE_BASE:package.json | jq -S '.dependencies')
DEPS_NEW=$(git show $COMPARE_TARGET:package.json | jq -S '.dependencies')

# 精确比较
if [ "$DEPS_OLD" != "$DEPS_NEW" ]; then
    LAYER_CHANGED=true
fi
```

**为什么用 jq？**

- ✅ 只检测 `dependencies` 字段（生产依赖）
- ✅ 忽略 `devDependencies` 变更（不影响 Layer）
- ✅ 忽略 `scripts`、`version` 等其他字段
- ✅ 精确可靠，避免误判

### 应用变更检测

```bash
# 检测共享代码（优先级最高）
git diff $COMPARE_BASE $COMPARE_TARGET --name-only | grep -qE '^(libs/|config/|webpack\.config\.js|...)'

# Console 变更 = apps/console/ 变更 OR 共享代码变更 OR Layer 变更
# Miniapp 变更 = apps/miniapp/ 变更 OR 共享代码变更 OR Layer 变更
```

**变更检测输出：**

- `LAYER_CHANGED`: dependencies 是否变更
- `SHARED_CHANGED`: 共享代码是否变更
- `CONSOLE_CHANGED`: Console 是否需要部署（已包含 shared 和 layer 影响）
- `MINIAPP_CHANGED`: Miniapp 是否需要部署（已包含 shared 和 layer 影响）

**变更影响关系：**

- `SHARED_CHANGED=true` → 强制 `CONSOLE_CHANGED=true`, `MINIAPP_CHANGED=true`
- `LAYER_CHANGED=true` → 强制 `CONSOLE_CHANGED=true`, `MINIAPP_CHANGED=true`（确保版本匹配）

### 智能决策

脚本只负责检测，调用者（GitHub Actions 或 ci-deploy.sh）根据结果决策：

- `LAYER_CHANGED=true` → 重建并部署 Layer
- `CONSOLE_CHANGED=true` → 部署 Console
- `MINIAPP_CHANGED=true` → 部署 Miniapp
- 全部为 `false` → 跳过部署

### 前置要求

- **jq 工具**: 脚本启动时会检查，未安装会报错
- **pnpm-lock.yaml**: 强制使用 pnpm 管理依赖
- **Git 历史**: GitHub Actions 需要 `fetch-depth: 0`（需要完整历史以访问 tags）

---

## 🛠️ 常见问题

### Q1: 首次部署如何操作？

```bash
# 首次部署需要强制部署所有组件
FORCE_BUILD=true ./deployment/ci-deploy.sh
```

### Q2: 如何更新依赖？

1. 修改 `package.json` 的 `dependencies`
2. 提交代码
3. 运行 `./deployment/ci-deploy.sh`
4. 脚本会自动检测依赖变更并更新 Layer

### Q3: 如何查看 Layer 版本？

```bash
# 查看 Layer 配置
cat deployment/layers/dep/serverless.yml | grep version
```

### Q4: 部署失败怎么办？

1. **检查凭证**：确保 `TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY` 配置正确
2. **检查构建**：确保 `pnpm build` 成功
3. **查看日志**：`scf deploy` 会输出详细错误信息
4. **强制重新部署**：`FORCE_BUILD=true ./ci-deploy.sh`

### Q5: 如何回滚生产环境？

**推荐方式（GitHub Actions）：**

在 GitHub Actions 页面手动触发 `Rollback PROD` workflow，输入确认码 `ROLLBACK` 和回滚原因。

**本地方式：**

```bash
# 1. 切换到上一个版本
git checkout <previous-commit>

# 2. 重新构建
pnpm build

# 3. 强制全量部署到生产 [禁止本地操作生产]
STAGE=prod FORCE_BUILD=true ./deployment/ci-deploy.sh
```

📖 详细回滚策略请查看：[CI_TEST_STRATEGY.md](./CI_TEST_STRATEGY.md)

### Q6: Layer 版本管理策略？

- 每次依赖变更，Layer 版本自动 +1
- 服务配置会自动更新到最新版本
- 版本号在 `deployment/layers/dep/serverless.yml` 中

### Q7: 本地如何测试？

```bash
# 1. 本地启动应用
pnpm run start:dev:console

# 2. 测试 API
curl http://localhost:3000/health
```

---

## 📝 部署检查清单

### DEV 环境部署前

- [ ] 代码已构建 (`pnpm build`)
- [ ] SCF CLI 已安装（`serverless-cloud-framework@1.3.2`）
- [ ] 腾讯云 DEV 凭证已配置
- [ ] 所有测试通过

### PRODUCTION 环境部署前

- [ ] DEV 环境已充分测试
- [ ] 代码已打 tag (v*.*.\*)
- [ ] 腾讯云 PRODUCTION 凭证已配置
- [ ] 生产环境变量已设置
- [ ] 已通知相关人员
- [ ] 准备回滚方案

### 部署后验证

- [ ] Layer 部署成功
- [ ] Console 应用部署成功
- [ ] Miniapp 应用部署成功
- [ ] API Gateway 配置正确
- [ ] 环境变量配置正确
- [ ] 应用可以正常访问
- [ ] 生产环境需要额外的冒烟测试

---

## 🔗 相关文档

- [部署脚本使用说明](../deployment/README.md)
- [腾讯云 SCF CLI 文档](https://cloud.tencent.com/document/product/1154/59447)
- [Serverless Components 配置](https://github.com/serverless-components/tencent-http/blob/master/docs/configure.md)
- [Web Function 文档](https://cloud.tencent.com/document/product/1154/59341)

---

## 💡 最佳实践

1. **日常开发**：使用 `./ci-deploy.sh` 智能检测部署
2. **首次部署**：使用 `FORCE_BUILD=true` 强制部署所有
3. **依赖管理**：修改依赖后让脚本自动检测
4. **版本控制**：通过 Git 管理部署历史
5. **环境隔离**：使用不同的 `stage` 区分环境（dev/test/prod）

---

## 🎯 关键要点总结

1. ✅ **使用 Layer 管理依赖** - 部署包更小，速度更快
2. ✅ **智能变更检测** - 自动检测变更，按需部署
3. ✅ **版本自动管理** - Layer 版本自动递增和同步
4. ✅ **配置即代码** - serverless.yml 管理所有配置
5. ✅ **命令行部署** - 使用 SCF CLI 自动化部署
6. ✅ **环境变量隔离** - 通过配置文件管理环境变量
7. ✅ **一键部署** - 单个脚本完成所有操作
