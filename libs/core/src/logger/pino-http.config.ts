import { ConfigService } from '@nestjs/config';
import type { Params } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'http';
import { formatBeijingTime } from '../utils/date-time.util';

/**
 * 创建 Pino HTTP 配置
 *
 * 根据应用配置生成 pino-http 的参数
 */
export function createPinoHttpConfig(configService: ConfigService): Params {
    const prettyPrint = configService.get<boolean>('logger.prettyPrint', false);
    const level = configService.get<string>('logger.level', 'info');

    return {
        pinoHttp: {
            level,
            // 开发环境使用 pino-pretty 美化输出
            transport: prettyPrint
                ? {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname',
                        singleLine: false,
                    },
                }
                : undefined,
            // 生产环境时间戳格式化
            formatters: {
                level: (label: string) => {
                    return { level: label };
                },
                bindings: (bindings: Record<string, unknown>) => {
                    // 移除 pid 和 hostname，减少日志体积
                    return {};
                },
            },
            // 使用东八区时间格式
            timestamp: () => `,"time":"${formatBeijingTime()}"`,
            // 自定义请求/响应序列化器
            serializers: {
                req(req: IncomingMessage & { id?: string | number }) {
                    return {
                        id: req.id,
                        method: req.method,
                        url: req.url,
                        // 可以添加更多字段如：query, params, remoteAddress等
                        // query: req.query,
                        // params: req.params,
                        // remoteAddress: req.remoteAddress,
                        // remotePort: req.remotePort,
                    };
                },
                res(res: ServerResponse & { statusCode: number }) {
                    return {
                        statusCode: res.statusCode,
                    };
                },
            },
            // 自动记录所有HTTP请求
            autoLogging: true,
            // 根据HTTP状态码自动调整日志级别
            customLogLevel: function (
                _req: IncomingMessage,
                res: ServerResponse & { statusCode: number },
                err?: Error,
            ) {
                if (res.statusCode >= 400 && res.statusCode < 500) {
                    return 'warn';
                } else if (res.statusCode >= 500 || err) {
                    return 'error';
                }
                return 'info';
            },
        },
    };
}
