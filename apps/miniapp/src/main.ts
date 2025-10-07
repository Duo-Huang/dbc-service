import { NestFactory } from '@nestjs/core';
import { MiniappModule } from './miniapp.module';
import { ConfigService } from '@nestjs/config';
import { ResponseTransformInterceptor } from '@dbc/core';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
    const app = await NestFactory.create(MiniappModule, {
        bufferLogs: true,
    });

    // 使用 Pino Logger 替换默认 Logger
    app.useLogger(app.get(Logger));

    app.useGlobalInterceptors(new ResponseTransformInterceptor());

    // AllExceptionsFilter 已通过 APP_FILTER 在 module 中注册，无需在此处注册

    const configService = app.get(ConfigService);

    // 从配置中获取端口（优先级：环境变量 > 环境配置文件 > default.yaml）
    const port = configService.get<number>('server.miniapp.port') || 9000;
    const host = '0.0.0.0';
    const logger = app.get(Logger);

    await app.listen(port, host);
    logger.log(`Application is running on: http://${host}:${port}`);
    logger.log(`当前环境: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
