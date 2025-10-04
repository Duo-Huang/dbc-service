# 腾讯云 Serverless 部署总结

## 🎯 项目部署方案

本项目专为**腾讯云 Serverless Application（云函数 SCF）**设计，采用完整打包策略。

---

## ✅ 已完成的配置

### 1. GitHub Actions CI/CD 工作流

#### 主要工作流：`.github/workflows/ci-cd-serverless.yml`

**流程：**

```
推送代码到 master/main
  ↓
┌─────────────┬─────────────┐
│   Lint      │    Test     │  并行执行
└──────┬──────┴──────┬──────┘
       └──────┬───────┘
              ↓
       ┌─────────────┐
       │   Build     │  构建 + 打包 node_modules
       └──────┬──────┘
              ↓
       ┌─────────────┐
       │   Deploy    │  生成 console.zip & miniapp.zip
       └─────────────┘
```

**生成产物：**

- `console.zip` - Console 应用部署包（~100MB）
- `miniapp.zip` - Miniapp 应用部署包（~100MB）

### 2. Serverless 配置文件

#### `serverless.yml` - Serverless Framework 配置

- 定义两个函数：console 和 miniapp
- 配置 API 网关触发器
- 内存、超时、环境变量等设置

#### 函数入口文件

- `deployment/serverless/console/index.js` - Console 函数入口
- `deployment/serverless/miniapp/index.js` - Miniapp 函数入口

这些文件将 NestJS 应用适配到 Serverless 环境。

### 3. 依赖包

已添加到 `package.json`：

- `@vendia/serverless-express` - 将 Express 应用转换为 Serverless 函数
- `serverless-tencent-scf` - Serverless Framework 腾讯云插件

### 4. 文档

- `deployment/SERVERLESS_DEPLOYMENT.md` - 详细部署指南
- `deployment/DEPLOYMENT_STRATEGIES.md` - 部署策略对比
- `README.md` - 项目主文档（已更新）

---

## 🚀 快速开始

### 本地部署

```bash
# 1. 安装 Serverless Framework
npm install -g serverless

# 2. 配置腾讯云凭证
export TENCENT_SECRET_ID=your-secret-id
export TENCENT_SECRET_KEY=your-secret-key

# 3. 构建项目
pnpm build

# 4. 安装生产依赖
pnpm install --prod

# 5. 部署
serverless deploy --stage prod
```

### GitHub Actions 自动部署

```bash
# 1. 在 GitHub 仓库设置中添加 Secrets：
#    - TENCENT_SECRET_ID
#    - TENCENT_SECRET_KEY

# 2. 推送代码到 master 或 main 分支
git push origin main

# 3. 查看 Actions 标签页，等待构建完成

# 4. 下载生成的部署包或启用自动部署
```

---

## 📦 关键差异：Serverless vs 传统服务器

| 特性         | 传统服务器        | Serverless（本项目） |
| ------------ | ----------------- | -------------------- |
| 依赖管理     | ✅ 可以运行时安装 | ❌ **必须打包上传**  |
| node_modules | 可选              | ✅ **必须包含**      |
| 包大小       | 无限制            | ⚠️ 50MB/500MB 限制   |
| 部署方式     | rsync/scp 上传    | zip 包上传           |
| 启动方式     | 持续运行          | 按需启动（冷启动）   |
| 计费方式     | 按时间（月/年）   | 按调用次数和执行时长 |
| 运维成本     | 需要维护服务器    | 零运维               |
| 扩展性       | 手动/自动扩容     | 自动扩缩容           |

**核心要点：** Serverless 环境中无法执行 `pnpm install`，必须在本地或 CI 中打包完整的 `node_modules`！

---

## 📋 为什么必须打包 node_modules？

### NestJS Webpack 构建行为

```javascript
// webpack 默认配置
externals: {
  // 所有 node_modules 都标记为外部依赖
  'express': 'commonjs express',
  '@nestjs/common': 'commonjs @nestjs/common',
  // ... 更多
}
```

这意味着：

- ✅ 构建产物（`dist/`）只包含你的业务代码
- ❌ 不包含 `@nestjs/*`、`express`、`rxjs` 等依赖
- ⚠️ 运行时需要 `node_modules` 存在

### 传统服务器 vs Serverless

**传统服务器：**

```bash
# 上传构建产物
scp -r dist/ server:/app/

# SSH 到服务器
ssh server

# 安装依赖 ✅ 可以执行
cd /app && pnpm install --prod

# 运行
node dist/apps/console/main.js
```

**Serverless：**

```bash
# 上传 zip 包（必须包含 node_modules）
# 云函数环境是只读的，无法执行 npm install ❌

# 解决方案：本地打包
pnpm install --prod
zip -r console.zip dist/ node_modules/ index.js

# 上传到腾讯云
# 云函数直接运行，依赖已包含 ✅
```

---

## 🎯 部署流程详解

### CI/CD 自动化流程

```yaml
# .github/workflows/ci-cd-serverless.yml

# 步骤 1: 构建代码
pnpm build
# 生成 dist/apps/console/main.js
#      dist/apps/miniapp/main.js

# 步骤 2: 安装生产依赖（关键！）
rm -rf node_modules
pnpm install --prod --frozen-lockfile
# 只安装 dependencies，不包含 devDependencies
# 减小包体积

# 步骤 3: 准备部署包
mkdir -p serverless_package/console
cp -r dist/apps/console serverless_package/console/
cp -r node_modules serverless_package/console/  # 必须！
cp deployment/serverless/console/index.js serverless_package/console/

# 步骤 4: 打包 zip
cd serverless_package/console
zip -r console.zip .

# 步骤 5: 上传 Artifact
# GitHub Actions 保存 console.zip 和 miniapp.zip
```

### 部署包结构

```
console.zip (压缩包)
├── console/
│   └── main.js              # NestJS 编译后的入口
├── node_modules/            # 生产依赖（必须！）
│   ├── @nestjs/
│   ├── express/
│   ├── rxjs/
│   └── ...
└── index.js                 # Serverless 函数入口
```

---

## ⚠️ 常见问题

### Q1: 为什么不能在云函数中安装依赖？

**A:** 云函数环境的限制：

- 文件系统是**只读**的
- 没有包管理器（npm/pnpm）
- 无法执行 `npm install` 命令
- 只能运行预先打包好的代码

### Q2: 部署包太大怎么办？

**A:** 优化方案：

1. 只安装生产依赖：`pnpm install --prod`
2. 移除不必要的文件
3. 使用 Serverless Layer 共享依赖
4. 如果超过 50MB，使用 COS 上传（支持 500MB）

### Q3: 冷启动慢怎么办？

**A:** 优化方案：

1. 减小部署包体积
2. 启用预留实例（避免冷启动）
3. 优化应用启动逻辑
4. 使用更大的内存配置（更多 CPU）

### Q4: 如何本地测试？

**A:**

```bash
# 直接运行编译后的代码（需要 node_modules）
node dist/apps/console/main.js

# 或使用开发模式
pnpm run start:dev:console
```

### Q5: 可以切换到传统服务器吗？

**A:** 可以！项目提供了多种部署方式：

- 使用 `.github/workflows/ci-cd-lightweight.yml` - 轻量包
- 使用 `.github/workflows/ci-cd.yml` - 完整包
- 使用 Docker 容器化部署

---

## 💡 最佳实践

### 1. 依赖管理

```json
// package.json
{
    "dependencies": {
        // 运行时必需的依赖
        "@nestjs/common": "^11.0.1",
        "@vendia/serverless-express": "^4.12.6"
    },
    "devDependencies": {
        // 开发和构建时的依赖（不会打包）
        "@nestjs/cli": "^11.0.0",
        "typescript": "^5.7.3"
    }
}
```

### 2. 环境变量

```yaml
# serverless.yml
functions:
    console:
        environment:
            NODE_ENV: production
            DATABASE_URL: ${env:DATABASE_URL} # 从环境变量读取
```

### 3. 日志记录

```typescript
// 使用腾讯云日志服务
console.log('info:', data); // 自动收集
console.error('error:', error); // 自动告警
```

### 4. 监控告警

- 在腾讯云控制台配置：
    - 错误率告警
    - 超时告警
    - 并发数告警

---

## 📊 成本估算

### 免费额度（每月）

- 调用次数：100 万次
- 资源使用：40 万 GBs
- 外网流量：1GB

### 示例：小程序后端

**假设：**

- 10 万 用户/月
- 每用户 10 次请求
- = 100 万次调用/月
- 512MB 内存，平均 200ms

**费用：**

- 调用次数：免费（在额度内）
- 资源使用：100万 × 0.5GB × 0.2s = 100,000 GBs
    - 前 40 万免费，剩余 60,000 GBs
    - 费用：60,000 × ¥0.00011108 = ¥6.66
- **总计：¥6.66/月** 🎉

非常适合初创项目和小程序后端！

---

## 🎉 总结

### 已配置完成 ✅

1. ✅ GitHub Actions CI/CD（`.github/workflows/ci-cd-serverless.yml`）
2. ✅ Serverless Framework 配置（`serverless.yml`）
3. ✅ 函数入口适配（`deployment/serverless/*/index.js`）
4. ✅ 依赖包安装（`@vendia/serverless-express` 等）
5. ✅ 详细文档（本文档 + 部署指南）

### 下一步 🚀

1. **配置腾讯云凭证**
    - 获取 SecretId 和 SecretKey
    - 配置到 GitHub Secrets

2. **推送代码测试 CI/CD**

    ```bash
    git add .
    git commit -m "feat: add serverless deployment"
    git push origin main
    ```

3. **查看构建结果**
    - 访问 GitHub Actions 标签页
    - 下载生成的部署包

4. **部署到腾讯云**
    - 使用 Serverless Framework
    - 或手动上传到控制台
    - 或启用自动部署

### 关键要点 🎯

- ✅ Serverless **必须打包 node_modules**
- ✅ 使用 `pnpm install --prod` 减小体积
- ✅ 注意 50MB/500MB 大小限制
- ✅ 配置合理的内存和超时
- ✅ 利用免费额度降低成本

---

## 📚 相关文档

- [Serverless 部署指南](deployment/SERVERLESS_DEPLOYMENT.md) - 详细步骤和故障排查
- [部署策略对比](deployment/DEPLOYMENT_STRATEGIES.md) - 各种部署方式对比
- [项目 README](README.md) - 项目概览和快速开始

---

**祝部署顺利！** 🎊

如有问题，请查阅文档或联系团队。
