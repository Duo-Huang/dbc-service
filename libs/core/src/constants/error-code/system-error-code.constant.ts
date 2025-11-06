export const SYSTEM_ERROR_CODE = {
    // 系统级错误 1xxx (发生在全局范围内或者不确定具体地方)
    SYSTEM_ERROR_001: {
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
} as const;
