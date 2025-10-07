import { Module } from '@nestjs/common';
import { MiniappController } from './miniapp.controller';
import { MiniappService } from './miniapp.service';
import { DbcConfigModule, LoggerModule, AllExceptionsFilter } from '@dbc/core';
import { APP_FILTER } from '@nestjs/core';

@Module({
    imports: [
        DbcConfigModule,
        // LoggerModule 现在是全局模块，但仍需导入以配置其中间件
        LoggerModule,
    ],
    controllers: [MiniappController],
    providers: [
        MiniappService,
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
    ],
})
export class MiniappModule {}
