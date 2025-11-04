import { Module } from '@nestjs/common';
import { MiniprogramController } from './miniprogram.controller';
import { MiniprogramService } from './miniprogram.service';
import { CoreModule } from '@dbc/core';

@Module({
    imports: [
        // 导入 CoreModule，自动获得配置、日志、全局异常处理等所有核心功能
        CoreModule,
    ],
    controllers: [MiniprogramController],
    providers: [MiniprogramService],
})
export class MiniprogramModule {}
