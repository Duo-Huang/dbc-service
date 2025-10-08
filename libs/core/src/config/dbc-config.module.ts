import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './dbc-configuration';

/**
 * DBC 配置模块
 *
 * 功能说明：
 * 1. 自动按优先级加载配置文件：
 *    - config/default.yaml (基础配置)
 *    - config/${NODE_ENV}.yaml (环境特定配置)
 *    - 环境变量覆盖 (通过 custom-environment-variables.yaml 映射)
 *
 * 2. 配置验证：使用 class-validator 验证配置的正确性
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            cache: true,
            load: [configuration],
        }),
    ],
})
export class DbcConfigModule {}
