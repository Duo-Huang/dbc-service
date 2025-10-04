import { Injectable } from '@nestjs/common';

@Injectable()
export class MiniappService {
    getHello(): string {
        return 'Hello World!';
    }
}
