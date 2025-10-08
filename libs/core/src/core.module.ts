import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DbcConfigModule } from './config/dbc-config.module';
import { LoggerModule } from './logger/logger.module';
import { CoreService } from './core.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor';

/**
 * DBC 核心模块
 *
 * 功能说明：
 * 1. 作为全局模块（@Global），所有子应用只需导入一次即可使用所有功能
 * 2. 统一管理配置、日志、异常处理、响应转换等核心功能
 * 3. 自动提供以下服务供全局使用：
 *    - ConfigService: 配置服务（来自 DbcConfigModule）
 *    - Logger/PinoLogger: 日志服务（来自 LoggerModule）
 *    - CoreService: 核心服务
 *    - AllExceptionsFilter: 全局异常过滤器（已自动注册）
 *    - ResponseTransformInterceptor: 响应转换拦截器（已自动注册）
 */
@Global()
@Module({
    imports: [DbcConfigModule, LoggerModule],
    providers: [
        CoreService,
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseTransformInterceptor,
        },
    ],
})
export class CoreModule {}
