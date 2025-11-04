# CI/CD 测试和部署策略文档

## 概述

本项目采用**手动触发、基于 tag 的部署策略**，通过三个独立的 workflow 管理部署和回滚，所有测试在部署前执行，确保代码质量和生产环境安全。

📖 **相关文档**：

- [部署总结](DEPLOYMENT_SUMMARY.md) - 完整部署流程和架构说明
- [环境变量配置](ENVIRONMENT_VARIABLES.md) - 环境变量配置指南

## 部署策略

### 核心原则

1. **手动部署**：所有部署均手动触发，避免意外部署
2. **Tag-based 版本管理**：使用移动 tag 追踪 DEV/PROD 部署版本
3. **版本一致性**：PROD 只能从 `dev-latest` 部署，确保部署的是经过 DEV 验证的版本
4. **智能变更检测**：基于 tag 比对，首次部署自动全量部署
5. **数据库 Migration 集成**：部署前自动运行数据库迁移
6. **单次回滚**：PROD 支持回滚到上一版本，简化管理复杂度

### 三个独立 Workflow

#### 1. DEV 环境部署 (`deploy-dev.yml`)

- **触发**：手动触发
- **部署源**：master 或指定分支（支持 hotfix）
- **变更检测**：基于 `dev-latest` tag
- **部署流程**：变更检测 → 并行测试 → Migration → 部署 → 更新 `dev-latest` tag

#### 2. PROD 环境部署 (`deploy-prod.yml`)

- **触发**：手动触发（需输入确认码 `DEPLOY`）
- **部署源**：仅 `dev-latest` tag
- **变更检测**：基于 `prod-latest` tag
- **部署流程**：验证 → 变更检测 → 重新测试 → Migration → 部署 → 更新 tags
- **Tags 更新**：
    - 非首次：`prod-prev` ← 当前 `prod-latest`
    - `prod-latest` ← `dev-latest`

#### 3. PROD 环境回滚 (`rollback-prod.yml`)

- **触发**：手动触发（需输入确认码 `ROLLBACK` 和回滚原因）
- **前提**：`prod-prev` tag 必须存在
- **回滚流程**：验证 → 智能 Migration 检测 → 回退数据库（如需） → 回滚服务 → 更新 tags
- **限制**：只支持一次回滚，回滚后 `prod-prev` 被删除

### Tag 策略

| Tag           | 说明                    | 生命周期                    |
| ------------- | ----------------------- | --------------------------- |
| `dev-latest`  | DEV 当前部署版本        | 每次 DEV 部署后更新         |
| `prod-latest` | PROD 当前部署版本       | 每次 PROD 部署后更新        |
| `prod-prev`   | PROD 上一版本（回滚用） | PROD 部署前保存，回滚后删除 |

**特性：**

- 使用移动 tag（固定名称，`git push -f` 更新位置）
- 通过 tag message 记录部署信息
- 使用 `git reflog show <tag>` 查看历史

## 测试策略

### 1. 代码检查（Lint）

- **触发时机**: 每次部署前
- **执行范围**: 全部代码
- **原因**: 快速执行，保证代码规范

### 2. 单元测试

- **触发时机**: 每次部署前
- **执行范围**: 全部测试
- **原因**:
    - 单元测试快速（通常 < 10 秒）
    - 全量测试提供最好的安全保障
    - `libs/` 中的改动可能影响多个模块

### 3. E2E 测试（按需执行）

- **触发时机**: 根据变更检测结果
- **执行范围**: 只测试变更的应用

#### 触发规则

| 变更内容             | Console E2E | Miniprogram E2E |
| -------------------- | ----------- | --------------- |
| `apps/console/`      | ✅          | ❌              |
| `apps/miniprogram/`  | ❌          | ✅              |
| `libs/` 或 `config/` | ✅          | ✅              |
| 其他文件             | ❌          | ❌              |

#### 为什么按需执行？

1. **E2E 测试较慢**: 每个 app 需要 1-2 秒启动
2. **资源密集**: 需要初始化完整应用（配置、日志、数据库连接等）
3. **隔离性强**: Console 和 Miniprogram 是独立应用

### 4. 定期全量测试

- **触发时机**: 每天凌晨 2 点（UTC）
- **执行范围**: 所有测试（单元 + E2E）
- **原因**:
    - 捕获依赖更新导致的问题
    - 作为按需测试的兜底保障
    - 可手动触发

## CI/CD 工作流程

### DEV 环境部署

```
手动触发 deploy-dev
  ↓
指定部署分支（默认 master）
  ↓
第一阶段：变更检测（基于 dev-latest tag）
  ├─ 首次部署？→ 全量部署标记
  └─ 非首次 → 检测变更
  ↓
第二阶段：并行执行（最大化并行）
  ├─ 构建项目（检查 TS 类型和构建错误，生成产物）
  ├─ Lint（代码规范检查）
  └─ 单元测试（功能验证）
  ↓
第三阶段：E2E 测试（按需并行）
  ├─ Console E2E（如果 Console 有变更）
  └─ Miniprogram E2E（如果 Miniprogram 有变更）
  ↓
第四阶段：数据库迁移
  └─ 运行 migration（DEV 数据库）
  ↓
第五阶段：部署
  └─ 下载构建产物并部署到腾讯云
  ↓
第六阶段：更新 tag
  └─ 强制更新 dev-latest → 当前 commit
```

### PROD 环境部署

```
手动触发 deploy-prod
  ↓
输入确认码 DEPLOY
  ↓
验证条件：dev-latest tag 是否存在
  ↓
从 dev-latest 检出代码
  ↓
第一阶段：变更检测（基于 prod-latest tag）
  ├─ 首次部署？→ 全量部署标记
  └─ 非首次 → 检测变更
  ↓
第二阶段：重新验证（与 DEV 相同的测试）
  ├─ 构建项目
  ├─ Lint
  ├─ 单元测试
  ├─ Console E2E（按需）
  └─ Miniprogram E2E（按需）
  ↓
第三阶段：数据库迁移
  └─ 运行 migration（PROD 数据库）
  ↓
第四阶段：部署
  └─ 部署到生产环境
  ↓
第五阶段：更新 tags
  ├─ 非首次：prod-prev ← 当前 prod-latest
  └─ prod-latest ← dev-latest
```

### PROD 环境回滚

```
手动触发 rollback-prod
  ↓
输入确认码 ROLLBACK + 回滚原因
  ↓
验证条件：prod-prev tag 是否存在
  ↓
第一阶段：智能 Migration 检测
  ├─ 比对 prod-prev 和 prod-latest 的 migrations/
  ├─ 计算需要回退的 migration 数量
  └─ 无变更？→ 跳过数据库回退
  ↓
第二阶段：回退数据库（如需要）
  ├─ 从 prod-latest 检出（确保 migration 文件存在）
  ├─ 循环执行 migration:revert
  └─ 回退成功
  ↓
第三阶段：回滚服务
  ├─ 从 prod-prev 检出
  ├─ 重新构建
  └─ 强制全量部署
  ↓
第四阶段：更新 tags
  ├─ prod-latest ← prod-prev
  └─ 删除 prod-prev（消耗回滚机会）
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
  - 处理变更影响关系（shared → apps, layer → apps）
  - 输出变更状态供调用者使用

调用者的职责：
  - GitHub Actions 根据变更状态决定是否测试/部署
  - CI/CD 脚本根据变更状态决定部署哪些应用
```

### 基于 Tag 的变更检测

脚本支持两种模式：

#### Tag-based 模式（CI 推荐）

通过环境变量指定比对基准：

```bash
# DEV 部署：比对 dev-latest vs 当前分支
BASE_TAG=dev-latest TARGET_REF=master ./detect-changes.sh

# PROD 部署：比对 prod-latest vs dev-latest
BASE_TAG=prod-latest TARGET_REF=dev-latest ./detect-changes.sh
```

#### Commit-based 模式（本地兼容）

不提供环境变量时，自动回退到传统模式：

```bash
# 比对 HEAD~1 vs HEAD
./detect-changes.sh
```

### 精确的 Dependencies 检测

脚本使用 `jq` 工具精确比较 `package.json` 中的 `dependencies` 字段：

```bash
# 使用变量（Tag-based 或 Commit-based）
DEPS_OLD=$(git show $COMPARE_BASE:package.json | jq -S '.dependencies')
DEPS_NEW=$(git show $COMPARE_TARGET:package.json | jq -S '.dependencies')

# 精确比较（只看 dependencies，忽略 devDependencies 等）
if [ "$DEPS_OLD" != "$DEPS_NEW" ]; then
    LAYER_CHANGED=true
fi
```

**为什么这样设计？**

- ✅ 只有生产依赖变更才重建 Layer（节省时间）
- ✅ devDependencies 变更不触发 Layer 重建
- ✅ package.json 的其他字段变更也不触发
- ✅ 支持 tag-based 检测（更精确）
- ✅ 首次部署自动全量部署（tag 不存在时）

**前置要求：**

- 必须安装 `jq` 工具（脚本启动时会检查）
- GitHub Actions 需要 `fetch-depth: 0` 来访问完整 git 历史（包括 tags）

### 避免重复检测

在 GitHub Actions 中，检测结果通过环境变量传递给部署脚本：

```yaml
- name: 检测变更并部署
  run: ./deployment/ci-deploy.sh
  env:
      # 传递变更检测结果，避免重复检测
      LAYER_CHANGED: ${{ needs.detect-changes.outputs.layer_changed }}
      CONSOLE_CHANGED: ${{ needs.detect-changes.outputs.console_changed }}
      MINIPROGRAM_CHANGED: ${{ needs.detect-changes.outputs.miniprogram_changed }}
```

部署脚本 `ci-deploy.sh` 优先使用传入的环境变量：

```bash
# 优先使用 GitHub Actions 传递的变更状态
if [ -z "$LAYER_CHANGED" ] || [ -z "$CONSOLE_CHANGED" ] || [ -z "$MINIPROGRAM_CHANGED" ]; then
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

检测顺序很重要！**先检测基础变更，再处理影响关系**：

```bash
# 1. 检测 Layer（依赖）
# 2. 检测 Shared（共享代码）
# 3. 检测 Console（应用代码）
# 4. 检测 Miniprogram（应用代码）
# 5. 处理变更影响关系

# 影响关系处理：
# - SHARED_CHANGED=true → 强制 CONSOLE_CHANGED=true, MINIPROGRAM_CHANGED=true
# - LAYER_CHANGED=true → 强制 CONSOLE_CHANGED=true, MINIPROGRAM_CHANGED=true

# 最终结果：
# CONSOLE_CHANGED = (apps/console/ 有变更) OR (shared 有变更) OR (layer 有变更)
# MINIPROGRAM_CHANGED = (apps/miniprogram/ 有变更) OR (shared 有变更) OR (layer 有变更)
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

# 只测试 Miniprogram
pnpm test:e2e:miniprogram

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
# - MINIPROGRAM_CHANGED: Miniprogram 应用是否需要关注（已包含 shared 影响）

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
    └─ 输出: layer_changed, console_changed, miniprogram_changed

build + lint + unit-test: # 第2阶段：并行执行
    ├─ build: 构建并上传 artifact
    ├─ lint: 代码检查
    └─ unit-test: 单元测试

e2e-console + e2e-miniprogram: # 第3阶段：按需并行
    ├─ e2e-console: 如果 console_changed=true
    └─ e2e-miniprogram: 如果 miniprogram_changed=true

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

1. ✅ 提交前运行 `pnpm test:e2e:console` 或 `pnpm test:e2e:miniprogram`
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

# 检查输出的 TEST_CONSOLE 和 TEST_MINIPROGRAM
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
