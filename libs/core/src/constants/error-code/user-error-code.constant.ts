export const USER_ERROR_CODE = {
    // 用户模块错误 21xx
    USER_ERROR_101: {
        code: 2101,
        msg: '用户认证失败',
    },
    USER_ERROR_102: {
        code: 2102,
        msg: '登录会话错误', // 包含过期, 不存在, 其他任何错误
    },
} as const;
