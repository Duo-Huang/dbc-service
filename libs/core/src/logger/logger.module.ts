import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createPinoHttpConfig } from './pino-http.config';

/**
 * 全局Logger模块
 *
 * 功能：
 * - 集成 Pino 高性能日志系统
 * - 自动记录所有 HTTP 请求（method、url、状态码、响应时间）
 * - 支持结构化 JSON 日志（生产环境）和美化输出（开发环境）
 * - 使用 @Global() 装饰器，所有模块都可以直接注入 Logger 和 PinoLogger
 *
 * 使用方式：
 * ```typescript
 * import { Logger } from '@nestjs/common';
 *
 * class YourService {
 *   private readonly logger = new Logger(YourService.name);
 *
 *   someMethod() {
 *     this.logger.log('操作成功');
 *   }
 * }
 * ```
 *
 * 注意：
 * - LoggerModule 仍需在应用模块中导入以配置 HTTP 中间件
 * - 配置从 ConfigService 读取（logger.level 和 logger.prettyPrint）
 */
@Global()
@Module({
    imports: [
        PinoLoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: createPinoHttpConfig,
        }),
    ],
    exports: [PinoLoggerModule],
})
export class LoggerModule {}
