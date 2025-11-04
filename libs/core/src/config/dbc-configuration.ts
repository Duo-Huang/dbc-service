import config from 'config';
import { plainToClass } from 'class-transformer';
import {
    IsBoolean,
    IsString,
    validateSync,
    IsIn,
    IsNotEmpty,
    ValidateBy,
    ValidationOptions,
    ValidationError,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested, IsNumber, Min, Max } from 'class-validator';
import type { Level } from 'pino';
import { isFQDN, isIP } from 'class-validator';
import { APP_NAMES, type AppName } from '../constants';

/**
 * Pino 日志级别常量
 */
const PINO_LOG_LEVELS: readonly Level[] = [
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal',
] as const;

/**
 * 自定义验证器：验证主机名（支持IP地址和域名）
 */
export function IsHostname(validationOptions?: ValidationOptions) {
    return ValidateBy(
        {
            name: 'isHostname',
            validator: {
                validate: (value: any) => {
                    if (typeof value !== 'string' || value.length === 0) {
                        return false;
                    }

                    // 检查是否为 IP 地址
                    if (isIP(value)) {
                        return true;
                    }

                    // 检查是否为完全限定域名（FQDN）
                    // require_tld: false 允许 localhost 这样没有顶级域名的主机名
                    if (isFQDN(value, { require_tld: false })) {
                        return true;
                    }

                    return false;
                },
                defaultMessage: () => 'host 必须是有效的 IP 地址或域名',
            },
        },
        validationOptions,
    );
}

/**
 * 自定义验证器：验证 CORS origin
 * 支持：
 * 1. 字符串 '*' (允许所有域名)
 * 2. 单个有效的 URL origin (如 https://example.com)
 * 3. 字符串数组，每个都是有效的 URL origin
 */
export function IsCorsOrigin(validationOptions?: ValidationOptions) {
    return ValidateBy(
        {
            name: 'isCorsOrigin',
            validator: {
                validate: (value: any) => {
                    // 允许通配符
                    if (value === '*') {
                        return true;
                    }

                    // 验证单个 origin
                    // 注意：参数类型为 any 是因为数组元素在运行时可能是任何类型（来自配置文件）
                    const validateOrigin = (origin: any): boolean => {
                        // 必须是非空字符串
                        if (typeof origin !== 'string' || origin.length === 0) {
                            return false;
                        }

                        // 允许通配符
                        if (origin === '*') {
                            return true;
                        }

                        // 验证 URL 格式
                        try {
                            const url = new URL(origin);
                            // 必须是 http 或 https 协议
                            if (!['http:', 'https:'].includes(url.protocol)) {
                                return false;
                            }
                            // 验证主机名部分
                            const hostname = url.hostname;
                            return (
                                isIP(hostname) ||
                                isFQDN(hostname, { require_tld: false })
                            );
                        } catch {
                            return false;
                        }
                    };

                    // 如果是数组，验证每一项
                    if (Array.isArray(value)) {
                        return (
                            value.length > 0 &&
                            value.every((origin) => validateOrigin(origin))
                        );
                    }

                    // 如果是字符串，验证单个值
                    if (typeof value === 'string') {
                        return validateOrigin(value);
                    }

                    return false;
                },
                defaultMessage: () =>
                    'origin 必须是 "*" 或有效的 URL（如 https://example.com），或它们的数组',
            },
        },
        validationOptions,
    );
}

/**
 * 服务端口配置类
 */
export class ServerPortConfig {
    @IsNumber()
    @Min(1024, { message: '端口号必须大于等于 1024' })
    @Max(49151, { message: '端口号必须小于等于 49151' })
    port: number;
}

/**
 * CORS Origin 类型定义
 * - '*': 通配符，允许所有域名
 * - string: 单个有效的 HTTP/HTTPS URL (如 'https://example.com')
 * - string[]: 多个有效的 HTTP/HTTPS URL 数组
 */
export type CorsOriginValue = string | string[];

/**
 * CORS 配置类
 */
export class CorsConfig {
    @IsCorsOrigin()
    origin: CorsOriginValue;

    @IsBoolean()
    credentials: boolean;
}

/**
 * 日志配置类
 */
export class LoggerConfig {
    @IsBoolean()
    prettyPrint: boolean;

    @IsString()
    @IsIn(PINO_LOG_LEVELS, {
        message: `level 必须是以下值之一: ${PINO_LOG_LEVELS.join(', ')}`,
    })
    level: Level;
}

/**
 * 数据源配置类
 */
export class DatasourceConfig {
    @IsHostname()
    host: string;

    @IsNumber()
    @Min(1024, { message: '端口号必须大于等于 1024' })
    @Max(49151, { message: '端口号必须小于等于 49151' })
    port: number;

    @IsString()
    @IsNotEmpty({ message: 'database 不能为空' })
    database: string;

    @IsString()
    @IsNotEmpty({ message: 'schema 不能为空' })
    schema: string;

    @IsString()
    @IsNotEmpty({ message: 'username 不能为空' })
    username: string;

    @IsString()
    password: string;
}

/**
 * Miniprogram 应用配置类
 * 独立的配置类，支持未来添加 miniprogram 特有配置
 */
export class MiniprogramConfig {
    @ValidateNested()
    @Type(() => ServerPortConfig)
    server: ServerPortConfig;

    @ValidateNested()
    @Type(() => CorsConfig)
    cors: CorsConfig;

    @ValidateNested()
    @Type(() => DatasourceConfig)
    datasource: DatasourceConfig;

    @ValidateNested()
    @Type(() => LoggerConfig)
    logger: LoggerConfig;

    // 未来可以添加 miniprogram 特有配置，例如：
    // @ValidateNested()
    // @Type(() => WechatConfig)
    // wechat?: WechatConfig;
}

/**
 * Console 应用配置类
 * 独立的配置类，支持未来添加 console 特有配置
 */
export class ConsoleConfig {
    @ValidateNested()
    @Type(() => ServerPortConfig)
    server: ServerPortConfig;

    @ValidateNested()
    @Type(() => CorsConfig)
    cors: CorsConfig;

    @ValidateNested()
    @Type(() => DatasourceConfig)
    datasource: DatasourceConfig;

    @ValidateNested()
    @Type(() => LoggerConfig)
    logger: LoggerConfig;

    // 未来可以添加 console 特有配置，例如：
    // @ValidateNested()
    // @Type(() => SessionConfig)
    // session?: SessionConfig;
}

/**
 * DBC 应用配置类
 * 全局配置对象，包含所有应用配置
 *
 * miniprogram 和 console 使用独立的配置类，完全解耦
 * 每个应用可以拥有各自特有的配置字段
 *
 * 属性名与 APP_NAMES 常量值保持一致，确保类型安全
 */
export class DbcConfiguration {
    @ValidateNested()
    @Type(() => MiniprogramConfig)
    [APP_NAMES.MINIPROGRAM]: MiniprogramConfig;

    @ValidateNested()
    @Type(() => ConsoleConfig)
    [APP_NAMES.CONSOLE]: ConsoleConfig;
}

/**
 * 配置加载函数
 * 自动按优先级加载配置：环境变量 > 环境特定配置文件 > default.yaml
 *
 * 根据 APP_NAME 环境变量返回对应应用的完整配置
 * - 直接返回 MiniprogramConfig 或 ConsoleConfig 对象
 * - 支持未来差异化配置（如 miniprogram 的 wechat，console 的 session）
 * - 访问不存在的配置字段会返回 undefined，实现自然隔离
 */
export default () => {
    // 1. 使用 config 包获取合并后的配置（已包含环境变量覆盖）
    const rawConfig = config.util.toObject() as Record<string, unknown>;

    // 2. 转换为类实例（自动类型转换）
    const configInstance = plainToClass(DbcConfiguration, rawConfig, {
        enableImplicitConversion: true, // 启用隐式类型转换
    });

    // 3. 验证配置
    const errors = validateSync(configInstance, {
        skipMissingProperties: false,
        whitelist: true,
        forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
        // 递归提取所有错误消息，包括嵌套对象的错误
        const extractErrors = (
            error: ValidationError,
            prefix = '',
        ): string[] => {
            const messages: string[] = [];

            if (error.constraints) {
                const path = prefix || error.property;
                messages.push(
                    ...Object.values(error.constraints).map(
                        (msg: string) => `${path}: ${msg}`,
                    ),
                );
            }

            if (error.children && error.children.length > 0) {
                const currentPath = prefix
                    ? `${prefix}.${error.property}`
                    : error.property;
                error.children.forEach((child: ValidationError) => {
                    messages.push(...extractErrors(child, currentPath));
                });
            }

            return messages;
        };

        const errorMessages = errors
            .flatMap((error) => extractErrors(error))
            .join('; ');
        throw new Error(`配置验证失败: ${errorMessages}`);
    }

    // 4. 获取当前运行的应用名称（从环境变量）
    const appName = process.env.APP_NAME as AppName;

    if (!appName || !Object.values(APP_NAMES).includes(appName)) {
        throw new Error(
            `APP_NAME 环境变量未设置或无效，必须是 ${Object.values(APP_NAMES).join(' 或 ')}`,
        );
    }

    // 5. 直接返回当前应用的完整配置对象
    return configInstance[appName];
};
