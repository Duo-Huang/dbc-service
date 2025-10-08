import { Module } from '@nestjs/common';
import { ConsoleController } from './console.controller';
import { ConsoleService } from './console.service';
import { CoreModule } from '@dbc/core';

@Module({
    imports: [
        // 导入 CoreModule，自动获得配置、日志、全局异常处理等所有核心功能
        CoreModule,
    ],
    controllers: [ConsoleController],
    providers: [ConsoleService],
})
export class ConsoleModule {}
