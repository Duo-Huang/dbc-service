import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createPinoHttpConfig } from './pino-http.config';

/**
 * Logger模块
 *
 * 功能：
 * - 集成 Pino 高性能日志系统
 * - 自动记录所有 HTTP 请求（method、url、状态码、响应时间）
 * - 支持结构化 JSON 日志（生产环境）和美化输出（开发环境）
 * - 通过 CoreModule 的全局性使 Logger 和 PinoLogger 在整个应用中可用
 */
@Module({
    imports: [
        PinoLoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: createPinoHttpConfig,
        }),
    ],
})
export class LoggerModule { }
