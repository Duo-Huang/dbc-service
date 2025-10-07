/**
 * 统一定义错误码[response.data.code]
 * 错误码规范
 * 统一在一个文件中定义错误码；
 * 错误码长度为 4 位；
 * 第 1 位表示错误是哪种级别？例如：1 为系统级错误，2 为业务模块错误，可标记 9 种错误级别。
 * 第 2 位表示错误是哪个业务模块：例如：1 为用户模块，2 为名片模块，3 展位模块, 可标记 9 个业务模块。
 * 第 3 位和第 4 位表示具体是什么错误：例如：01 为手机号不合法，02 为验证码输入错误，可标记 99 个错误。
 */

/**
 * 业务异常类
 * 只包含业务错误码和错误消息
 * HTTP 状态码由 Controller 层或全局过滤器根据具体情况设置
 */
export class ErrorCode {
    constructor(
        public readonly code: number,
        public readonly message: string,
    ) {}

    // ==================== 系统级错误 1xxx ====================

    static readonly SYSTEM_ERROR_001 = new ErrorCode(1001, '未知错误');
    static readonly SYSTEM_ERROR_002 = new ErrorCode(1002, '请求出错了');
    static readonly SYSTEM_ERROR_003 = new ErrorCode(1003, '请求参数错误');
    static readonly SYSTEM_ERROR_004 = new ErrorCode(1004, '业务异常');

    // ==================== 用户模块错误 21xx ====================

    static readonly USER_ERROR_101 = new ErrorCode(2101, '用户未认证');
    static readonly USER_ERROR_102 = new ErrorCode(2102, '无权限访问');
}
