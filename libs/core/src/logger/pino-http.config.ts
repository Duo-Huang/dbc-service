import { ConfigService } from '@nestjs/config';
import type { Params } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'http';
import { formatLocalTime } from '../utils/date-time.util';

/**
 * 创建 Pino HTTP 配置
 *
 * 根据应用配置生成 pino-http 的参数
 *
 * 配置加载函数已经根据 APP_NAME 环境变量返回了当前应用的配置，
 * 所以直接使用扁平化的 logger 配置即可。
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
            // 自定义日志格式化
            formatters: {
                level: (label: string) => {
                    return { level: label };
                },
                bindings: (bindings: Record<string, unknown>) => {
                    // 选择性移除 pid 和 hostname，保留其他 bindings
                    const {
                        pid: _,
                        hostname: _hostname,
                        type: _type,
                        ...rest
                    } = bindings;
                    return rest;
                },
            },
            // 使用东八区时间格式
            timestamp: () => `,"time":"${formatLocalTime()}"`,
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
                // 自定义 Error 序列化器
                // 生产环境：代码已压缩混淆，stack trace 无实际意义，故移除
                // 依赖 type + errorCode + message + 上下文信息定位问题
                // err(err: Error) {
                //     // 移除 stack，保留其他所有属性（包括 errorCode）
                //     const { stack: _, ...rest } = err;
                //     return {
                //         ...rest,
                //         ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
                //     };
                // },
            },
            // 自动记录所有HTTP请求
            autoLogging: true,
            // 根据HTTP状态码自动调整日志级别
            customLogLevel: function (
                req: IncomingMessage,
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
