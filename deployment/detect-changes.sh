#!/bin/bash

# 变更检测脚本
# 检测哪些应用需要构建和部署，以及 Layer 是否需要更新
#
# 环境变量:
#   FORCE_BUILD=true|1  - 跳过变更检测，强制构建和部署所有东西
#
# 输出:
#   LAYER_CHANGED=true|false
#   DEPLOY_CONSOLE=true|false
#   DEPLOY_MINIAPP=true|false

set -e

echo "======================================"
echo "开始变更检测"
echo "======================================"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录执行此脚本"
    exit 1
fi

# 初始化变量
LAYER_CHANGED=false
DEPLOY_CONSOLE=false
DEPLOY_MINIAPP=false

# 检查是否强制构建
if [ "$FORCE_BUILD" = "true" ] || [ "$FORCE_BUILD" = "1" ]; then
    echo "检测到 FORCE_BUILD 环境变量，跳过变更检测，强制构建所有"
    LAYER_CHANGED=true
    DEPLOY_CONSOLE=true
    DEPLOY_MINIAPP=true
else
    # 检查 Layer 是否需要更新
    if git diff HEAD~1 HEAD package.json 2>/dev/null | grep -q '^+.*"dependencies"\|^-.*"dependencies"'; then
        echo "检测到当前提交中 dependencies 字段有变更"
        LAYER_CHANGED=true
    else
        echo "dependencies 字段无变更"
    fi

    # 检查 Console 应用变更
    CONSOLE_CHANGED=false
    if git diff HEAD~1 HEAD --name-only | grep -q '^apps/console/'; then
        echo "检测到 Console 应用有变更"
        CONSOLE_CHANGED=true
    fi

    # 检查 Miniapp 应用变更
    MINIAPP_CHANGED=false
    if git diff HEAD~1 HEAD --name-only | grep -q '^apps/miniapp/'; then
        echo "检测到 Miniapp 应用有变更"
        MINIAPP_CHANGED=true
    fi

    # 检查共享代码变更
    SHARED_CHANGED=false
    if git diff HEAD~1 HEAD --name-only | grep -qE '^(libs/|config/|webpack\.config\.js|nest-cli\.json|tsconfig.*\.json|deployment/)'; then
        echo "检测到共享代码有变更"
        SHARED_CHANGED=true
    fi

    # 判断 Console 是否需要部署
    if [ "$CONSOLE_CHANGED" = "true" ] || [ "$SHARED_CHANGED" = "true" ]; then
        DEPLOY_CONSOLE=true
    fi

    # 判断 Miniapp 是否需要部署
    if [ "$MINIAPP_CHANGED" = "true" ] || [ "$SHARED_CHANGED" = "true" ]; then
        DEPLOY_MINIAPP=true
    fi
fi

# 输出结果
echo ""
echo "📊 变更检测结果:"
echo "  Layer:   $LAYER_CHANGED"
echo "  Deploy Console:  $DEPLOY_CONSOLE"
echo "  Deploy Miniapp:  $DEPLOY_MINIAPP"
echo ""

# 输出到 GitHub Actions（如果存在）
if [ -n "$GITHUB_OUTPUT" ]; then
    echo "layer=$LAYER_CHANGED" >> $GITHUB_OUTPUT
    echo "deploy_console=$DEPLOY_CONSOLE" >> $GITHUB_OUTPUT
    echo "deploy_miniapp=$DEPLOY_MINIAPP" >> $GITHUB_OUTPUT
fi

# 输出到环境变量（供其他脚本使用）
export LAYER_CHANGED
export DEPLOY_CONSOLE
export DEPLOY_MINIAPP

echo "======================================"
