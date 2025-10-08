import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DbcResponseBody } from '@dbc/core/dto/response/dbc-response-body';

/**
 * 响应转换拦截器
 *
 * 功能：
 * 1. 拦截所有 Controller 的响应
 * 2. 如果响应不是 DbcResponseBody 实例，自动包装为 DbcResponseBody.success(data)
 * 3. 如果已经是 DbcResponseBody 实例，直接返回
 *
 * 注册方式：
 * - 已在 CoreModule 中通过 APP_INTERCEPTOR 自动注册为全局拦截器
 * - 只需在应用模块中导入 CoreModule 即可自动启用
 */
@Injectable()
export class ResponseTransformInterceptor
    implements NestInterceptor<unknown, DbcResponseBody<unknown>>
{
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<DbcResponseBody<unknown>> {
        return next.handle().pipe(
            map((data: unknown) => {
                // 如果已经是 DbcResponseBody 实例，直接返回
                if (data instanceof DbcResponseBody) {
                    return data;
                }

                // 如果是 undefined 或 null，包装为无数据的成功响应
                if (data === undefined || data === null) {
                    return DbcResponseBody.success();
                }

                // 否则包装为带数据的成功响应
                return DbcResponseBody.success(data);
            }),
        );
    }
}
