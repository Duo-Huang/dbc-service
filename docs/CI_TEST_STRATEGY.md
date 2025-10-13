# CI/CD 测试策略文档

## 概述

本项目采用**智能按需测试**策略，既保证代码质量，又优化 CI/CD 运行时间。

## 测试策略

### 1. 代码检查（Lint）

- **触发时机**: 每次 push 和 PR
- **执行范围**: 全部代码
- **原因**: 快速执行，保证代码规范

### 2. 单元测试

- **触发时机**: 每次 push 和 PR
- **执行范围**: 全部测试
- **原因**:
    - 单元测试快速（通常 < 10 秒）
    - 全量测试提供最好的安全保障
    - `libs/` 中的改动可能影响多个模块

### 3. E2E 测试（按需执行）

- **触发时机**: 根据变更检测结果
- **执行范围**: 只测试变更的应用

#### 触发规则

| 变更内容             | Console E2E | Miniapp E2E |
| -------------------- | ----------- | ----------- |
| `apps/console/`      | ✅          | ❌          |
| `apps/miniapp/`      | ❌          | ✅          |
| `libs/` 或 `config/` | ✅          | ✅          |
| 其他文件             | ❌          | ❌          |

#### 为什么按需执行？

1. **E2E 测试较慢**: 每个 app 需要 1-2 秒启动
2. **资源密集**: 需要初始化完整应用（配置、日志、数据库连接等）
3. **隔离性强**: Console 和 Miniapp 是独立应用

### 4. 定期全量测试

- **触发时机**: 每天凌晨 2 点（UTC）
- **执行范围**: 所有测试（单元 + E2E）
- **原因**:
    - 捕获依赖更新导致的问题
    - 作为按需测试的兜底保障
    - 可手动触发

## CI/CD 工作流程

### Pull Request

```
PR 创建/更新
  ↓
检测变更
  ↓
并行执行:
  - Lint（总是）
  - 单元测试（总是）
  - Console E2E（按需）
  - Miniapp E2E（按需）
  ↓
所有测试通过 → PR 可合并
```

### Master 分支

```
代码合并到 master
  ↓
检测变更
  ↓
并行执行:
  - Lint（总是）
  - 单元测试（总是）
  - Console E2E（按需）
  - Miniapp E2E（按需）
  ↓
所有测试通过
  ↓
构建和部署（按需）
```

## 变更检测脚本设计原则

### 关注点分离

变更检测脚本 (`detect-changes.sh`) **只负责检测变更状态**，不做任何测试或部署决策：

```
✅ 正确：检测并报告变更状态
❌ 错误：决定是否需要测试/部署

变更检测脚本的职责：
  - 检测 dependencies 是否变更
  - 检测共享代码是否变更
  - 检测各个应用是否变更
  - 输出变更状态供调用者使用

调用者的职责：
  - GitHub Actions 根据变更状态决定是否测试/部署
  - CI/CD 脚本根据变更状态决定部署哪些应用
```

### 依赖关系处理

检测顺序很重要！**先检测 SHARED_CHANGED**，因为它影响所有应用：

```bash
# 1. 检测 Layer（依赖）
# 2. 检测 Shared（共享代码） ⚠️ 优先级最高
# 3. 检测 Console（包含 shared 影响）
# 4. 检测 Miniapp（包含 shared 影响）

# CONSOLE_CHANGED = (apps/console/ 有变更) OR (shared 有变更)
# MINIAPP_CHANGED = (apps/miniapp/ 有变更) OR (shared 有变更)
```

这样设计的好处：

- ✅ 变更检测脚本输出的就是最终状态
- ✅ 调用者可以直接使用，无需再次判断
- ✅ 逻辑集中，易于维护和测试

## 使用的脚本

### 本地测试

```bash
# 运行所有单元测试
pnpm test

# 运行所有 E2E 测试
pnpm test:e2e

# 只测试 Console
pnpm test:e2e:console

# 只测试 Miniapp
pnpm test:e2e:miniapp

# 运行所有测试（单元 + E2E）
pnpm test:all

# E2E 测试覆盖率
pnpm test:e2e:cov
```

### CI/CD 中使用

```bash
# 检测变更
./deployment/detect-changes.sh

# 输出变量（仅检测状态，不包含决策）:
# - LAYER_CHANGED: 依赖是否变更
# - SHARED_CHANGED: 共享代码是否变更 (libs/, config/ 等)
# - CONSOLE_CHANGED: Console 应用是否需要关注（已包含 shared 影响）
# - MINIAPP_CHANGED: Miniapp 应用是否需要关注（已包含 shared 影响）

# 调用者可以直接使用这些状态做测试/部署决策
```

## 测试时间对比

### 优化前（全量测试）

```
每次 push/PR:
  - 单元测试: ~3-5 秒
  - E2E 测试: ~2-3 秒
  - 总计: ~5-8 秒
```

### 优化后（按需测试）

```
小改动（单个 app）:
  - 单元测试: ~3-5 秒
  - E2E 测试: ~1-2 秒（仅一个 app）
  - 总计: ~4-7 秒 ⚡ 节省 ~20-30%

无关改动（docs/deployment）:
  - 单元测试: ~3-5 秒
  - E2E 测试: 跳过
  - 总计: ~3-5 秒 ⚡ 节省 ~40-50%
```

## GitHub Actions 工作流

### 主工作流

- **文件**: `.github/workflows/deploy-tencent-webfunction.yml`
- **触发**: push 和 PR
- **功能**: 变更检测、按需测试、自动部署

### 定期测试工作流

- **文件**: `.github/workflows/scheduled-tests.yml`
- **触发**: 每天凌晨 2 点 + 手动触发
- **功能**: 全量测试 + 失败自动创建 Issue

## 最佳实践

### 开发时

1. ✅ 提交前运行 `pnpm test:e2e:console` 或 `pnpm test:e2e:miniapp`
2. ✅ 修改共享代码（libs/）时运行 `pnpm test:all`
3. ✅ 利用 `pnpm test:e2e:watch` 进行开发

### 审查时

1. ✅ 检查 CI 中哪些测试被跳过
2. ✅ 确认跳过的测试符合预期
3. ✅ 对共享代码改动格外谨慎

### 部署时

1. ✅ 只有测试通过的代码才会部署
2. ✅ PR 只测试不部署，master 会自动部署
3. ✅ 可通过 `FORCE_BUILD=true` 强制全量部署

## 故障排查

### E2E 测试意外跳过

```bash
# 本地验证变更检测
./deployment/detect-changes.sh

# 检查输出的 TEST_CONSOLE 和 TEST_MINIAPP
```

### 定期测试失败

1. 查看自动创建的 Issue
2. 检查 workflow 日志
3. 确认是否是依赖更新导致

### 手动触发全量测试

1. 进入 GitHub Actions
2. 选择 "定期全量测试" workflow
3. 点击 "Run workflow"

## 未来优化

- [ ] 添加测试缓存以进一步提速
- [ ] 集成测试覆盖率报告到 PR
- [ ] 添加性能测试基准
- [ ] 实现测试结果的历史趋势分析

---

**维护者**: 根据项目实际情况调整测试策略
**最后更新**: 2025-10-13
