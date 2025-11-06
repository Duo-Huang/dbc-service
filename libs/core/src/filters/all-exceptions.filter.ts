import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ERROR_CODE } from '@dbc/core/constants/error-code';
import { HTTP_ERROR_CODE } from '@dbc/core/constants';
import { ResponseDto } from '@dbc/core/dto/response.dto';
import { PinoLogger } from 'nestjs-pino';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 全局异常过滤器
 *
 * 功能：
 * 1. 捕获所有未被处理的异常
 * 2. 对 HttpException 返回对应的状态码
 * 3. 对未知异常返回 500 状态码
 * 4. 统一转换为 ResponseDto 格式
 *
 * 注册方式：
 * - 已在 CoreModule 中通过 APP_FILTER 自动注册为全局过滤器
 * - 只需在应用模块中导入 CoreModule 即可自动启用
 * - 支持依赖注入（需要 PinoLogger）
 */
@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly logger: PinoLogger) {
        this.logger.setContext(AllExceptionsFilter.name);
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<FastifyRequest>();
        const response = ctx.getResponse<FastifyReply>();

        // 处理 NestJS 的 HttpException
        if (exception instanceof HttpException) {
            const statusCode = exception.getStatus();
            // const exceptionResponse = exception.getResponse();

            // 记录日志
            this.logger.warn(
                {
                    err: exception,
                    statusCode,
                },
                'HTTP exception',
            );

            // 获取友好的错误消息（优先使用映射表中的中文消息）
            const friendlyMessage =
                HTTP_ERROR_CODE[statusCode as keyof typeof HTTP_ERROR_CODE] ||
                exception.message;

            // 创建错误响应
            const responseBody = ResponseDto.error(
                ERROR_CODE.SYSTEM_ERROR_002.code,
                friendlyMessage || ERROR_CODE.SYSTEM_ERROR_002.msg,
            );

            return response.code(statusCode).send(responseBody);
        }

        // 业务异常处理
        if (exception instanceof BusinessException) {
            // 记录日志
            this.logger.warn(
                {
                    err: exception,
                    statusCode: HttpStatus.BAD_REQUEST,
                },
                'Business exception',
            );

            // 创建错误响应
            const responseBody = ResponseDto.error(exception.errorCode);

            return response.code(HttpStatus.BAD_REQUEST).send(responseBody);
        }

        // 处理未知异常
        this.logger.error(
            {
                err:
                    exception instanceof Error
                        ? exception
                        : new Error(String(exception)),
                method: request.method,
                url: request.url,
            },
            'Unexpected exception',
        );

        // 返回通用错误响应
        const responseBody = ResponseDto.error(ERROR_CODE.SYSTEM_ERROR_001);

        return response
            .code(HttpStatus.INTERNAL_SERVER_ERROR)
            .send(responseBody);
    }
}
