import { NestFactory } from '@nestjs/core';
import { ConsoleModule } from './console.module';

async function bootstrap() {
    const app = await NestFactory.create(ConsoleModule);

    // 腾讯云 Web Function 要求监听 0.0.0.0:9000
    const host = process.env.HOST || '0.0.0.0';
    const port = process.env.PORT || 9000;

    await app.listen(port, host);
    console.log(`Application is running on: http://${host}:${port}`);
}

bootstrap();
