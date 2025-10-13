#!/bin/bash

# 变更检测脚本
# 检测代码变更状态，不做决策，决策由调用者完成
#
# 环境变量:
#   FORCE_BUILD=true|1  - 跳过变更检测，强制标记所有为已变更
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
    # 1. 检查 Layer 是否需要更新（依赖变更）
    echo ""
    echo "检查依赖变更..."
    if git diff HEAD~1 HEAD package.json 2>/dev/null | grep -q '^+.*"dependencies"\|^-.*"dependencies"'; then
        echo "  ✓ dependencies 字段有变更"
        LAYER_CHANGED=true
    else
        echo "  - dependencies 字段无变更"
    fi

    # 2. 先检查共享代码变更（优先级最高，影响所有应用）
    echo ""
    echo "检查共享代码变更..."
    if git diff HEAD~1 HEAD --name-only | grep -qE '^(libs/|config/|webpack\.config\.js|nest-cli\.json|tsconfig.*\.json|deployment/)'; then
        echo "  ✓ 共享代码有变更 (libs/, config/ 等)"
        SHARED_CHANGED=true
    else
        echo "  - 共享代码无变更"
    fi

    # 3. 检查 Console 应用变更（包含 shared 影响）
    echo ""
    echo "检查 Console 应用..."
    CONSOLE_APP_CHANGED=false
    if git diff HEAD~1 HEAD --name-only | grep -q '^apps/console/'; then
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
    if git diff HEAD~1 HEAD --name-only | grep -q '^apps/miniapp/'; then
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
