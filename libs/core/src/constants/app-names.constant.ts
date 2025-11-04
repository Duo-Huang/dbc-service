/**
 * 应用名称常量
 *
 * 用于配置模块识别当前运行的应用
 */
export const APP_NAMES = {
    MINIPROGRAM: 'miniprogram',
    CONSOLE: 'console',
} as const;

export type AppName = (typeof APP_NAMES)[keyof typeof APP_NAMES];
