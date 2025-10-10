import { NestFactory } from '@nestjs/core';
import { MiniappModule } from './miniapp.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { VersioningType } from '@nestjs/common';
import { APP_NAMES } from '@dbc/core';

// 设置应用名称，供配置模块使用
process.env.APP_NAME = APP_NAMES.MINIAPP;

async function bootstrap() {
    const app = await NestFactory.create(MiniappModule, {
        bufferLogs: true,
    });

    // 使用 Pino Logger 替换默认 Logger
    app.useLogger(app.get(Logger));

    // 设置全局路由前缀
    app.setGlobalPrefix('api');

    // 启用 API 版本控制
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // CoreModule 已自动注册全局拦截器和异常过滤器

    const configService = app.get(ConfigService);

    // 从配置中获取端口（优先级：环境变量 > 环境配置文件 > default.yaml）
    // 配置已扁平化，直接访问 server.port
    const port = configService.get<number>('server.port') || 9000;
    const host = '0.0.0.0';
    const logger = app.get(Logger);

    await app.listen(port, host);
    logger.log(`Application is running on: http://${host}:${port}`);
    logger.log(`当前环境: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
