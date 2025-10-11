const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (options) {
    const filename = options.output?.filename || '';
    const appDir = path.dirname(filename);
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        ...options,
        // 设置 mode（Webpack 会根据此启用不同的优化）
        mode: isProduction ? 'production' : 'development',

        // Source map 配置：服务端代码无需隐藏，生产和开发都生成完整的 source-map
        devtool: 'source-map',

        // 输出配置
        output: {
            ...options.output,
            // Source map 路径映射：使用绝对路径
            // 1. 开发环境：file:// 协议，终端可点击跳转
            // 2. 生产环境：普通绝对路径，source-map-support 可正确解析
            // 注意：必须使用绝对路径，相对路径会导致 source-map-support 基于 dist 目录拼接，产生错误路径
            devtoolModuleFilenameTemplate: (info) => {
                const absolutePath = info.absoluteResourcePath.replace(
                    /\\/g,
                    '/',
                );
                // 开发环境添加 file:// 协议以便点击
                return isProduction ? absolutePath : `file:///${absolutePath}`;
            },
        },

        // 优化配置
        optimization: {
            // 生产环境启用压缩
            minimize: isProduction,
            minimizer: isProduction
                ? [
                      new TerserPlugin({
                          terserOptions: {
                              // 禁用代码压缩优化（不改变代码结构）
                              compress: false,
                              // 禁用变量名混淆（保持所有原始名称）
                              mangle: false,
                              // 只做格式化压缩：去掉空格、换行、注释
                              format: {
                                  comments: false, // 移除注释
                              },
                          },
                          extractComments: false, // 不提取注释到单独文件
                          parallel: true, // 并行压缩
                      }),
                  ]
                : [],
        },

        // 性能提示
        performance: {
            hints: isProduction ? 'warning' : false,
            maxEntrypointSize: 1024 * 1024, // 1MB
            maxAssetSize: 1024 * 1024, // 1MB
        },

        plugins: [
            ...options.plugins,
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, 'config'),
                        to: path.join(appDir, 'config'),
                    },
                ],
            }),
        ],
    };
};
