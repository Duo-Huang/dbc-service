# 腾讯云 Web Function 部署总结

## 🎯 项目部署方案

本项目采用**腾讯云 Web Function** 部署方式，这是腾讯云官方推荐的 Nest.js 部署方案。

**官方文档**: [快速部署 Nestjs 框架](https://cloud.tencent.com/document/product/1154/59341)

---

## ✨ 为什么选择 Web Function？

✅ **原生支持** - 直接运行 Nest.js，无需适配层
✅ **配置简单** - 只需修改监听端口和添加启动脚本
✅ **无需框架** - 不需要 Serverless Framework 或任何适配器
✅ **官方推荐** - 腾讯云官方文档支持
✅ **成本低廉** - 按量计费，小流量几乎免费
✅ **自动扩展** - 根据流量自动扩缩容

---

## 🚀 快速部署

### 方式一：自动部署（推荐）

通过 GitHub Actions 自动构建并生成部署包：

```bash
# 推送代码到 main 分支
git push origin main

# GitHub Actions 会自动:
# - 运行 Lint & Test
# - 构建项目
# - 安装生产依赖
# - 打包成 console.zip 和 miniapp.zip
```

然后从 GitHub Actions Artifacts 下载部署包，上传到腾讯云即可。

### 方式二：本地打包部署

```bash
# 1. 构建项目
pnpm build

# 2. 使用部署脚本打包（会自动安装生产依赖）
./deployment/ci-deploy.sh console  # 或 miniapp

# 3. 上传到腾讯云控制台
# 生成的 zip 包位于: serverless_package/console.zip
```

**打包脚本会自动完成**：

- ✅ 复制构建产物和配置文件
- ✅ 安装生产依赖（`pnpm install --prod`）
- ✅ 复制启动脚本并设置权限
- ✅ 打包成 zip 文件

### 方式三：腾讯云控制台直接部署

1. 访问 [Serverless 应用中心](https://console.cloud.tencent.com/sls)
2. 新建应用 → **Web 应用** → **Nest.js 框架**
3. 选择上传方式：
    - **本地上传**: 上传 zip 包
    - **代码仓库**: 连接 GitHub/GitLab 等
4. 控制台会自动识别 `scf_bootstrap` 启动脚本
5. 完成部署

---

## 📦 部署包结构

正确的部署包应该包含以下内容：

```
console.zip
├── scf_bootstrap          # ← Web Function 启动脚本（必须在根目录）
├── dist/                  # ← 构建产物
│   └── apps/
│       └── console/
│           ├── main.js
│           └── config/    # ← 配置文件（webpack 自动复制）
├── node_modules/          # ← 生产依赖（必须包含）
├── package.json
└── pnpm-lock.yaml
```

**重要说明：**

1. ⚠️ `scf_bootstrap` 必须在 zip 包的根目录
2. ⚠️ `node_modules` 必须包含（只包含生产依赖）
3. ⚠️ `scf_bootstrap` 必须有执行权限（777 或 755）
4. ⚠️ 应用必须监听 `0.0.0.0:9000` 端口

---

## 🔧 配置要点

### 1. 启动脚本 (scf_bootstrap)

项目已经配置好启动脚本，位于：

- `deployment/console/scf_bootstrap` - Console 应用
- `deployment/miniapp/scf_bootstrap` - Miniapp 应用

内容示例：

```bash
#!/bin/bash

# 设置环境变量
export NODE_ENV=production
export SERVER_CONSOLE_PORT=9000

# 启动 NestJS 应用
# 使用云函数标准 Node.js 环境路径
SERVERLESS=1 /var/lang/node22.20.0/bin/node ./dist/apps/console/main.js
```

### 2. 监听端口配置

应用代码中已经配置为从环境变量读取端口（默认 9000）：

```typescript
// main.ts
const port = configService.get<number>('server.console.port', 9000);
await app.listen(port, '0.0.0.0');
```

在 Web Function 环境中，通过 `scf_bootstrap` 设置 `SERVER_CONSOLE_PORT=9000`。

### 3. 生产依赖安装

**关键**: 必须打包 `node_modules`，但只包含生产依赖。

打包脚本会自动在临时目录中安装生产依赖：

```bash
# ci-deploy.sh 脚本中会自动执行:
pnpm install --prod --frozen-lockfile
```

这样可以显著减小部署包体积，且不会影响你的本地开发环境。

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

## 🔄 CI/CD 自动化流程

项目配置了完整的 GitHub Actions CI/CD 流程（`.github/workflows/deploy-tencent-webfunction.yml`）：

```
推送代码
  ↓
┌─────────────┬─────────────┐
│   Lint      │    Test     │  并行执行
└──────┬──────┴──────┬──────┘
       └──────┬───────┘
              ↓
       ┌─────────────┐
       │   Build     │  构建项目
       └──────┬──────┘
              ↓
       ┌─────────────┐
       │  Install    │  安装生产依赖
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

**CI 会自动完成**：

1. ✅ 代码质量检查（Lint & Test）
2. ✅ 构建项目（`pnpm build`）
3. ✅ 安装生产依赖（`pnpm install --prod`）
4. ✅ 复制启动脚本和配置文件
5. ✅ 打包成 zip 文件
6. ✅ 上传为 GitHub Artifacts

---

## 💰 费用估算

### 腾讯云 Web Function 免费额度（每月）

- 调用次数：100万次
- 资源使用：40万 GBs
- 外网流量：1GB

### 示例：小程序后端

**假设：**

- 10 万用户/月
- 每用户 10 次请求
- = 100 万次调用/月
- 512MB 内存，平均 200ms

**费用：**

- 调用次数：免费（在额度内）
- 资源使用：100万 × 0.5GB × 0.2s = 100,000 GBs
    - 前 40 万免费，剩余 60,000 GBs
    - 费用：60,000 × ¥0.00011108 = **¥6.66**
- **总计：¥6.66/月** 🎉

非常适合初创项目和小程序后端！💰

---

## ❓ 常见问题

### Q1: 为什么必须打包 node_modules？

**A:** Web Function 环境是只读的，无法执行 `npm install`。必须在本地或 CI 中打包完整的依赖。

NestJS 的 Webpack 构建默认将 node_modules 标记为外部依赖（externals），不会打包进 `dist/`，所以运行时需要 `node_modules` 存在。

### Q2: 需要安装 @vendia/serverless-express 吗？

**A:** **不需要！** Web Function 直接支持 HTTP 服务，Nest.js 应用可以直接运行，无需任何适配器。

### Q3: 需要 Serverless Framework 吗？

**A:** **不需要！** 可以直接在腾讯云控制台上传 zip 包部署，无需使用 Serverless Framework。

### Q4: 部署包太大怎么办？

**A:** 优化方案：

1. ✅ 只安装生产依赖（打包脚本会自动处理：`pnpm install --prod`）
2. ✅ 移除不必要的文件（测试文件、文档等）
3. ✅ 检查是否有体积过大的依赖包
4. ⚠️ 压缩包限制：50MB（压缩后）/ 500MB（解压后）

### Q5: 应用启动失败怎么办？

**A:** 检查清单：

1. 检查 `scf_bootstrap` 脚本权限（必须是 777 或 755）
2. 确认 Node.js 版本路径正确（`/var/lang/node22.20.0/bin/node`）
3. 检查应用是否监听 `0.0.0.0:9000`
4. 查看云函数日志获取详细错误信息
5. 确认 `node_modules` 已包含在部署包中

### Q6: 如何本地测试部署包？

**A:** 可以模拟 Web Function 环境测试：

```bash
# 方法1: 直接测试构建产物
pnpm build
export NODE_ENV=production
export SERVER_CONSOLE_PORT=9000
node dist/apps/console/main.js

# 方法2: 测试完整部署包
./deployment/ci-deploy.sh console
cd serverless_package
unzip console.zip -d test_deploy
cd test_deploy
./scf_bootstrap

# 访问测试
curl http://localhost:9000
```

### Q7: 如何查看应用日志？

**A:** 三种方式：

1. **腾讯云控制台**: Serverless 应用 → 日志查询
2. **实时日志**: 云函数 → 函数管理 → 日志查询
3. **日志服务**: 集成腾讯云 CLS 日志服务

---

## 📚 相关文档

- [腾讯云 Web Function 官方文档](https://cloud.tencent.com/document/product/1154/59341)
- [腾讯云 Serverless 应用中心](https://console.cloud.tencent.com/sls)
- [NestJS 官方文档](https://docs.nestjs.com)
- [项目部署脚本说明](../deployment/README.md)

---

## 🎉 总结

### Web Function 部署非常简单 ✅

1. ✅ **无需适配器** - 不需要 `@vendia/serverless-express`
2. ✅ **无需框架** - 不需要 Serverless Framework
3. ✅ **无需配置文件** - 不需要 `serverless.yml`
4. ✅ **只需三步**:
    - 构建项目
    - 添加启动脚本
    - 上传 zip 包

### 关键要点 🎯

- ⚠️ 必须打包 `node_modules`（只包含生产依赖）
- ⚠️ `scf_bootstrap` 必须在根目录且有执行权限
- ⚠️ 应用必须监听 `0.0.0.0:9000`
- ⚠️ 注意部署包大小限制（500MB 解压后）

---

**祝部署顺利！** 🚀

如有问题，请查阅[腾讯云官方文档](https://cloud.tencent.com/document/product/1154/59341)或联系团队。
