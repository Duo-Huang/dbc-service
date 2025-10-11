/**
 * 统一定义错误码[response.data.code]
 * 错误码规范
 * 统一在一个文件中定义错误码；
 * 错误码长度为 4 位；
 * 第 1 位表示错误是哪种级别？例如：1 为系统级错误，2 为业务模块错误，可标记 9 种错误级别。
 * 第 2 位表示错误是哪个业务模块：例如：1 为用户模块，2 为名片模块，3 展位模块, 可标记 9 个业务模块。
 * 第 3 位和第 4 位表示具体是什么错误：例如：01 为手机号不合法，02 为验证码输入错误，可标记 99 个错误。
 */

export const ERROR_CODE = {
    // 系统级错误 1xxx (发生在全局范围内或者不确定具体地方)
    SYSTEM_ERROR_001: {
        // fallback
        code: 1001,
        msg: '未知错误',
    },
    SYSTEM_ERROR_002: {
        // 处理所有未被全局处理器处理的异常
        code: 1002,
        msg: '请求出错了',
    },
    SYSTEM_ERROR_003: {
        code: 1003,
        msg: '请求参数错误', // 全局参数校验的fallback消息
    },

    // 用户模块错误 21xx
    USER_ERROR_101: {
        code: 2101,
        msg: '用户未认证',
    },
    USER_ERROR_102: {
        code: 2102,
        msg: '无权限访问',
    },
} as const;

/**
 * 错误码类型
 */
export type ErrorCodeType = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];
