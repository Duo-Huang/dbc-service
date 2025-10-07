import { Module } from '@nestjs/common';
import { ConsoleController } from './console.controller';
import { ConsoleService } from './console.service';
import { DbcConfigModule } from '@dbc/core';

@Module({
    imports: [DbcConfigModule],
    controllers: [ConsoleController],
    providers: [ConsoleService],
})
export class ConsoleModule {}
