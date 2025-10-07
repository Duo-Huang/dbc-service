import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '@dbc/core/constants/error-code';
import { HTTP_ERROR_CODE } from '@dbc/core/constants/http-error-code';
import { DbcResponseBody } from '@dbc/core/dto/response/dbc-response-body';

/**
 * 全局异常过滤器
 *
 * 功能：
 * 1. 捕获所有未被处理的异常
 * 2. 对 HttpException 返回对应的状态码
 * 3. 对未知异常返回 500 状态码
 * 4. 统一转换为 DbcResponseBody 格式
 *
 * 使用方式：
 * 在 main.ts 中注册：
 * app.useGlobalFilters(new AllExceptionsFilter());
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // 处理 NestJS 的 HttpException
        if (exception instanceof HttpException) {
            const statusCode = exception.getStatus();
            // const exceptionResponse = exception.getResponse();

            // 记录日志
            this.logger.warn(
                `HTTP exception: [${statusCode}] ${exception.message} - ${request.method} ${request.url}`,
            );

            // 获取友好的错误消息（优先使用映射表中的中文消息）
            const friendlyMessage =
                HTTP_ERROR_CODE[statusCode as keyof typeof HTTP_ERROR_CODE] ||
                exception.message;

            // 创建错误响应
            const responseBody = DbcResponseBody.error(
                ErrorCode.SYSTEM_ERROR_002.code,
                friendlyMessage,
            );

            return response.status(statusCode).json(responseBody);
        }

        // 处理未知异常
        this.logger.error(
            `Unexpected exception: ${String(exception)} - ${request.method} ${request.url}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        // 返回通用错误响应
        const responseBody = DbcResponseBody.error(ErrorCode.SYSTEM_ERROR_001);

        return response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json(responseBody);
    }
}
