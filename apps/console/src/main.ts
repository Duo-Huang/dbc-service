import { NestFactory } from '@nestjs/core';
import { ConsoleModule } from './console.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter, ResponseTransformInterceptor } from '@dbc/core';

async function bootstrap() {
    const app = await NestFactory.create(ConsoleModule);

    // 注册全局响应转换拦截器（自动包装响应为统一格式）
    app.useGlobalInterceptors(new ResponseTransformInterceptor());

    // 注册全局异常过滤器（处理未捕获的异常）
    app.useGlobalFilters(new AllExceptionsFilter());

    const configService = app.get(ConfigService);

    // 从配置中获取端口（优先级：环境变量 > 环境配置文件 > default.yaml）
    const port = configService.get<number>('server.console.port') || 9000;
    const host = '0.0.0.0';

    await app.listen(port, host);
    console.log(`Application is running on: http://${host}:${port}`);
    console.log(`当前环境: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
