import { ErrorCodeType } from '@dbc/core/constants/error-code';

/**
 * 统一响应体 DTO
 *
 * 用于封装所有 API 响应的标准格式
 */
export class ResponseDto<T = any> {
    constructor(
        public code: number,
        public message: string | null,
        public data: T | null,
    ) {}

    /**
     * 创建成功响应（带数据）
     */
    static success<T>(data: T): ResponseDto<T>;
    /**
     * 创建成功响应（无数据）
     */
    static success(): ResponseDto<null>;
    static success<T>(data?: T): ResponseDto<T | null> {
        return new ResponseDto<T | null>(0, null, data ?? null);
    }

    /**
     * 从 ErrorCodeType 创建错误响应（带数据）
     */
    static error<T>(errorCode: ErrorCodeType, data: T): ResponseDto<T>;
    /**
     * 从 ErrorCodeType 创建错误响应（无数据）
     */
    static error(errorCode: ErrorCodeType): ResponseDto<null>;
    /**
     * 从 code 和 message 创建错误响应（带数据）
     */
    static error<T>(code: number, message: string, data: T): ResponseDto<T>;
    /**
     * 从 code 和 message 创建错误响应（无数据）
     */
    static error(code: number, message: string): ResponseDto<null>;
    static error<T>(
        errorCodeOrCode: ErrorCodeType | number,
        messageOrData?: string | T,
        data?: T,
    ): ResponseDto<T | null> {
        // 如果第一个参数是 ErrorCodeType 对象（有 code 和 msg 属性）
        if (
            typeof errorCodeOrCode === 'object' &&
            errorCodeOrCode !== null &&
            'code' in errorCodeOrCode &&
            'msg' in errorCodeOrCode
        ) {
            const errorCode = errorCodeOrCode;
            // 如果有第二个参数，则是 data
            const responseData =
                messageOrData !== undefined ? (messageOrData as T) : null;
            return new ResponseDto<T | null>(
                errorCode.code,
                errorCode.msg,
                responseData,
            );
        }

        // 如果第一个参数是 number，则第二个参数是 message
        const code = errorCodeOrCode;
        const message = messageOrData as string;
        return new ResponseDto<T | null>(code, message, data ?? null);
    }
}
