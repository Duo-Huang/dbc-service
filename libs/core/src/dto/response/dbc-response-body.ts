import { ErrorCodeType } from '@dbc/core/constants/error-code';

/**
 * DBC 统一响应体
 *
 * 完全对应 Java 的 HmsResponseBody 实现
 */
export class DbcResponseBody<T = any> {
    constructor(
        public code: number,
        public message: string | null,
        public data: T | null,
    ) { }

    /**
     * 创建成功响应（带数据）
     */
    static success<T>(data: T): DbcResponseBody<T>;
    /**
     * 创建成功响应（无数据）
     */
    static success(): DbcResponseBody<null>;
    static success<T>(data?: T): DbcResponseBody<T | null> {
        return new DbcResponseBody<T | null>(0, null, data ?? null);
    }

    /**
     * 从 ErrorCodeType 创建错误响应（带数据）
     */
    static error<T>(errorCode: ErrorCodeType, data: T): DbcResponseBody<T>;
    /**
     * 从 ErrorCodeType 创建错误响应（无数据）
     */
    static error(errorCode: ErrorCodeType): DbcResponseBody<null>;
    /**
     * 从 code 和 message 创建错误响应（带数据）
     */
    static error<T>(code: number, message: string, data: T): DbcResponseBody<T>;
    /**
     * 从 code 和 message 创建错误响应（无数据）
     */
    static error(code: number, message: string): DbcResponseBody<null>;
    static error<T>(
        errorCodeOrCode: ErrorCodeType | number,
        messageOrData?: string | T,
        data?: T,
    ): DbcResponseBody<T | null> {
        // 如果第一个参数是 ErrorCodeType 对象（有 code 和 message 属性）
        if (
            typeof errorCodeOrCode === 'object' &&
            errorCodeOrCode !== null &&
            'code' in errorCodeOrCode &&
            'message' in errorCodeOrCode
        ) {
            const errorCode = errorCodeOrCode;
            // 如果有第二个参数，则是 data
            const responseData =
                messageOrData !== undefined ? (messageOrData as T) : null;
            return new DbcResponseBody<T | null>(
                errorCode.code,
                errorCode.message,
                responseData,
            );
        }

        // 如果第一个参数是 number，则第二个参数是 message
        const code = errorCodeOrCode;
        const message = messageOrData as string;
        return new DbcResponseBody<T | null>(code, message, data ?? null);
    }
}
