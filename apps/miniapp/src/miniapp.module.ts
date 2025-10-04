import { Module } from '@nestjs/common';
import { MiniappController } from './miniapp.controller';
import { MiniappService } from './miniapp.service';

@Module({
    imports: [],
    controllers: [MiniappController],
    providers: [MiniappService],
})
export class MiniappModule {}
