import { ErrorCodeType } from '@dbc/core/constants/error-code';

/**
 * 业务异常基类
 *
 * 用于封装业务逻辑错误，携带结构化的错误码信息
 *
 * 使用示例：
 * ```typescript
 * // 定义具体的业务异常
 * class InvitationCodeExpiredException extends BusinessException {
 *     constructor() {
 *         super(ERROR_CODE.USER_ERROR_101);
 *     }
 * }
 *
 * // 抛出异常
 * throw new InvitationCodeExpiredException();
 * ```
 */
export abstract class BusinessException extends Error {
    public readonly errorCode: ErrorCodeType;

    protected constructor(errorCode: ErrorCodeType) {
        super(errorCode.msg);
        // 捕获堆栈信息，移除构造函数本身，让堆栈更清晰
        Error.captureStackTrace(this, this.constructor);
        this.errorCode = errorCode;
        // 自动设置为子类的类名，便于识别
        this.name = this.constructor.name;
    }
}
