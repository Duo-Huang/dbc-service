import { Module } from '@nestjs/common';
import { MiniappController } from './miniapp.controller';
import { MiniappService } from './miniapp.service';
import { CoreModule } from '@dbc/core';

@Module({
    imports: [
        // 导入 CoreModule，自动获得配置、日志、全局异常处理等所有核心功能
        CoreModule,
    ],
    controllers: [MiniappController],
    providers: [MiniappService],
})
export class MiniappModule {}
