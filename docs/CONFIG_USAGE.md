# DBC 配置系统使用说明

## 概述

本项目使用 `config` 包实现配置管理，支持多环境配置和环境变量覆盖。

## 配置文件结构

```
config/
├── default.yaml                        # 默认配置（所有环境共享）
├── development.yaml                    # 开发环境配置
├── production.yaml                     # 生产环境配置
└── custom-environment-variables.yaml   # 环境变量映射
```

## 配置加载优先级

1. **环境变量** (最高优先级)
2. **环境特定配置文件** (如 `production.yaml`)
3. **默认配置文件** (`default.yaml`)

## 环境变量覆盖

通过 `custom-environment-variables.yaml` 定义环境变量到配置路径的映射：

```yaml
server:
    miniapp:
        port: SERVER_MINIAPP_PORT
    console:
        port: SERVER_CONSOLE_PORT
```

### 使用示例

```bash
# 通过环境变量覆盖端口
SERVER_CONSOLE_PORT=8080 pnpm start:console

# 指定环境
NODE_ENV=production pnpm start:console

# 组合使用
NODE_ENV=production SERVER_CONSOLE_PORT=9999 pnpm start:console
```

## 配置验证

所有配置在应用启动时会自动验证：

- **类型检查**: 自动转换和验证数据类型
- **范围检查**: 端口号必须在 1024-49151 之间
- **必填检查**: 所有必需的配置项必须存在

如果配置无效，应用会在启动时抛出详细的错误信息。

## 在代码中使用配置

### 方式一：注入 ConfigService

```typescript
import { ConfigService } from '@nestjs/config';

export class YourService {
    constructor(private configService: ConfigService) {}

    someMethod() {
        // 获取具体的值
        const port = this.configService.get<number>('server.console.port');

        // 获取带默认值
        const port = this.configService.get<number>(
            'server.console.port',
            4000,
        );

        // 获取整个配置对象
        const serverConfig = this.configService.get('server');
    }
}
```

### 方式二：使用类型安全的配置类

```typescript
import { ConfigService } from '@nestjs/config';
import { DbcConfiguration } from '@dbc/core';

export class YourService {
    constructor(private configService: ConfigService) {}

    someMethod() {
        const dbcConfig = this.configService.get<DbcConfiguration>('server');
        // TypeScript 会提供完整的类型提示
        const port = dbcConfig.console.port;
    }
}
```

## 添加新的配置项

### 1. 更新 YAML 文件

在 `config/default.yaml` 中添加：

```yaml
database:
    host: localhost
    port: 5432
```

### 2. 更新配置类

在 `libs/core/src/config/configuration.ts` 中：

```typescript
export class DatabaseConfig {
    @IsString()
    host: string;

    @IsNumber()
    @Min(1024)
    @Max(65535)
    port: number;
}

export class DbcConfiguration {
    @ValidateNested()
    @Type(() => ServerConfig)
    server: ServerConfig;

    @ValidateNested()
    @Type(() => DatabaseConfig)
    database: DatabaseConfig;
}
```

### 3. 添加环境变量映射（可选）

在 `config/custom-environment-variables.yaml` 中：

```yaml
database:
    host: DATABASE_HOST
    port: DATABASE_PORT
```

## 常见问题

### Q: 如何查看当前加载的配置？

A: 在应用启动后，可以通过 ConfigService 打印：

```typescript
console.log(this.configService.get());
```

### Q: 环境变量为什么没有生效？

A: 检查：

1. `custom-environment-variables.yaml` 中是否定义了映射
2. 环境变量名是否正确（大小写敏感）
3. 环境变量是否在应用启动前设置

### Q: 如何添加敏感配置（如密钥）？

A:

1. 在 `custom-environment-variables.yaml` 中添加映射
2. 通过环境变量传入（不要写在 YAML 文件中）
3. 或使用 `.env` 文件（开发环境）

```yaml
# custom-environment-variables.yaml
api:
    secretKey: API_SECRET_KEY
```

```bash
# 启动时传入
API_SECRET_KEY=your-secret-key pnpm start:console
```

## 最佳实践

1. **默认配置** 放在 `default.yaml`，适用于所有环境
2. **环境差异** 放在对应的环境配置文件中
3. **敏感信息** 通过环境变量传入，不要提交到代码库
4. **类型验证** 使用 class-validator 装饰器确保配置正确
5. **文档更新** 添加新配置时同步更新本文档
