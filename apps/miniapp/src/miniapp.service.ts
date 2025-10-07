import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MiniappService {
    // 直接实例化，像以前一样方便！（底层是Pino）
    private readonly logger = new Logger(MiniappService.name);

    getHello(): string {
        this.logger.log('getHello方法被调用');
        return 'Hello World!';
    }
}
