/**
 * 统一定义错误码[response.data.code]
 * 错误码规范
 * 统一在一个文件中定义错误码；
 * 错误码长度为 4 位；
 * 第 1 位表示错误是哪种级别？例如：1 为系统级错误，2 为业务模块错误，可标记 9 种错误级别。
 * 第 2 位表示错误是哪个业务模块：例如：1 为用户模块，2 为名片模块，3 展位模块, 可标记 9 个业务模块。
 * 第 3 位和第 4 位表示具体是什么错误：例如：01 为手机号不合法，02 为验证码输入错误，可标记 99 个错误。
 */
import { SYSTEM_ERROR_CODE } from './system-error-code.constant';
import { USER_ERROR_CODE } from './user-error-code.constant';

export const ERROR_CODE = {
    ...SYSTEM_ERROR_CODE,
    ...USER_ERROR_CODE,
} as const;

/**
 * 错误码类型
 */
export type ErrorCodeType = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];
