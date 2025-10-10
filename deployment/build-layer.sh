#!/bin/bash

# Layer 构建脚本
# 用于构建包含生产依赖的 Layer

set -e

echo "======================================"
echo "开始构建 Layer"
echo "======================================"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录执行此脚本"
    exit 1
fi

# 创建临时目录
TEMP_DIR="deployment/layers/dep/temp"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "1. 复制 package.json 和 lockfile 到临时目录..."
cp package.json "$TEMP_DIR/"
if [ -f "pnpm-lock.yaml" ]; then
    cp pnpm-lock.yaml "$TEMP_DIR/"
elif [ -f "package-lock.json" ]; then
    cp package-lock.json "$TEMP_DIR/"
fi

echo "2. 安装生产依赖到临时目录..."
cd "$TEMP_DIR"
if [ -f "pnpm-lock.yaml" ]; then
    pnpm install --production --frozen-lockfile
else
    npm install --production
fi
cd ../../../..

echo "3. 复制 node_modules 到 Layer 目录..."
rm -rf "deployment/layers/dep/node_modules"
cp -r "$TEMP_DIR/node_modules" "deployment/layers/dep/"

echo "4. 清理临时目录..."
rm -rf "$TEMP_DIR"

echo "5. 更新 Layer 版本号..."
# 获取当前版本号并递增
CURRENT_VERSION=$(grep 'version:' deployment/layers/dep/serverless.yml | awk '{print $2}' || echo "0")
NEW_VERSION=$((CURRENT_VERSION + 1))
sed -i "s/version: .*/version: $NEW_VERSION/" deployment/layers/dep/serverless.yml

echo "✅ Layer 构建完成，版本: $NEW_VERSION"
echo "======================================"
