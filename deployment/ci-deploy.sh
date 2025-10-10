#!/bin/bash

# CI/CD 部署脚本 - 腾讯云 Serverless Components
# 此脚本用于部署应用，支持 Layer 管理依赖和智能变更检测
#
# 环境变量:
#   FORCE_BUILD=true|1  - 跳过变更检测，强制构建和部署所有东西
#
# 用法:
#   ./deployment/ci-deploy.sh
#
# 示例:
#   ./deployment/ci-deploy.sh              # 根据变更检测自动决定
#   FORCE_BUILD=true ./ci-deploy.sh        # 强制构建和部署所有

set -e  # 遇到错误时退出

echo "======================================"
echo "开始 Serverless 部署流程"
echo "======================================"

# 检查构建产物是否存在
if [ ! -d "dist" ]; then
    echo "错误: dist 目录不存在，请先执行构建 (pnpm build)"
    exit 1
fi

# 检查 SCF CLI 是否安装
if ! command -v scf &> /dev/null; then
    echo "错误: SCF CLI 未安装，请先安装"
    echo "安装命令: npm install -g @serverless/cli"
    exit 1
fi

# 1. 检测变更
echo ""
echo "检测应用和 Layer 变更..."
source ./deployment/detect-changes.sh

# 检查是否需要部署
if [ "$LAYER_CHANGED" = "false" ] && [ "$DEPLOY_CONSOLE" = "false" ] && [ "$DEPLOY_MINIAPP" = "false" ]; then
    echo "✅ 无需构建和部署，跳过"
    exit 0
fi

# 2. 部署 Layer（如果需要）
if [ "$LAYER_CHANGED" = "true" ]; then
    echo ""
    echo "Layer 需要更新，开始构建和部署 Layer..."
    ./deployment/layers/dep/build-layer.sh
    cd deployment/layers/dep
    scf deploy
    cd ../../..

    # 更新服务配置中的 Layer 版本
    NEW_VERSION=$(grep 'version:' deployment/layers/dep/serverless.yml | awk '{print $2}')
    echo "🔄 更新服务配置中的 Layer 版本: $NEW_VERSION"
    sed -i "s/version: [0-9]*/version: $NEW_VERSION/" deployment/console/serverless.yml
    sed -i "s/version: [0-9]*/version: $NEW_VERSION/" deployment/miniapp/serverless.yml
    echo "✅ Layer 部署完成，版本: $NEW_VERSION"
else
    echo "✅ Layer 无需更新，跳过"
fi

# 2. 部署应用
deploy_app() {
    local app_name=$1
    local app_display_name=$2

    echo ""
    echo "======================================"
    echo "部署 $app_display_name 应用"
    echo "======================================"

    # 检查构建产物是否存在
    if [ ! -d "dist/apps/$app_name" ]; then
        echo "错误: dist/apps/$app_name 目录不存在，请先构建此应用"
        exit 1
    fi

    # 检查配置文件是否存在
    if [ ! -f "deployment/$app_name/serverless.yml" ]; then
        echo "错误: deployment/$app_name/serverless.yml 不存在"
        exit 1
    fi

    # 部署应用
    echo "🚀 开始部署 $app_display_name..."
    cd deployment/$app_name
    scf deploy
    cd ../..

    echo "✅ $app_display_name 应用部署完成"
}

# 3. 根据检测结果部署应用
if [ "$DEPLOY_CONSOLE" = "true" ]; then
    deploy_app "console" "Console"
fi

if [ "$DEPLOY_MINIAPP" = "true" ]; then
    deploy_app "miniapp" "Miniapp"
fi

echo ""
echo "======================================"
echo "部署完成"
echo "======================================"
echo ""
echo "🎉 所有应用已成功部署到腾讯云！"
echo ""
echo "📋 部署信息:"
echo "  - 使用 Layer 管理依赖，无需打包 node_modules"
echo "  - 应用通过 API Gateway 提供 HTTP 服务"
echo "  - 支持自动扩缩容和按量计费"
echo ""
echo "🔗 查看部署状态:"
echo "  - 腾讯云控制台: https://console.cloud.tencent.com/scf"
echo "  - 或使用命令: scf info"
echo "======================================"

