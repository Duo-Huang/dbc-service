# 部署配置

本目录包含腾讯云 Web Function 部署相关的配置和脚本。

**官方文档**: [快速部署 Nestjs 框架](https://cloud.tencent.com/document/product/1154/59341)

---

## 📁 目录结构

```
deployment/
├── README.md                   # 部署文档（本文件）
├── build-layer.sh              # Layer 构建脚本
├── ci-deploy.sh                # 部署主脚本
├── detect-changes.sh           # 变更检测脚本
├── console/                    # Console 应用部署配置
│   ├── scf_bootstrap           # 启动脚本
│   └── serverless.yml          # 服务配置
├── miniapp/                    # Miniapp 应用部署配置
│   ├── scf_bootstrap           # 启动脚本
│   └── serverless.yml          # 服务配置
└── layers/                     # Layer 配置
    └── dep/
        └── serverless.yml      # Layer 配置文件
```

---

## 🚀 快速部署

### 方式一：GitHub Actions 自动部署（推荐）

推送代码到指定分支，GitHub Actions 自动触发部署：

```bash
# 推送到 main 分支 → 自动构建打包
git push origin main
```

CI 流程会自动：

1. 运行 Lint & Test
2. 构建项目
3. 安装生产依赖
4. 复制启动脚本
5. 打包成 zip 文件
6. 上传为 GitHub Artifacts

然后从 GitHub Actions 下载部署包，上传到腾讯云控制台即可。

### 方式二：本地部署

使用项目提供的部署脚本：

```bash
# 1. 构建项目
pnpm build

# 2. 运行部署脚本（智能变更检测）
./deployment/ci-deploy.sh
```

**工作原理：**

- 脚本会自动检测变更（Layer、Console、Miniapp）
- 根据检测结果自动决定部署什么
- 只部署有变更的组件

**示例：**

```bash
# 智能检测并部署
./deployment/ci-deploy.sh

# 强制构建和部署所有（首次部署使用）
FORCE_BUILD=true ./deployment/ci-deploy.sh
```

**环境变量：**

| 变量               | 说明                                                          |
| ------------------ | ------------------------------------------------------------- |
| `FORCE_BUILD=true` | 跳过变更检测，强制构建和部署所有（Layer + Console + Miniapp） |

**脚本会自动完成**：

1. ✅ **智能变更检测** - 检测应用和 Layer 是否需要更新
2. ✅ **Layer 管理** - 自动构建和部署 Layer（如果依赖有变更）
3. ✅ **应用部署** - 使用 SCF CLI 部署应用到腾讯云
4. ✅ **版本同步** - 自动更新服务配置中的 Layer 版本
5. ✅ **依赖优化** - 使用 Layer 管理 node_modules，无需打包

**变更检测逻辑**：

- **Layer 变更**：检测 `package.json` 中 `dependencies` 字段变更
- **应用变更**：检测 `apps/console/` 和 `apps/miniapp/` 目录变更
- **共享变更**：检测 `libs/`、`config/` 等共享代码变更
- **智能决策**：根据变更类型自动决定部署策略
- **强制控制**：支持环境变量强制构建特定组件

**注意**：使用 Layer 管理依赖，部署包更小，启动更快。

### 方式三：腾讯云控制台部署

1. 访问 [Serverless 应用中心](https://console.cloud.tencent.com/sls)
2. 新建应用 → **Web 应用** → **Nest.js 框架**
3. 选择上传方式：
    - **本地上传**: 上传 zip 包
    - **代码仓库**: 连接 GitHub/GitLab
4. 控制台会自动识别 `scf_bootstrap` 启动脚本
5. 完成部署

---

## 📦 部署包结构

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

---

## ⚙️ 启动脚本配置

### scf_bootstrap

每个服务目录下都有独立的 `scf_bootstrap` 启动脚本。

**Console 应用启动脚本** (`console/scf_bootstrap`)：

```bash
#!/bin/bash

# 设置环境变量
export NODE_ENV=production
export CONSOLE_SERVER_PORT=9000

# 启动 NestJS 应用
# 使用云函数标准 Node.js 环境路径
SERVERLESS=1 /var/lang/node22.20.0/bin/node ./dist/apps/console/main.js
```

**Miniapp 应用启动脚本** (`miniapp/scf_bootstrap`)：

```bash
#!/bin/bash

# 设置环境变量
export NODE_ENV=production
export MINIAPP_SERVER_PORT=9000

# 启动 NestJS 应用
SERVERLESS=1 /var/lang/node22.20.0/bin/node ./dist/apps/miniapp/main.js
```

**关键配置：**

- 监听端口：`9000`（Web Function 标准端口）
- 监听地址：`0.0.0.0`（在代码中配置）
- Node.js 路径：`/var/lang/node22.20.0/bin/node`（云函数标准路径）

---

## 🔧 环境变量

可以在启动脚本中设置环境变量：

| 变量                  | 说明         | 默认值     |
| --------------------- | ------------ | ---------- |
| `NODE_ENV`            | 运行环境     | production |
| `CONSOLE_SERVER_PORT` | Console 端口 | 9000       |
| `MINIAPP_SERVER_PORT` | Miniapp 端口 | 9000       |

在 `scf_bootstrap` 中添加：

```bash
export YOUR_ENV_VAR=value
```

或者在腾讯云控制台的"环境变量"中配置。

---

## 📋 部署检查清单

在部署前，请确认：

- [ ] 项目已经构建：`pnpm build`
- [ ] `dist/` 目录存在且包含编译后的代码
- [ ] `node_modules/` 只包含生产依赖
- [ ] `scf_bootstrap` 文件存在且有执行权限
- [ ] 应用监听 `0.0.0.0:9000` 端口
- [ ] 配置文件已复制到 `dist/apps/*/config/`
- [ ] 部署包大小在限制范围内（< 500MB 解压后）

---

## 🐛 故障排查

### 部署失败

1. 检查部署包大小是否超过限制（50MB 压缩包 / 500MB 解压后）
2. 确认 zip 包结构正确
3. 查看腾讯云控制台错误信息

### 应用无法启动

1. 检查 `scf_bootstrap` 脚本权限（必须是 777 或 755）
2. 确认 Node.js 版本路径正确（`/var/lang/node22.20.0/bin/node`）
3. 检查环境变量配置
4. 查看云函数日志获取详细错误信息
5. 确认 `node_modules` 已包含在部署包中

### 配置未生效

1. 确认 `config/` 目录已包含在 `dist/apps/*/` 中
2. 检查 `NODE_ENV` 环境变量
3. 验证配置文件格式（YAML）
4. 查看应用日志

### 接口 404 错误

1. 检查 API 路由配置
2. 确认应用正常启动
3. 查看云函数日志
4. 测试健康检查接口

---

## 💡 最佳实践

1. **使用 CI/CD**: 生产环境部署仅通过 CI/CD，避免手动操作
2. **独立部署**: Console 和 Miniapp 完全独立，可单独部署和回滚
3. **版本管理**: 给部署包添加版本标签
4. **监控告警**: 配置云函数监控和日志告警
5. **灰度发布**: 使用 API 网关流量管理功能
6. **成本优化**: 合理配置内存和超时时间

---

## ✨ Web Function 部署优势

相比传统部署方式：

- ✅ **无需服务器** - 零运维，自动扩缩容
- ✅ **无需适配器** - 不需要 `@vendia/serverless-express`
- ✅ **无需框架** - 不需要 Serverless Framework
- ✅ **配置简单** - 只需添加启动脚本
- ✅ **成本低廉** - 按量计费，小流量几乎免费

---

## 📚 相关文档

- [腾讯云 Web Function 官方文档](https://cloud.tencent.com/document/product/1154/59341)
- [腾讯云 Serverless 应用中心](https://console.cloud.tencent.com/sls)
- [项目部署总结](../docs/DEPLOYMENT_SUMMARY.md)
- [NestJS 部署文档](https://docs.nestjs.com/deployment)

---

**祝部署顺利！** 🎉
