# Pino Logger 文档

## 📋 概述

项目集成了 Pino 高性能日志系统，提供：

- 自动 HTTP 请求日志记录
- 结构化 JSON 日志输出（生产环境）
- 美化彩色输出（开发环境）
- 三种使用方式满足不同场景

**技术特性：**

- ✅ 高性能（比 Winston 快 5-10 倍）
- ✅ 异步日志写入，对应用性能影响极小
- ✅ 自动记录所有 HTTP 请求
- ✅ 全局模块，所有类都可直接使用

---

## 🚀 快速开始

### 基本使用（推荐）

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    createUser() {
        this.logger.log('创建用户');
        this.logger.debug('调试信息');
        this.logger.warn('警告');
        this.logger.error('错误', error.stack);
    }
}
```

### 启动应用

```bash
# 开发环境（美化输出）
pnpm run start:dev:console
pnpm run start:dev:miniapp

# 生产环境（JSON输出）
NODE_ENV=production pnpm run start:prod:console
```

---

## 📊 使用方式对比

| 特性             | NestJS Logger<br/>（推荐）                   | PinoLogger<br/>（高级）                      |
| ---------------- | -------------------------------------------- | -------------------------------------------- |
| **导入方式**     | `import { Logger } from '@nestjs/common'`    | `import { PinoLogger } from 'nestjs-pino'`   |
| **使用方式**     | `private readonly logger = new Logger(Name)` | `constructor(private logger: PinoLogger) {}` |
| **需要构造函数** | ❌ 不需要                                    | ✅ 需要                                      |
| **设置上下文**   | 自动（构造参数）                             | 手动 `setContext()`                          |
| **结构化数据**   | ❌ 不支持                                    | ✅ 支持对象                                  |
| **参数顺序**     | `log(msg)`                                   | `info(obj?, msg?)` 对象在前                  |
| **学习成本**     | 零（原生API）                                | 低                                           |
| **适用场景**     | 日常开发（90%）                              | 需要结构化数据（10%）                        |

---

## 💻 详细用法

> ⚠️ **重要提示：PinoLogger 的参数顺序**
>
> 使用 PinoLogger 时，参数顺序是：**对象在前，消息在后**
>
> - ✅ 正确：`logger.info({ userId, ip }, '用户登录');`
> - ❌ 错误：`logger.info('用户登录', { userId, ip });`
>
> 而 NestJS Logger 只接受字符串消息，不支持结构化数据对象。

### 方式1: NestJS Logger（日常使用）

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    async createUser(userId: number) {
        this.logger.log('创建用户');
        this.logger.debug('调试信息');
        this.logger.warn('警告信息');
        this.logger.error('错误信息', errorStack);
    }
}
```

**特点：**

- 直接实例化，无需构造函数注入
- NestJS 原生 API，零学习成本
- 底层使用 Pino，高性能

**API 方法：**

- `logger.log(msg)` - 普通日志
- `logger.debug(msg)` - 调试日志
- `logger.warn(msg)` - 警告日志
- `logger.error(msg, stack)` - 错误日志
- `logger.verbose(msg)` - 详细日志

---

### 方式2: PinoLogger（结构化数据）

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class UserService {
    constructor(private readonly logger: PinoLogger) {
        this.logger.setContext(UserService.name);
    }

    async createUser(userId: number) {
        // 支持结构化数据
        this.logger.info({
            userId,
            timestamp: Date.now(),
            metadata: { ... }
        }, '创建用户');
    }
}
```

**特点：**

- 支持复杂结构化数据
- 便于日志分析工具处理
- 需要构造函数注入

**API 方法：**

- `logger.trace(obj?, msg?)` - 追踪日志
- `logger.debug(obj?, msg?)` - 调试日志
- `logger.info(obj?, msg?)` - 信息日志
- `logger.warn(obj?, msg?)` - 警告日志
- `logger.error(obj?, msg?)` - 错误日志
- `logger.fatal(obj?, msg?)` - 致命错误

**参数说明：**
- `obj` - 结构化数据对象（在前）
- `msg` - 日志消息字符串（在后）
- 两个参数都是可选的，但推荐提供至少一个

---

## 🌐 HTTP 请求日志

自动记录所有 HTTP 请求，无需任何代码。

### 开发环境输出

```
[2024-01-15 10:30:15] INFO (HTTP): GET /api/users 200 - 45ms
[2024-01-15 10:30:16] INFO (UserService): 查询用户列表
[2024-01-15 10:30:17] WARN (HTTP): POST /api/users 404 - 12ms
```

### 生产环境输出

```json
{
    "level": 30,
    "time": 1705296615123,
    "context": "HTTP",
    "req": {
        "id": "req-uuid-123",
        "method": "GET",
        "url": "/api/users"
    },
    "res": {
        "statusCode": 200
    },
    "responseTime": 45
}
```

**自动功能：**

- 记录请求 ID、方法、路径
- 记录响应状态码、耗时
- 根据状态码调整日志级别：
    - 2xx → info
    - 4xx → warn
    - 5xx → error

---

## ⚙️ 配置

### 日志级别

配置文件位于 `config/` 目录：

| 环境     | 配置文件           | level   | prettyPrint |
| -------- | ------------------ | ------- | ----------- |
| 默认     | `default.yaml`     | `info`  | `false`     |
| 开发环境 | `development.yaml` | `debug` | `true`      |
| 生产环境 | `production.yaml`  | `warn`  | `false`     |

### 可用级别

按严重程度从低到高：

- `trace` - 最详细的调试信息
- `debug` - 调试信息
- `info` - 一般信息（默认）
- `warn` - 警告信息
- `error` - 错误信息
- `fatal` - 致命错误

**配置验证：**

- ✅ 基于 Pino 的 `Level` 类型定义
- ✅ 应用启动时自动验证
- ✅ 无效值会抛出错误并拒绝启动

### 环境变量

```bash
# 设置日志级别
export LOGGER__LEVEL=debug

# 开启美化输出
export LOGGER__PRETTYPRINT=true
```

---

## 📝 最佳实践

### 1. 合理使用日志级别

```typescript
// debug: 开发调试，生产环境不记录
this.logger.debug('用户数据验证通过');

// info: 重要的业务操作
this.logger.log('用户登录成功');

// warn: 异常但可恢复的情况
this.logger.warn('缓存未命中，使用数据库查询');

// error: 需要关注的错误
this.logger.error('支付失败', error.stack);
```

### 2. 使用结构化数据（PinoLogger）

```typescript
// ✅ 推荐 - 便于日志分析（对象在前，消息在后）
this.logger.info({ userId, ip, timestamp }, '用户登录');

// ❌ 不推荐 - 难以解析
this.logger.info(`用户 ${userId} 从 ${ip} 登录于 ${timestamp}`);
```

### 3. 避免记录敏感信息

```typescript
// ❌ 不要记录密码、token等
this.logger.info({ password: userData.password }, '用户登录');

// ✅ 只记录必要的、非敏感信息
this.logger.info({
    userId: userData.id,
    username: userData.username,
}, '用户登录');
```

### 4. 为异步操作添加日志

```typescript
async processOrder(orderId: string) {
    // 对于 NestJS Logger（方式1），不支持结构化数据
    this.logger.log(`开始处理订单: ${orderId}`);

    try {
        const result = await this.orderService.process(orderId);
        this.logger.log(`订单处理完成: ${orderId}`);
        return result;
    } catch (error) {
        this.logger.error('订单处理失败', error.stack);
        throw error;
    }
}

// 如果使用 PinoLogger（方式2），可以使用结构化数据
async processOrderWithPino(orderId: string) {
    this.pinoLogger.info({ orderId }, '开始处理订单');

    try {
        const result = await this.orderService.process(orderId);
        this.pinoLogger.info({ orderId }, '订单处理完成');
        return result;
    } catch (error) {
        this.pinoLogger.error({ error: error.message, stack: error.stack }, '订单处理失败');
        throw error;
    }
}
```

---

## 🏗️ 架构说明

### 文件结构

```
libs/core/src/logger/
├── logger.module.ts       # Logger 模块定义
└── pino-http.config.ts    # Pino HTTP 配置

config/
├── default.yaml          # 默认配置
├── development.yaml      # 开发环境配置
└── production.yaml       # 生产环境配置
```

### 全局模块

LoggerModule 使用 `@Global()` 装饰器，使其在所有模块中可用：

```typescript
@Global()
@Module({
    imports: [PinoLoggerModule.forRootAsync({...})],
    exports: [PinoLoggerModule],
})
export class LoggerModule {}
```

**效果：**

- 只需在应用模块导入一次
- 所有其他模块都可以直接使用 Logger 和 PinoLogger
- 与 ConfigModule 保持一致的全局性

### 日志替换机制

在 `main.ts` 中替换默认 Logger：

```typescript
const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
});
app.useLogger(app.get(Logger));
```

所有 `new Logger()` 的调用都会通过 Pino 处理。

---

## 🔧 生产环境

### 日志收集

生产环境输出 JSON 格式，可使用日志收集工具：

- ELK (Elasticsearch, Logstash, Kibana)
- Loki (Grafana)
- 云平台日志服务

### 性能优势

- Pino 采用异步日志写入
- JSON 序列化由 Pino 优化
- 对应用性能影响极小

### 临时查看

使用 pino-pretty 美化查看：

```bash
node dist/apps/console/main.js | pnpm exec pino-pretty
```

---

## 🐛 故障排查

### 日志未显示

1. 检查日志级别配置
2. 确认环境变量 `NODE_ENV`
3. 验证 LoggerModule 已导入

### 日志格式不正确

1. 检查 `logger.prettyPrint` 配置
2. 确认已安装 `pino-pretty`
3. 验证配置文件路径

---

## 📚 相关文档

- **配置验证**: `docs/CONFIG.md` - 配置规则和验证
- [Pino 官方文档](https://getpino.io/)
- [nestjs-pino GitHub](https://github.com/iamolegga/nestjs-pino)
