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
第一阶段：变更检测
  ↓
第二阶段：并行执行（最大化并行）
  ├─ 构建项目（检查 TS 类型和构建错误）
  ├─ Lint（代码规范检查）
  └─ 单元测试（功能验证）
  ↓
第三阶段：E2E 测试（按需并行）
  ├─ Console E2E（如果 Console 有变更）
  └─ Miniapp E2E（如果 Miniapp 有变更）
  ↓
所有测试通过 → PR 可合并
```

### Master 分支

```
代码合并到 master
  ↓
第一阶段：变更检测
  ↓
第二阶段：并行执行（最大化并行）
  ├─ 构建项目（生成部署产物）
  ├─ Lint（代码规范检查）
  └─ 单元测试（功能验证）
  ↓
第三阶段：E2E 测试（按需并行）
  ├─ Console E2E（如果 Console 有变更）
  └─ Miniapp E2E（如果 Miniapp 有变更）
  ↓
所有测试通过
  ↓
第四阶段：部署（复用构建产物）
  └─ 下载构建产物并部署到腾讯云
```

## 变更检测脚本设计原则

### 关注点分离

变更检测脚本 (`detect-changes.sh`) **只负责检测变更状态**，不做任何测试或部署决策：

```
✅ 正确：检测并报告变更状态
❌ 错误：决定是否需要测试/部署

变更检测脚本的职责：
  - 精确检测 dependencies 字段是否变更（使用 jq）
  - 检测共享代码是否变更
  - 检测各个应用是否变更
  - 输出变更状态供调用者使用

调用者的职责：
  - GitHub Actions 根据变更状态决定是否测试/部署
  - CI/CD 脚本根据变更状态决定部署哪些应用
```

### 精确的 Dependencies 检测

脚本使用 `jq` 工具精确比较 `package.json` 中的 `dependencies` 字段：

```bash
# 提取前一个 commit 的 dependencies
DEPS_OLD=$(git show HEAD~1:package.json | jq -S '.dependencies')

# 提取当前 commit 的 dependencies
DEPS_NEW=$(git show HEAD:package.json | jq -S '.dependencies')

# 精确比较（只看 dependencies，忽略 devDependencies 等）
if [ "$DEPS_OLD" != "$DEPS_NEW" ]; then
    LAYER_CHANGED=true
fi
```

**为什么这样设计？**

- ✅ 只有生产依赖变更才重建 Layer（节省时间）
- ✅ devDependencies 变更不触发 Layer 重建
- ✅ package.json 的其他字段变更也不触发

**前置要求：**

- 必须安装 `jq` 工具（脚本启动时会检查）
- GitHub Actions 需要 `fetch-depth: 2` 来访问 `HEAD~1`

### 避免重复检测

在 GitHub Actions 中，检测结果通过环境变量传递给部署脚本：

```yaml
- name: 检测变更并部署
  run: ./deployment/ci-deploy.sh
  env:
      # 传递变更检测结果，避免重复检测
      LAYER_CHANGED: ${{ needs.detect-changes.outputs.layer_changed }}
      CONSOLE_CHANGED: ${{ needs.detect-changes.outputs.console_changed }}
      MINIAPP_CHANGED: ${{ needs.detect-changes.outputs.miniapp_changed }}
```

部署脚本 `ci-deploy.sh` 优先使用传入的环境变量：

```bash
# 优先使用 GitHub Actions 传递的变更状态
if [ -z "$LAYER_CHANGED" ] || [ -z "$CONSOLE_CHANGED" ] || [ -z "$MINIAPP_CHANGED" ]; then
    # 如果没有传递，则运行本地检测（用于本地部署）
    source ./deployment/detect-changes.sh
else
    # 使用 GitHub Actions 的检测结果
    echo "使用 GitHub Actions 的变更检测结果"
fi
```

**优势：**

- ✅ **避免重复**：deploy job 不再重复运行 detect-changes.sh
- ✅ **保持一致**：确保部署使用的检测结果与 job 条件一致
- ✅ **本地兼容**：本地运行时自动回退到本地检测
- ✅ **高效可靠**：检测一次，多处使用

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

### 优化前（串行执行）

```
每次 push/PR:
  - Lint: ~30 秒
  - 单元测试: ~2 分钟
  - 构建: ~2 分钟
  - E2E 测试: ~3 分钟
  - 部署: ~1 分钟
  - 总计: ~8-9 分钟
```

### 优化后（并行 + 按需 + 产物复用）

```
小改动（单个 app）:
  第二阶段（并行）:
    - 构建 + Lint + 单元测试: ~2 分钟（取最长）
  第三阶段（按需）:
    - E2E 测试: ~1-2 分钟（仅一个 app）
  第四阶段:
    - 部署: ~1 分钟（复用构建产物）
  - 总计: ~4-5 分钟 ⚡ 节省 ~40-50%

无关改动（docs/deployment）:
  第二阶段（并行）:
    - 构建 + Lint + 单元测试: ~2 分钟
  第三阶段:
    - E2E 测试: 跳过 ✅
  第四阶段:
    - 部署: 跳过 ✅
  - 总计: ~2 分钟 ⚡ 节省 ~75%
```

### 关键优化点

1. **并行执行**：构建、Lint、单元测试同时进行
2. **按需测试**：只测试有变更的应用
3. **产物复用**：部署时下载构建产物，不重复构建
4. **避免重复检测**：检测结果通过环境变量传递，不重复运行
5. **快速失败**：Lint 30秒就能发现问题，不用等构建完成

## GitHub Actions 工作流

### 主工作流

- **文件**: `.github/workflows/deploy-tencent-webfunction.yml`
- **触发**: push 和 PR
- **功能**: 变更检测、并行构建测试、按需 E2E、自动部署

**Jobs 执行顺序：**

```yaml
detect-changes: # 第1阶段：变更检测
    └─ 输出: layer_changed, console_changed, miniapp_changed

build + lint + unit-test: # 第2阶段：并行执行
    ├─ build: 构建并上传 artifact
    ├─ lint: 代码检查
    └─ unit-test: 单元测试

e2e-console + e2e-miniapp: # 第3阶段：按需并行
    ├─ e2e-console: 如果 console_changed=true
    └─ e2e-miniapp: 如果 miniapp_changed=true

deploy: # 第4阶段：部署（仅 push 事件）
    └─ 下载 artifact 并部署
```

**关键配置：**

- `concurrency`: 防止并发部署，自动取消旧任务
- `fetch-depth: 2`: 允许变更检测访问 HEAD~1
- `upload-artifact`: 构建产物保留1天供部署使用

### 定期测试工作流

- **文件**: `.github/workflows/scheduled-tests.yml`
- **触发**: 每天凌晨 2 点（UTC）+ 手动触发
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

## 技术细节

### 为什么需要 fetch-depth: 2？

变更检测脚本需要比较当前 commit 和前一个 commit：

```bash
# 读取前一个 commit 的完整文件内容
git show HEAD~1:package.json

# 读取当前 commit 的完整文件内容
git show HEAD:package.json
```

如果 `fetch-depth: 1`（默认），Git 历史中只有当前 commit，无法访问 `HEAD~1`。

### 为什么用 jq 而不是 git diff？

```bash
# ❌ git diff 只能检测文件级别
git diff HEAD~1 HEAD --name-only  # package.json 有任何改动就返回

# ✅ jq 可以精确检测字段级别
jq '.dependencies' package.json  # 只检测 dependencies 字段
```

**场景对比：**

| 改动                 | git diff     | jq 检测        | Layer 是否需要重建 |
| -------------------- | ------------ | -------------- | ------------------ |
| 修改 devDependencies | ✓ 检测到变更 | ✗ 未检测到变更 | ❌ 不需要          |
| 修改 scripts         | ✓ 检测到变更 | ✗ 未检测到变更 | ❌ 不需要          |
| 修改 dependencies    | ✓ 检测到变更 | ✓ 检测到变更   | ✅ 需要            |

### Concurrency 配置说明

```yaml
concurrency:
    group: deploy-${{ github.ref }}
    cancel-in-progress: true
```

**作用：**

- 同一分支的新部署会自动取消旧的运行中的部署
- 不同分支可以并发运行
- 避免部署冲突和资源浪费

**示例：**

```
10:00 - 推送 commit A → 触发部署 #1
10:02 - 推送 commit B → 自动取消 #1，开始部署 #2
```

## 依赖管理

本项目**强制使用 pnpm**，所有脚本已配置检查：

- `build-layer.sh`: 强制要求 `pnpm-lock.yaml` 存在
- `package.json`: 配置 `preinstall` 脚本阻止 npm/yarn
- GitHub Actions: 使用 `pnpm add -g` 安装全局包

## 未来优化

- [ ] 添加测试缓存以进一步提速
- [ ] 集成测试覆盖率报告到 PR
- [ ] 添加性能测试基准
- [ ] 实现测试结果的历史趋势分析
- [x] 构建产物复用（已完成）
- [x] 最大化并行执行（已完成）
- [x] 精确的 dependencies 检测（已完成）

---

**维护者**: 根据项目实际情况调整测试策略
**最后更新**: 2024-10-14
