import config from 'config';
import { plainToClass } from 'class-transformer';
import { IsBoolean, IsString, validateSync, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested, IsNumber, Min, Max } from 'class-validator';
import type { Level } from 'pino';

/**
 * Pino 日志级别常量
 * 从 Pino 的 Level 类型定义中提取，避免硬编码
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
 * 服务端口配置类
 */
export class ServerPortConfig {
    @IsNumber()
    @Min(1024, { message: '端口号必须大于等于 1024' })
    @Max(49151, { message: '端口号必须小于等于 49151' })
    port: number;
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
 * 服务器配置类
 */
export class ServerConfig {
    @ValidateNested()
    @Type(() => ServerPortConfig)
    miniapp: ServerPortConfig;

    @ValidateNested()
    @Type(() => ServerPortConfig)
    console: ServerPortConfig;
}

/**
 * DBC 应用配置类
 * 全局配置对象，包含所有应用配置
 */
export class DbcConfiguration {
    @ValidateNested()
    @Type(() => ServerConfig)
    server: ServerConfig;

    @ValidateNested()
    @Type(() => LoggerConfig)
    logger: LoggerConfig;
}

/**
 * 配置加载函数
 * 自动按优先级加载配置：环境变量 > 环境特定配置文件 > default.yaml
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
        const errorMessages = errors
            .map((error) => Object.values(error.constraints || {}).join(', '))
            .join('; ');
        throw new Error(`配置验证失败: ${errorMessages}`);
    }

    // 4. 返回验证通过的配置实例
    return configInstance;
};
