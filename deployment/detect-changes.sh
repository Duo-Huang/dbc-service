#!/bin/bash

# 变更检测脚本
# 检测代码变更状态，不做决策，决策由调用者完成
#
# 环境变量:
#   FORCE_BUILD=true|1    - 跳过变更检测，强制标记所有为已变更
#   BASE_TAG              - 基准 tag（用于 tag-based 检测）
#   TARGET_REF            - 目标 ref（用于 tag-based 检测）
#
# 输出变量:
#   LAYER_CHANGED=true|false      - dependencies 是否变更
#   SHARED_CHANGED=true|false     - 共享代码是否变更（libs/, config/ 等）
#   CONSOLE_CHANGED=true|false    - Console 应用是否变更（包含 shared 影响）
#   MINIAPP_CHANGED=true|false    - Miniapp 应用是否变更（包含 shared 影响）

set -e

echo "======================================"
echo "开始变更检测"
echo "======================================"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录执行此脚本"
    exit 1
fi

# 检查 jq 是否安装
if ! command -v jq &> /dev/null; then
    echo "错误: 未安装 jq 工具"
    echo "请先安装 jq:"
    echo "  macOS:   brew install jq"
    echo "  Ubuntu:  sudo apt-get install jq"
    echo "  CentOS:  sudo yum install jq"
    exit 1
fi

# 初始化变量（仅检测变更状态）
LAYER_CHANGED=false
SHARED_CHANGED=false
CONSOLE_CHANGED=false
MINIAPP_CHANGED=false

# 检查是否强制构建
if [ "$FORCE_BUILD" = "true" ] || [ "$FORCE_BUILD" = "1" ]; then
    echo "检测到 FORCE_BUILD 环境变量，跳过变更检测，标记所有为已变更"
    LAYER_CHANGED=true
    SHARED_CHANGED=true
    CONSOLE_CHANGED=true
    MINIAPP_CHANGED=true
else
    # 确定比对基准和目标
    if [ -n "$BASE_TAG" ] && [ -n "$TARGET_REF" ]; then
        # Tag-based 模式（CI 推荐）
        echo ""
        echo "🔍 使用 Tag-based 变更检测"
        echo "  Base: $BASE_TAG"
        echo "  Target: $TARGET_REF"

        # 检查 BASE_TAG 是否存在
        if ! git rev-parse "$BASE_TAG" >/dev/null 2>&1; then
            echo ""
            echo "⚠️  $BASE_TAG 不存在（可能是首次部署）"
            echo "   执行全量部署"
            LAYER_CHANGED=true
            SHARED_CHANGED=true
            CONSOLE_CHANGED=true
            MINIAPP_CHANGED=true

            # 输出到 GitHub Actions
            if [ -n "$GITHUB_OUTPUT" ]; then
                echo "layer_changed=true" >> "$GITHUB_OUTPUT"
                echo "shared_changed=true" >> "$GITHUB_OUTPUT"
                echo "console_changed=true" >> "$GITHUB_OUTPUT"
                echo "miniapp_changed=true" >> "$GITHUB_OUTPUT"
            fi

            # 输出到环境变量
            export LAYER_CHANGED
            export SHARED_CHANGED
            export CONSOLE_CHANGED
            export MINIAPP_CHANGED

            echo ""
            echo "======================================"
            echo "📊 变更检测结果:"
            echo "======================================"
            echo "  Layer Changed:    $LAYER_CHANGED"
            echo "  Shared Changed:   $SHARED_CHANGED"
            echo "  Console Changed:  $CONSOLE_CHANGED"
            echo "  Miniapp Changed:  $MINIAPP_CHANGED"
            echo "======================================"
            echo ""
            exit 0
        fi

        BASE_COMMIT=$(git rev-parse "$BASE_TAG")
        TARGET_COMMIT=$(git rev-parse "$TARGET_REF")

        echo "  Base commit: $BASE_COMMIT"
        echo "  Target commit: $TARGET_COMMIT"

        COMPARE_BASE="$BASE_COMMIT"
        COMPARE_TARGET="$TARGET_COMMIT"
    else
        # Commit-based 模式（本地/向后兼容）
        echo ""
        echo "🔍 使用 Commit-based 变更检测 (HEAD~1 vs HEAD)"
        COMPARE_BASE="HEAD~1"
        COMPARE_TARGET="HEAD"
    fi
    # 1. 检查 Layer 是否需要更新（依赖变更）
    echo ""
    echo "检查依赖变更..."
    # 使用 jq 精确比较 dependencies 字段
    DEPS_OLD=$(git show $COMPARE_BASE:package.json 2>/dev/null | jq -S '.dependencies' 2>/dev/null)
    DEPS_NEW=$(git show $COMPARE_TARGET:package.json 2>/dev/null | jq -S '.dependencies' 2>/dev/null)
    if [ "$DEPS_OLD" != "$DEPS_NEW" ]; then
        echo "  ✓ dependencies 字段有变更"
        LAYER_CHANGED=true
    else
        echo "  - dependencies 字段无变更"
    fi

    # 2. 先检查共享代码变更（优先级最高，影响所有应用）
    echo ""
    echo "检查共享代码变更..."
    if git diff $COMPARE_BASE $COMPARE_TARGET --name-only | grep -qE '^(libs/|config/|webpack\.config\.js|nest-cli\.json|tsconfig.*\.json|deployment/)'; then
        echo "  ✓ 共享代码有变更 (libs/, config/, webpack.config.js, nest-cli.json, tsconfig.*.json, deployment/)"
        SHARED_CHANGED=true
    else
        echo "  - 共享代码无变更 (libs/, config/, webpack.config.js, nest-cli.json, tsconfig.*.json, deployment/)"
    fi

    # 3. 检查 Console 应用变更（包含 shared 影响）
    echo ""
    echo "检查 Console 应用..."
    CONSOLE_APP_CHANGED=false
    if git diff $COMPARE_BASE $COMPARE_TARGET --name-only | grep -q '^apps/console/'; then
        echo "  ✓ Console 应用代码有变更"
        CONSOLE_APP_CHANGED=true
        CONSOLE_CHANGED=true
    fi

    if [ "$SHARED_CHANGED" = "true" ]; then
        if [ "$CONSOLE_APP_CHANGED" = "false" ]; then
            echo "  ✓ Console 受共享代码变更影响"
        fi
        CONSOLE_CHANGED=true
    fi

    if [ "$CONSOLE_CHANGED" = "false" ]; then
        echo "  - Console 无变更"
    fi

    # 4. 检查 Miniapp 应用变更（包含 shared 影响）
    echo ""
    echo "检查 Miniapp 应用..."
    MINIAPP_APP_CHANGED=false
    if git diff $COMPARE_BASE $COMPARE_TARGET --name-only | grep -q '^apps/miniapp/'; then
        echo "  ✓ Miniapp 应用代码有变更"
        MINIAPP_APP_CHANGED=true
        MINIAPP_CHANGED=true
    fi

    if [ "$SHARED_CHANGED" = "true" ]; then
        if [ "$MINIAPP_APP_CHANGED" = "false" ]; then
            echo "  ✓ Miniapp 受共享代码变更影响"
        fi
        MINIAPP_CHANGED=true
    fi

    if [ "$MINIAPP_CHANGED" = "false" ]; then
        echo "  - Miniapp 无变更"
    fi

    # 5. Layer 变更影响所有应用（确保版本匹配）
    if [ "$LAYER_CHANGED" = "true" ]; then
        echo ""
        echo "检查 Layer 变更影响..."
        if [ "$CONSOLE_CHANGED" = "false" ]; then
            echo "  ✓ Console 受 Layer 变更影响（确保版本匹配）"
            CONSOLE_CHANGED=true
        fi
        if [ "$MINIAPP_CHANGED" = "false" ]; then
            echo "  ✓ Miniapp 受 Layer 变更影响（确保版本匹配）"
            MINIAPP_CHANGED=true
        fi
    fi
fi

# 输出结果（仅变更状态，不包含决策）
echo ""
echo "======================================"
echo "📊 变更检测结果:"
echo "======================================"
echo "  Layer Changed:    $LAYER_CHANGED"
echo "  Shared Changed:   $SHARED_CHANGED"
echo "  Console Changed:  $CONSOLE_CHANGED"
echo "  Miniapp Changed:  $MINIAPP_CHANGED"
echo "======================================"
echo ""

# 输出到 GitHub Actions（如果存在）
if [ -n "$GITHUB_OUTPUT" ]; then
    echo "layer_changed=$LAYER_CHANGED" >> $GITHUB_OUTPUT
    echo "shared_changed=$SHARED_CHANGED" >> $GITHUB_OUTPUT
    echo "console_changed=$CONSOLE_CHANGED" >> $GITHUB_OUTPUT
    echo "miniapp_changed=$MINIAPP_CHANGED" >> $GITHUB_OUTPUT
fi

# 输出到环境变量（供其他脚本使用）
export LAYER_CHANGED
export SHARED_CHANGED
export CONSOLE_CHANGED
export MINIAPP_CHANGED
