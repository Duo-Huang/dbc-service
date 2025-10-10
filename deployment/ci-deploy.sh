#!/bin/bash

# CI/CD 部署脚本 - 腾讯云 Serverless Web Function
# 此脚本用于打包应用并生成 Serverless 部署包
#
# 用法:
#   ./deployment/ci-deploy.sh [app]
#
# 参数:
#   app - 要打包的应用 (console | miniapp | all)
#         不指定则打包所有应用
#
# 示例:
#   ./deployment/ci-deploy.sh console  # 只打包 console
#   ./deployment/ci-deploy.sh miniapp  # 只打包 miniapp
#   ./deployment/ci-deploy.sh all      # 打包所有应用
#   ./deployment/ci-deploy.sh          # 打包所有应用（默认）

set -e  # 遇到错误时退出

# 解析参数
APP="${1:-all}"

# 验证参数
if [[ "$APP" != "console" && "$APP" != "miniapp" && "$APP" != "all" ]]; then
    echo "错误: 无效的应用名称 '$APP'"
    echo "用法: $0 [console|miniapp|all]"
    exit 1
fi

echo "======================================"
echo "开始 Serverless 部署打包流程"
echo "目标应用: $APP"
echo "======================================"

# 检查构建产物是否存在
if [ ! -d "dist" ]; then
    echo "错误: dist 目录不存在，请先执行构建 (pnpm build)"
    exit 1
fi

# 创建部署包目录
echo ""
echo "创建部署包目录..."
mkdir -p serverless_package
mkdir -p deployment_temp

# 打包函数
package_app() {
    local app_name=$1
    local app_display_name=$2

    echo ""
    echo "======================================"
    echo "打包 $app_display_name 应用"
    echo "======================================"

    # 检查构建产物是否存在
    if [ ! -d "dist/apps/$app_name" ]; then
        echo "错误: dist/apps/$app_name 目录不存在，请先构建此应用"
        exit 1
    fi

    APP_TEMP="deployment_temp/$app_name"
    mkdir -p $APP_TEMP

    # 1. 复制构建产物
    echo "1. 复制构建产物..."
    cp -r dist/ $APP_TEMP/

    # 2. 复制 package.json 和 lockfile
    echo "2. 复制依赖配置文件..."
    cp package.json $APP_TEMP/
    cp pnpm-lock.yaml $APP_TEMP/

    # 3. 安装生产依赖
    echo "3. 安装生产依赖（仅 production）..."
    cd $APP_TEMP
    pnpm install --prod --frozen-lockfile
    cd ../..

    # 4. 复制 scf_bootstrap 启动脚本
    echo "4. 复制 scf_bootstrap 启动脚本..."
    cp deployment/$app_name/scf_bootstrap $APP_TEMP/
    chmod +x $APP_TEMP/scf_bootstrap

    # 5. 打包成 zip
    echo "5. 打包成 zip..."
    cd $APP_TEMP
    zip -rq ../../serverless_package/$app_name.zip .
    cd ../..

    echo "✅ $app_display_name 应用打包完成: serverless_package/$app_name.zip"
    ls -lh serverless_package/$app_name.zip
}

# 根据参数执行打包
if [[ "$APP" == "console" || "$APP" == "all" ]]; then
    package_app "console" "Console"
fi

if [[ "$APP" == "miniapp" || "$APP" == "all" ]]; then
    package_app "miniapp" "Miniapp"
fi

# 清理临时目录
echo ""
echo "清理临时目录..."
rm -rf deployment_temp

echo ""
echo "======================================"
echo "部署包打包完成"
echo "======================================"
echo ""
echo "生成的部署包:"
ls -lh serverless_package/ 2>/dev/null || echo "  (无部署包)"
echo ""

# 显示部署包结构（如果存在）
if [ "$APP" == "console" ] || [ "$APP" == "all" ]; then
    if [ -f "serverless_package/console.zip" ]; then
        echo "Console 部署包结构:"
        unzip -l serverless_package/console.zip | head -20
        echo ""
    fi
fi

if [ "$APP" == "miniapp" ] || [ "$APP" == "all" ]; then
    if [ -f "serverless_package/miniapp.zip" ]; then
        echo "Miniapp 部署包结构:"
        unzip -l serverless_package/miniapp.zip | head -20
        echo ""
    fi
fi

echo "下一步操作:"
echo "  访问腾讯云 Serverless 应用中心:"
echo "  https://console.cloud.tencent.com/sls"
echo ""
echo "  1. 新建应用 → Web 应用 → Nest.js 框架"
echo "  2. 选择本地上传，上传生成的 zip 文件"
echo "  3. 完成部署，获取访问 URL"
echo "======================================"

