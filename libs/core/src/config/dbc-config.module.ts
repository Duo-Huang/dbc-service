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
 *
 * 3. 全局共享：isGlobal: true 使配置在整个应用中可用
 *
 * 使用示例：
 * ```typescript
 * constructor(private configService: ConfigService) {
 *   const port = this.configService.get<number>('server.miniapp.port');
 *   const dbcConfig = this.configService.get<DbcConfiguration>('server');
 * }
 * ```
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // 全局模块，所有模块都可以注入 ConfigService
            cache: true, // 缓存配置，确保单例
            load: [configuration], // 加载配置加载函数
        }),
    ],
    // exports: [ConfigModule]
})
export class DbcConfigModule {}
