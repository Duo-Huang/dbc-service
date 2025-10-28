import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConsoleModule } from './console.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { VersioningType } from '@nestjs/common';
import { APP_NAMES, type CorsOriginValue } from '@dbc/core';

// 启动source-map, 用于错误日志的错误堆栈映射
if (process.env.NODE_ENV === 'production') {
    void import('source-map-support').then((sms) => {
        sms.install({
            handleUncaughtExceptions: false,
        });
    });
}

// 设置应用名称，供配置模块使用
process.env.APP_NAME = APP_NAMES.CONSOLE;

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        ConsoleModule,
        new FastifyAdapter(),
        {
            bufferLogs: true,
        },
    );

    // 使用 Pino Logger 替换默认 Logger
    app.useLogger(app.get(Logger));

    // 设置全局路由前缀
    app.setGlobalPrefix('/api/web');

    // 启用 API 版本控制
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // CoreModule 已自动注册全局拦截器和异常过滤器

    const configService = app.get(ConfigService);
    const logger = app.get(Logger);

    // 启用 CORS
    const corsOrigin = configService.get<CorsOriginValue>('cors.origin');
    const corsCredentials = configService.get<boolean>('cors.credentials');

    if (corsOrigin) {
        app.enableCors({
            origin: corsOrigin,
            credentials: corsCredentials,
        });
    }

    // 从配置中获取端口（优先级：环境变量 > 环境配置文件 > default.yaml）
    // 配置已扁平化，直接访问 server.port
    const port = configService.get<number>('server.port') || 9000;
    const host = '0.0.0.0';

    await app.listen(port, host);
    logger.log(`Application is running on: http://${host}:${port}`);
}
bootstrap();
