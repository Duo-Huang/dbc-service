# 配置管理文档

## 📋 概述

项目使用 `config` 包和 `class-validator` 进行配置管理和验证，确保配置的正确性和类型安全。

**特性：**

- ✅ 多环境配置支持（default、development、production）
- ✅ 环境变量覆盖
- ✅ 类型安全的配置验证
- ✅ 全局配置模块

---

## 📁 文件结构

```
config/
├── default.yaml                       # 基础配置
├── development.yaml                   # 开发环境配置
├── production.yaml                    # 生产环境配置
└── custom-environment-variables.yaml  # 环境变量映射

libs/core/src/config/
├── dbc-config.module.ts              # 配置模块
└── dbc-configuration.ts              # 配置类和验证
```

---

## ⚙️ 配置结构

### 服务器配置

```yaml
server:
    miniapp:
        port: 3000
    console:
        port: 4000
```

**验证规则：**

- 端口号必须是数字
- 范围：1024 - 49151（避免系统保留端口）

### 日志配置

```yaml
logger:
    level: info # trace|debug|info|warn|error|fatal
    prettyPrint: false # true|false
```

**验证规则：**

- `level` 必须是 Pino 定义的有效级别之一
- `prettyPrint` 必须是布尔值
- 基于 Pino 的 `Level` 类型定义，非硬编码

---

## 🔧 配置优先级

按优先级从高到低：

1. **环境变量**（最高）
2. **环境特定配置文件**（`${NODE_ENV}.yaml`）
3. **默认配置文件**（`default.yaml`）

### 示例

假设有以下配置：

**default.yaml:**

```yaml
logger:
    level: info
    prettyPrint: false
```

**development.yaml:**

```yaml
logger:
    level: debug
    prettyPrint: true
```

**环境变量:**

```bash
export LOGGER__LEVEL=trace
```

**最终结果（开发环境）:**

```yaml
logger:
    level: trace # 来自环境变量
    prettyPrint: true # 来自 development.yaml
```

---

## 🌍 环境变量

### 设置方式

```bash
# 日志级别
export LOGGER__LEVEL=debug

# 日志美化输出
export LOGGER__PRETTYPRINT=true

# Miniapp 端口
export SERVER__MINIAPP__PORT=8080

# Console 端口
export SERVER__CONSOLE__PORT=9000
```

**规则：**

- 使用双下划线 `__` 分隔层级
- 变量名全大写
- 需要在 `custom-environment-variables.yaml` 中映射

---

## ✅ 配置验证

### 验证时机

配置验证在应用启动时自动执行：

```typescript
export default () => {
    const rawConfig = config.util.toObject();
    const configInstance = plainToClass(DbcConfiguration, rawConfig);

    // 验证配置
    const errors = validateSync(configInstance, {
        skipMissingProperties: false,
        whitelist: true,
        forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
        throw new Error(`配置验证失败: ${errorMessages}`);
    }

    return configInstance;
};
```

### 验证选项

- `skipMissingProperties: false` - 不允许缺少必需属性
- `whitelist: true` - 只允许类中定义的属性
- `forbidNonWhitelisted: true` - 拒绝未定义的额外属性

---

## 📝 配置示例

### ✅ 有效配置

**default.yaml:**

```yaml
server:
    miniapp:
        port: 3000
    console:
        port: 4000

logger:
    level: info
    prettyPrint: false
```

**development.yaml:**

```yaml
logger:
    level: debug
    prettyPrint: true
```

**production.yaml:**

```yaml
server:
    miniapp:
        port: 9000
    console:
        port: 9000

logger:
    level: warn
    prettyPrint: false
```

---

### ❌ 无效配置

#### 无效的日志级别

```yaml
logger:
    level: verbose # ❌ verbose 不是有效的 Pino level
```

**错误：**

```
Error: 配置验证失败: level 必须是以下值之一: trace, debug, info, warn, error, fatal
```

#### 无效的端口号

```yaml
server:
    miniapp:
        port: 80 # ❌ 小于 1024
```

**错误：**

```
Error: 配置验证失败: 端口号必须大于等于 1024
```

#### 类型错误

```yaml
logger:
    prettyPrint: 'yes' # ❌ 必须是布尔值
```

**错误：**

```
Error: 配置验证失败: prettyPrint must be a boolean value
```

#### 未定义的属性

```yaml
logger:
    unknownOption: value # ❌ 未定义的属性
```

**错误：**

```
Error: 配置验证失败: property unknownOption should not exist
```

---

## 💻 在代码中使用

### 注入 ConfigService

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
    constructor(private configService: ConfigService) {}

    getPort() {
        // 获取配置值
        const port = this.configService.get<number>('server.miniapp.port');
        return port;
    }

    getLogLevel() {
        // 获取配置值，带默认值
        const level = this.configService.get<string>('logger.level', 'info');
        return level;
    }
}
```

### 全局配置模块

ConfigModule 使用 `isGlobal: true`，所有模块都可以直接注入：

```typescript
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // 全局模块
            cache: true,
            load: [configuration],
        }),
    ],
})
export class DbcConfigModule {}
```

---

## 🔧 扩展配置

### 添加新的配置项

1. **定义配置类**

```typescript
// libs/core/src/config/dbc-configuration.ts

export class DatabaseConfig {
    @IsString()
    host: string;

    @IsNumber()
    @Min(1)
    @Max(65535)
    port: number;

    @IsString()
    database: string;
}

export class DbcConfiguration {
    @ValidateNested()
    @Type(() => ServerConfig)
    server: ServerConfig;

    @ValidateNested()
    @Type(() => LoggerConfig)
    logger: LoggerConfig;

    @ValidateNested()
    @Type(() => DatabaseConfig)
    database: DatabaseConfig; // 新增
}
```

2. **添加配置文件**

```yaml
# config/default.yaml
database:
    host: localhost
    port: 5432
    database: myapp
```

---

## 🎯 设计原则

### 1. 使用类型定义而非硬编码

```typescript
// ✅ 好 - 基于 Pino 的 Level 类型
const PINO_LOG_LEVELS: readonly Level[] = [
    'trace', 'debug', 'info', 'warn', 'error', 'fatal'
] as const;

@IsIn(PINO_LOG_LEVELS)
level: Level;

// ❌ 差 - 硬编码字符串数组
@IsIn(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
level: string;
```

### 2. 提供清晰的错误消息

```typescript
@IsIn(PINO_LOG_LEVELS, {
    message: `level 必须是以下值之一: ${PINO_LOG_LEVELS.join(', ')}`,
})
level: Level;
```

### 3. 合理的默认值

在 `default.yaml` 中提供合理的默认值，确保能通过验证。

---

## 🐛 故障排查

### 应用无法启动

1. 查看错误消息，定位具体配置项
2. 检查配置文件合并结果：
    ```bash
    NODE_ENV=development node -e "console.log(require('config').util.toObject())"
    ```
3. 确认配置值的类型和范围

### 环境变量未生效

1. 检查 `custom-environment-variables.yaml` 中的映射
2. 确认环境变量名称正确（使用双下划线 `__`）
3. 验证环境变量的值符合验证规则

---

## 📚 相关文档

- **日志配置**: `docs/LOGGER.md` - 日志系统配置和使用
- [config 包文档](https://github.com/node-config/node-config)
- [class-validator 文档](https://github.com/typestack/class-validator)
- [class-transformer 文档](https://github.com/typestack/class-transformer)
