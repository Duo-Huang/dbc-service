# 配置管理文档

## 📋 概述

项目使用 `config` 包和 `class-validator` 进行配置管理和验证，确保配置的正确性和类型安全。

**特性：**

- ✅ 多环境配置支持（default、development、production）
- ✅ 环境变量覆盖
- ✅ 类型安全的配置验证
- ✅ 全局配置模块
- ✅ 应用独立配置，互不污染

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

libs/core/src/constants/
└── app-names.ts                      # 应用名称常量
```

---

## ⚙️ 配置结构

每个应用有独立且完整的配置节点，包含 `server`、`datasource` 和 `logger` 配置：

```yaml
miniapp:
    server:
        port: 3000
    datasource:
        host: localhost
        port: 5433
        database: dbc_local
        username: dbc_miniapp_writer
        password: dbc.local.123
    logger:
        level: debug # trace|debug|info|warn|error|fatal
        prettyPrint: true # 开发环境美化输出

console:
    server:
        port: 4000
    datasource:
        host: localhost
        port: 5433
        database: dbc_local
        username: dbc_console_writer
        password: dbc.local.123
    logger:
        level: debug
        prettyPrint: true
```

### 配置类型解耦

**重要特性：**

- ✅ `miniapp` 使用 `MiniappConfig` 类，`console` 使用 `ConsoleConfig` 类
- ✅ 两个配置类完全独立，互不耦合
- ✅ 支持未来添加应用特有配置（如 `miniapp.wechat`、`console.session`）
- ✅ 配置加载函数直接返回完整的配置对象

**配置隔离机制：**

1. 启动时通过 `APP_NAME` 环境变量确定当前应用（在 `main.ts` 中设置）
2. 配置加载函数返回当前应用的完整配置对象
3. 访问不存在的配置字段返回 `undefined`（自然隔离）

**示例：**

```typescript
// miniapp 代码中
configService.get('server.port'); // ✅ 3000
configService.get('wechat.appId'); // 未来可添加

// console 代码中
configService.get('server.port'); // ✅ 4000
configService.get('wechat.appId'); // undefined（miniapp 特有配置）
```

---

## ✅ 配置验证规则

### 服务器配置（Server）

- `port`: 必须是数字，范围 3000 - 49151

### 数据源配置（Datasource）

- `host`: 必须是有效的 IP 地址或域名（支持 IPv4/IPv6/FQDN，包括 `localhost`）
- `port`: 必须是数字，范围 1 - 65535
- `database`: 字符串，非空
- `username`: 字符串，非空
- `password`: 字符串，允许为空

### 日志配置（Logger）

- `level`: 必须是 Pino 定义的有效级别之一（trace/debug/info/warn/error/fatal）
- `prettyPrint`: 必须是布尔值

---

## 🔧 配置优先级

配置按以下优先级从高到低合并：

1. **环境变量**（最高优先级）
2. **环境特定配置文件**（`development.yaml`、`production.yaml`）
3. **默认配置文件**（`default.yaml`）

**示例：**

```bash
# default.yaml 定义 miniapp.server.port = 3000
# production.yaml 覆盖为 9000
# 环境变量可进一步覆盖
export MINIAPP_SERVER_PORT=8080
```

---

## 🌍 环境变量

### 映射配置

在 `custom-environment-variables.yaml` 中定义映射：

```yaml
miniapp:
    server:
        port: MINIAPP_SERVER_PORT

console:
    server:
        port: CONSOLE_SERVER_PORT
```

### 使用方式

```bash
export MINIAPP_SERVER_PORT=8080
export CONSOLE_SERVER_PORT=9000
```

---

## 💻 在代码中使用

### 配置获取方式

配置已根据 `APP_NAME` 自动扁平化，直接访问顶层配置即可：

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SomeService {
    constructor(private configService: ConfigService) {}

    getConfig() {
        // 配置已扁平化，直接访问顶层
        const port = this.configService.get<number>('server.port');
        const host = this.configService.get<string>('datasource.host');
        const level = this.configService.get<string>('logger.level', 'info');

        return { port, host, level };
    }
}
```

**重要说明：**

- ✅ `main.ts` 中通过 `process.env.APP_NAME = APP_NAMES.MINIAPP` 设置应用名称
- ✅ 使用扁平化路径：`server.port` 而非 `miniapp.server.port`
- ✅ NestJS ConfigService 不支持直接获取整个配置对象，需分别获取各个配置项

### 应用入口设置

每个应用的 `main.ts` 必须在最开头设置 `APP_NAME`：

```typescript
// apps/miniapp/src/main.ts
import { APP_NAMES } from '@dbc/core';

process.env.APP_NAME = APP_NAMES.MINIAPP; // 必须在第一行

async function bootstrap() {
    // ...
    const port = configService.get<number>('server.port') || 9000;
    // ...
}
```

---

## 📝 配置示例

### 开发环境

**default.yaml:**

```yaml
miniapp:
    server:
        port: 3000
    datasource:
        host: localhost
        port: 5433
        database: dbc_local
        username: dbc_miniapp_writer
        password: dbc.local.123
    logger:
        level: debug
        prettyPrint: true
```

**development.yaml:**

```yaml
miniapp:
    logger:
        level: debug
        prettyPrint: true
```

### 生产环境

**production.yaml:**

```yaml
miniapp:
    server:
        port: 9000
    logger:
        level: warn
        prettyPrint: false
```

---

## ❌ 常见错误

### 1. 无效的日志级别

```yaml
miniapp:
    logger:
        level: verbose # ❌ 不是有效的 Pino level
```

**错误信息：**

```
Error: 配置验证失败: miniapp.logger.level: level 必须是以下值之一: trace, debug, info, warn, error, fatal
```

### 2. 无效的端口号

```yaml
miniapp:
    server:
        port: 80 # ❌ 小于 3000
```

**错误信息：**

```
Error: 配置验证失败: miniapp.server.port: 端口号必须大于等于 3000
```

### 3. 缺少必需字段

```yaml
miniapp:
    datasource:
        host: localhost
        port: 5433
        # ❌ 缺少 database 和 username
```

**错误信息：**

```
Error: 配置验证失败: miniapp.datasource.database: database不能为空; miniapp.datasource.username: username不能为空
```

---

## 🔧 扩展配置

### 添加公共配置（两个应用都需要）

如果要添加两个应用都需要的配置（如缓存配置）：

1. **定义配置类**

```typescript
// libs/core/src/config/dbc-configuration.ts

export class CacheConfig {
    @IsNumber()
    @Min(0)
    ttl: number;

    @IsBoolean()
    enabled: boolean;
}

// 在两个配置类中都添加
export class MiniappConfig {
    // ... 现有字段

    @ValidateNested()
    @Type(() => CacheConfig)
    cache: CacheConfig;
}

export class ConsoleConfig {
    // ... 现有字段

    @ValidateNested()
    @Type(() => CacheConfig)
    cache: CacheConfig;
}
```

2. **更新配置文件**

```yaml
miniapp:
    # ... 现有配置
    cache:
        ttl: 3600
        enabled: true

console:
    # ... 现有配置
    cache:
        ttl: 3600
        enabled: true
```

3. **在代码中使用**

```typescript
const cacheTtl = this.configService.get<number>('cache.ttl');
```

### 添加应用特有配置

**场景：只有 miniapp 需要微信配置**

1. **定义配置类（只在 MiniappConfig 中添加）**

```typescript
export class WechatConfig {
    @IsString()
    @IsNotEmpty()
    appId: string;

    @IsString()
    @IsNotEmpty()
    appSecret: string;
}

export class MiniappConfig {
    // ... 现有字段

    @ValidateNested()
    @Type(() => WechatConfig)
    wechat: WechatConfig; // miniapp 特有
}

// ConsoleConfig 不需要修改
```

2. **只在 miniapp 配置中添加**

```yaml
miniapp:
    # ... 现有配置
    wechat:
        appId: wx1234567890
        appSecret: secret123

console:
    # ... 现有配置（不需要 wechat）
```

3. **只在 miniapp 代码中使用**

```typescript
// miniapp 服务中
const appId = this.configService.get<string>('wechat.appId'); // ✅

// console 服务中访问返回 undefined（自然隔离）
const appId = this.configService.get<string>('wechat.appId'); // undefined
```

**优势：**

- ✅ 公共配置复用基础配置类
- ✅ 特有配置完全解耦
- ✅ 不需要修改配置加载函数
- ✅ 运行时自动隔离

---

## 🐛 故障排查

### 应用无法启动

1. 查看错误消息，定位具体配置项
2. 检查配置文件合并结果：
    ```bash
    NODE_ENV=development node -e "console.log(require('config').util.toObject())"
    ```
3. 确认所有必需字段已提供且符合验证规则

### 配置获取返回 undefined

1. 确认 `APP_NAME` 在 `main.ts` 开头正确设置
2. 使用扁平化路径：`server.port` 而非 `miniapp.server.port`
3. 检查配置文件中是否定义了该配置项

### 环境变量未生效

1. 检查 `custom-environment-variables.yaml` 映射是否正确
2. 确认环境变量名称大写且用下划线分隔
3. 验证环境变量值符合验证规则

---

## 🎯 设计原则

1. **基于类型定义而非硬编码**

    ```typescript
    // ✅ 好
    const PINO_LOG_LEVELS: readonly Level[] = ['trace', 'debug', ...] as const;

    // ❌ 差
    @IsIn(['trace', 'debug', ...])
    ```

2. **提供清晰的错误消息**

    ```typescript
    @IsNotEmpty({ message: 'database不能为空' })
    database: string;
    ```

3. **配置独立且完整**
    - 每个应用有独立完整的配置
    - 通过 `APP_NAME` 环境变量隔离
    - 配置扁平化，简化访问

---

## 📚 相关文档

- **日志配置**: `docs/LOGGER.md`
- [config 包文档](https://github.com/node-config/node-config)
- [class-validator 文档](https://github.com/typestack/class-validator)
