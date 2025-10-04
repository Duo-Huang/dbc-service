# 腾讯云 Web Function 部署指南

本文档说明如何将 Nest.js 项目部署到腾讯云 Web Function（新版 Serverless 应用）。

**官方文档**: [快速部署 Nestjs 框架](https://cloud.tencent.com/document/product/1154/59341)

---

## 🎯 Web Function vs 传统 SCF

### Web Function（新方案）✅ 推荐

- **直接运行 Web 框架**，无需适配层
- 使用 `scf_bootstrap` 启动脚本
- 监听 `0.0.0.0:9000`
- 更简单、更原生

### 传统 SCF（旧方案）❌ 不推荐

- 需要 `serverless-express` 适配层
- 需要包装函数入口
- 更复杂

---

## 📋 项目已完成的配置

### 1. 修改监听地址和端口

已修改 `apps/console/src/main.ts` 和 `apps/miniapp/src/main.ts`:

```typescript
// 腾讯云 Web Function 要求监听 0.0.0.0:9000
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 9000;

await app.listen(port, host);
```

### 2. 创建启动脚本

已创建 `scf_bootstrap_console` 和 `scf_bootstrap_miniapp`:

```bash
#!/bin/bash
export NODE_ENV=production
export PORT=9000
export HOST=0.0.0.0

# 使用云函数标准 Node.js 环境路径
SERVERLESS=1 /var/lang/node20/bin/node ./dist/apps/console/main.js
```

### 3. GitHub Actions CI/CD

已创建 `.github/workflows/deploy-tencent-webfunction.yml`:

- ✅ Lint & Test
- ✅ Build & 安装生产依赖
- ✅ 打包成 zip（包含 dist、node_modules、scf_bootstrap）
- ✅ 自动检查包大小

---

## 🚀 部署方式

### 方式 1: 通过控制台部署（推荐）⭐

1. **推送代码到 GitHub**

    ```bash
    git add .
    git commit -m "feat: add web function support"
    git push origin main
    ```

2. **下载部署包**
    - 访问 GitHub Actions 标签页
    - 下载 `webfunction-packages`
    - 解压获取 `console.zip` 和 `miniapp.zip`

3. **上传到腾讯云**
    - 访问：https://console.cloud.tencent.com/sls
    - 点击**新建应用**
    - 选择 **Web 应用 > Nest.js 框架**
    - 上传方式选择**本地上传**
    - 上传 `console.zip` 或 `miniapp.zip`
    - 完成部署

4. **访问应用**
    - 部署完成后获取 API 网关地址
    - 直接访问测试

### 方式 2: 代码仓库自动部署

1. 在控制台选择**代码仓库拉取**
2. 授权 GitHub 仓库访问
3. 腾讯云会自动：
    - 拉取代码
    - 执行构建
    - 创建 Web Function
    - 配置 API 网关

### 方式 3: 本地手动打包部署

```bash
# 1. 构建项目
pnpm build

# 2. 安装生产依赖
rm -rf node_modules
pnpm install --prod

# 3. 准备 Console 部署包
mkdir -p deploy/console
cp -r dist/ deploy/console/
cp -r node_modules/ deploy/console/
cp scf_bootstrap_console deploy/console/scf_bootstrap
chmod 777 deploy/console/scf_bootstrap
cp package.json deploy/console/

# 4. 打包
cd deploy/console
zip -r console.zip .
cd ../..

# 5. 上传到腾讯云控制台
```

---

## 📦 部署包结构

```
console.zip
├── dist/
│   └── apps/
│       └── console/
│           └── main.js       # 编译后的入口文件
├── node_modules/              # 生产依赖（必须）
│   ├── @nestjs/
│   ├── express/
│   └── ...
├── scf_bootstrap              # 启动脚本（必须，777 权限）
└── package.json
```

---

## ⚠️ 重要注意事项

### 1. 包大小限制

- **直接上传**: 50MB（压缩包）
- **COS 上传**: 500MB（解压后）

**优化建议**:

```bash
# 只安装生产依赖
pnpm install --prod

# 检查包大小
du -sh deploy/console/console.zip
```

### 2. 启动脚本权限

`scf_bootstrap` 必须有可执行权限：

```bash
chmod 777 scf_bootstrap
```

在 Windows 上需要手动设置文件属性。

### 3. 监听地址和端口

**必须**监听 `0.0.0.0:9000`，这是 Web Function 的要求：

```typescript
await app.listen(9000, '0.0.0.0');
```

### 4. Node.js 版本

腾讯云 Web Function 支持：

- Node.js 12
- Node.js 14
- Node.js 16
- Node.js 18
- Node.js 20 ✅ 本项目使用

启动脚本中使用对应版本路径：

```bash
/var/lang/node20/bin/node ./dist/apps/console/main.js
```

### 5. 环境变量

可以在控制台配置环境变量：

- `NODE_ENV=production`
- 数据库连接
- API密钥等

---

## 🔧 本地测试

### 测试构建产物

```bash
# 1. 构建项目
pnpm build

# 2. 设置环境变量（模拟 Web Function）
export PORT=9000
export HOST=0.0.0.0
export NODE_ENV=production

# 3. 运行编译后的代码
node dist/apps/console/main.js

# 4. 测试访问
curl http://localhost:9000
```

### 测试启动脚本

```bash
# 修改启动脚本以使用本地 Node 路径
# 替换 /var/lang/node20/bin/node 为 node

# 执行启动脚本
./scf_bootstrap_console
```

---

## 📊 与传统方案对比

| 特性       | 传统 SCF                   | Web Function（本方案） |
| ---------- | -------------------------- | ---------------------- |
| 适配层     | ❌ 需要 serverless-express | ✅ 无需适配            |
| 配置复杂度 | 高                         | 低                     |
| 入口文件   | index.main_handler         | scf_bootstrap          |
| 监听方式   | 事件驱动                   | HTTP 监听              |
| 部署难度   | 较高                       | 简单                   |
| 官方支持   | 逐步弃用                   | ✅ 推荐方案            |

---

## 🎯 部署流程图

```
本地开发
  ↓
修改监听地址和端口 (0.0.0.0:9000)
  ↓
创建 scf_bootstrap 启动脚本
  ↓
推送到 GitHub
  ↓
GitHub Actions 自动构建
  ├─ Lint & Test
  ├─ Build
  ├─ 安装生产依赖
  └─ 打包 zip (dist + node_modules + scf_bootstrap)
  ↓
下载部署包
  ↓
上传到腾讯云控制台
  ├─ 创建 Web Function
  ├─ 配置 API 网关
  └─ 自动启动应用
  ↓
访问 API 网关地址 ✅
```

---

## 💰 费用说明

腾讯云 Web Function 按量计费：

### 免费额度（每月）

- 调用次数：100万次
- 资源使用：40万 GBs
- 外网流量：1GB

### 计费示例

假设小程序后端：

- 10万用户/月
- 每用户10次请求 = 100万次调用
- 512MB内存，平均200ms执行时间
- 资源使用 = 100万 × 0.5GB × 0.2s = 100,000 GBs

**费用**：

- 调用次数：免费
- 资源使用：60,000 GBs（超出免费额度）× ¥0.00011108 = **¥6.66/月**

非常经济！

---

## 🔍 故障排查

### 问题 1: 应用启动失败

**检查**：

```bash
# 查看函数日志
在控制台 → 函数详情 → 日志查询
```

**常见原因**：

- scf_bootstrap 权限不足（需要 777）
- 监听端口不是 9000
- node_modules 缺失
- Node.js 版本路径错误

### 问题 2: 部署包太大

**解决方案**：

```bash
# 1. 只安装生产依赖
pnpm install --prod

# 2. 使用 COS 上传（支持 500MB）
# 在控制台选择"对象存储 COS"方式

# 3. 优化依赖
# 移除不必要的包
```

### 问题 3: 访问超时

**解决方案**：

- 增加函数超时时间（控制台配置）
- 检查应用启动时间
- 优化业务逻辑

---

## 📚 相关文档

- [腾讯云官方文档](https://cloud.tencent.com/document/product/1154/59341)
- [Serverless 应用中心](https://console.cloud.tencent.com/sls)
- [Web Function 产品文档](https://cloud.tencent.com/document/product/583)

---

## ✅ 检查清单

部署前确认：

- [ ] 修改 main.ts 监听 0.0.0.0:9000
- [ ] 创建 scf_bootstrap 启动脚本
- [ ] 设置 scf_bootstrap 为 777 权限
- [ ] 安装生产依赖（pnpm install --prod）
- [ ] 打包包含 dist、node_modules、scf_bootstrap
- [ ] 检查包大小（是否超过 50MB）
- [ ] 测试本地可以正常启动

---

## 🎉 总结

使用腾讯云 Web Function 部署 Nest.js 应用的优势：

1. ✅ **原生支持** - 无需适配层，直接运行
2. ✅ **配置简单** - 只需修改监听端口和添加启动脚本
3. ✅ **官方推荐** - 腾讯云官方支持和维护
4. ✅ **成本低廉** - 按量计费，小流量几乎免费
5. ✅ **自动扩展** - 根据流量自动扩缩容
6. ✅ **易于管理** - 控制台可视化操作

相比传统 SCF 方案，Web Function 是**更现代、更简单、更官方**的部署方式！

祝部署顺利！🚀
