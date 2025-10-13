# 数据库迁移指南

本项目使用 TypeORM Migration 管理数据库 schema 变更。

## 目录

- [核心概念](#核心概念)
- [快速开始](#快速开始)
- [常用命令](#常用命令)
- [工作流程](#工作流程)
- [最佳实践](#最佳实践)
- [技术细节](#技术细节)
- [故障排查](#故障排查)

---

## 核心概念

### 什么是 Migration？

Migration（迁移）是数据库 schema 的版本控制，每个 migration 文件包含：

- **up()** - 应用变更（如创建表、添加字段）
- **down()** - 回滚变更（如删除表、移除字段）

### 为什么使用 Migration？

- ✅ **版本控制** - 数据库结构变更可追溯
- ✅ **团队协作** - 统一数据库结构
- ✅ **环境一致性** - 开发/测试/生产环境保持同步
- ✅ **安全回滚** - 出问题可以快速回滚

---

## 快速开始

### 1. 启动数据库

```bash
# 启动本地 PostgreSQL（使用 Docker）
docker compose up -d
```

### 2. 定义 Entity

在 `libs/*/src/entities/` 目录创建实体类：

```typescript
// libs/auth/src/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserStatus } from '@dbc/auth/enums'; // 支持路径别名

@Entity({ name: 'user' })
export class User {
    @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_id' })
    userId: string;

    @Column({
        type: 'varchar',
        length: 32,
        unique: true,
        comment: '手机号，唯一且不能为空',
    })
    phone: string;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
        comment: '状态: active-正常, frozen-冻结, deactivated-注销',
    })
    status: UserStatus;
}
```

### 3. 生成 Migration

```bash
# 自动生成 migration（对比 entity 和数据库差异）
pnpm migration generate InitDatabase

# 或手动创建空 migration
pnpm migration create AddCustomIndex
```

### 4. 查看状态

```bash
pnpm migration show
```

输出示例：

```
[ ] InitDatabase1760364549299          # 未执行
[X] AddUserProfile1760365000000        # 已执行
```

### 5. 运行 Migration

```bash
# 运行所有待执行的 migrations
pnpm migration run
```

### 6. 回滚（如需要）

```bash
# 回滚最后一次 migration
pnpm migration revert
```

---

## 常用命令

| 命令                             | 说明                           | 示例                                   |
| -------------------------------- | ------------------------------ | -------------------------------------- |
| `pnpm migration generate <名称>` | 自动生成 migration（对比差异） | `pnpm migration generate AddUserTable` |
| `pnpm migration create <名称>`   | 手动创建空 migration           | `pnpm migration create CustomIndex`    |
| `pnpm migration run`             | 运行所有待执行的 migrations    | `pnpm migration run`                   |
| `pnpm migration revert`          | 回滚最后一次 migration         | `pnpm migration revert`                |
| `pnpm migration show`            | 查看 migration 状态            | `pnpm migration show`                  |

### 生产环境命令

```bash
# 使用生产环境配置
pnpm migration generate AddFeature --prod
pnpm migration run --prod
```

---

## 工作流程

### 典型开发流程

#### 1. **开发新功能时**

```bash
# Step 1: 修改或创建 Entity
vim libs/auth/src/entities/user.entity.ts

# Step 2: 生成 migration
pnpm migration generate AddEmailField

# Step 3: 检查生成的 migration 文件
cat database/migrations/*-AddEmailField.ts

# Step 4: 运行 migration
pnpm migration run

# Step 5: 测试功能
pnpm test

# Step 6: 提交代码（包含 entity 和 migration 文件）
git add libs/auth/src/entities/user.entity.ts
git add database/migrations/*-AddEmailField.ts
git commit -m "feat: add email field to user"
```

#### 2. **团队成员同步数据库**

```bash
# Step 1: 拉取最新代码
git pull

# Step 2: 查看待执行的 migrations
pnpm migration show

# Step 3: 运行 migrations
pnpm migration run
```

#### 3. **修改 Migration（运行前）**

```bash
# 删除错误的 migration 文件
rm database/migrations/*-WrongMigration.ts

# 重新生成
pnpm migration generate CorrectMigration
```

#### 4. **回滚 Migration（运行后）**

```bash
# 回滚最后一次 migration
pnpm migration revert

# 修改 entity
vim libs/auth/src/entities/user.entity.ts

# 重新生成 migration
pnpm migration generate FixedMigration

# 运行新的 migration
pnpm migration run
```

---

## 最佳实践

### 1. Migration 命名规范

✅ **推荐**（按业务意图命名）：

```bash
pnpm migration generate InitDatabase           # 初始化数据库
pnpm migration generate AddUserModule          # 添加用户模块
pnpm migration generate UpdateOrderWorkflow    # 更新订单流程
pnpm migration generate OptimizeUserIndexes    # 优化用户索引
```

❌ **不推荐**（过于具体或无意义）：

```bash
pnpm migration generate CreateUserTable        # 太具体（一次可能创建多个表）
pnpm migration generate Migration1             # 无意义
pnpm migration generate Test                   # 太模糊
```

### 2. Entity 设计原则

```typescript
// ✅ 好的实践
@Entity({ name: 'user' }) // 显式指定表名, 表名使用单数小写, 关系表也一样单数, 比如user_role
export class User {
    @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_id' }) // 表字段使用小写加下划线
    userId: string; // TypeScript 驼峰，数据库蛇形

    @Column({
        type: 'varchar',
        length: 32,
        unique: true,
        nullable: false, // 显式指定是否可空
        comment: '手机号，唯一且不能为空', // 添加注释
    })
    phone: string;

    @CreateDateColumn({
        type: 'timestamptz', // 使用带时区的时间戳
        name: 'created_at',
        comment: '创建时间',
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamptz',
        name: 'updated_at',
        comment: '更新时间',
    })
    updatedAt: Date;
}
```

### 3. 一次 Generate = 所有变更

TypeORM 会自动检测**所有 entity** 的变更，并生成一个 migration 文件：

```typescript
// 假设你同时修改了多个 entity
// libs/auth/src/entities/user.entity.ts - 添加字段
// libs/product/src/entities/product.entity.ts - 新建表
// libs/order/src/entities/order.entity.ts - 添加关系

// 运行一次 generate
pnpm migration generate AddProductAndUpdateUser

// 生成的 migration 包含所有变更
export class AddProductAndUpdateUser1760364549299 {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 创建 product 表
        await queryRunner.query(`CREATE TABLE "product" (...)`);
        // 添加 user 字段
        await queryRunner.query(`ALTER TABLE "user" ADD "email" ...`);
        // 创建 order 关系
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT ...`);
    }
}
```

### 4. 生产环境注意事项

```bash
# ⚠️ 生产环境运行前务必：
# 1. 在开发/测试环境验证 migration
# 2. 备份数据库
# 3. 在低峰期执行
# 4. 准备回滚方案

# 查看将要执行的 migrations
pnpm migration show --prod

# 运行 migrations
pnpm migration run --prod
```

### 5. 路径别名使用

项目支持 TypeScript 路径别名，可以在 entity 中直接使用：

```typescript
// ✅ 使用别名（推荐 - 保持项目一致性）
import { UserStatus } from '@dbc/auth/enums';

// ✅ 使用相对路径（也可以）
import { UserStatus } from '../enums';
```

---

## 技术细节

### 配置文件

#### 1. `database/data-source.ts`

Migration 的核心配置文件：

```typescript
export const AppDataSource = new DataSource({
    type: 'postgres',
    // ... 数据库连接配置

    // 实体文件路径（扫描所有 entity）
    entities: [
        path.join(__dirname, '../libs/**/entities/*.entity{.ts,.js}'),
        path.join(__dirname, '../apps/**/entities/*.entity{.ts,.js}'),
    ],

    // Migration 文件路径
    migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],

    // Migration 记录表名
    migrationsTableName: 'typeorm_migrations',

    // 不自动运行 migration（手动执行）
    migrationsRun: false,

    // 不自动同步（使用 migration 管理）
    synchronize: false,
});
```

#### 2. `database/tsconfig.json`

Migration 脚本的 TypeScript 配置：

```json
{
    "extends": "../tsconfig.json",
    "compilerOptions": {
        "module": "commonjs", // 使用 CommonJS（更稳定）
        "moduleResolution": "node"
    },
    "ts-node": {
        "require": ["tsconfig-paths/register"], // 支持路径别名
        "transpileOnly": true
    }
}
```

#### 3. 环境配置

Migration 使用独立的数据库配置：

```yaml
# database/config/development.yaml
migration:
    host: localhost
    port: 5433
    database: dbc_local
    schema: dbc
    username: dbc_migrator
    password: dbc.local.migrator.1234
```

#### 4. Migration Helper 脚本

`database/scripts/migration-helper.js` 封装了 TypeORM CLI：

```javascript
// 使用 pnpm exec 运行 typeorm-ts-node-commonjs
spawnSync(pnpmCmd, ['exec', 'typeorm-ts-node-commonjs', ...allArgs], {
    env: {
        NODE_ENV,
        NODE_CONFIG_DIR,
        TS_NODE_PROJECT: path.resolve(__dirname, '../tsconfig.json'),
    },
});
```

### 为什么使用 CommonJS？

虽然项目使用 ES Module (`module: "nodenext"`)，但 migration 脚本使用 CommonJS：

**原因**：

- ✅ `tsconfig-paths/register` 对 CommonJS 支持更成熟
- ✅ TypeORM CLI + 路径别名在 CommonJS 下更稳定
- ✅ 不影响应用代码（应用仍使用 ES Module）

**分离关注点**：

- 应用运行时：ES Module（更现代）
- 构建工具/脚本：CommonJS（更稳定）

### 执行流程

```
pnpm migration generate CreateUserTable
  ↓
migration-helper.js
  ↓
pnpm exec typeorm-ts-node-commonjs
  ↓
加载 database/data-source.ts（使用 database/tsconfig.json）
  ↓
扫描 entities 目录
  ↓
对比数据库 schema
  ↓
生成 migration 文件到 database/migrations/
```

---

## 故障排查

### 问题 1: `__dirname is not defined`

**错误信息**:

```
Error: __dirname is not defined in ES module scope
```

**原因**: ES Module 环境下没有 `__dirname`

**解决**: 已通过 `database/tsconfig.json` 配置为 CommonJS 解决

---

### 问题 2: 路径别名无法解析

**错误信息**:

```
Error: Cannot find module '@dbc/auth/enums'
```

**解决**:

1. 确保 `database/tsconfig.json` 中配置了 `tsconfig-paths/register`
2. 确保 `TS_NODE_PROJECT` 环境变量指向正确的 tsconfig
3. 检查主 `tsconfig.json` 中的 `paths` 配置

---

### 问题 3: Migration 没有检测到变更

**输出**:

```
No changes in database schema were found
```

**可能原因**:

1. Entity 没有变化
2. Entity 路径配置错误（检查 `data-source.ts` 中的 `entities` 配置）
3. 数据库已经是最新状态

**排查**:

```bash
# 检查 entity 是否被扫描到
grep -r "@Entity" libs/ apps/

# 检查数据库连接
pnpm migration show

# 查看 data-source 配置
cat database/data-source.ts
```

---

### 问题 4: 连接数据库失败

**错误信息**:

```
Error: connect ECONNREFUSED 127.0.0.1:5433
```

**排查步骤**:

```bash
# 1. 检查数据库是否运行
docker compose ps

# 2. 启动数据库
docker compose up -d

# 3. 检查配置文件
cat database/config/development.yaml

# 4. 测试连接
psql -h localhost -p 5433 -U dbc_migrator -d dbc_local

# 5. 查看数据库日志
docker compose logs postgres
```

---

### 问题 5: Migration 执行失败

**排查步骤**:

```bash
# 1. 查看详细错误
pnpm migration run

# 2. 检查 migration 表
psql -h localhost -p 5433 -U dbc_migrator -d dbc_local \
  -c "SELECT * FROM dbc.typeorm_migrations ORDER BY timestamp DESC;"

# 3. 如果需要回滚
pnpm migration revert

# 4. 检查 schema
psql -h localhost -p 5433 -U dbc_migrator -d dbc_local \
  -c "\dt dbc.*"
```

---

### 问题 6: 状态显示 `[ ]` 未执行

**说明**: 这是正常的，表示 migration 已生成但未运行

**解决**:

```bash
# 运行 migration
pnpm migration run

# 再次查看状态
pnpm migration show
# 输出应该显示 [X] 已执行
```

---

## 相关文档

- [TypeORM Migration 官方文档](https://typeorm.io/migrations)
- [CONFIG.md](CONFIG.md) - 配置管理指南
- [README.md](../README.md) - 项目总览

---

## 总结

Migration 是数据库版本控制的核心工具，遵循以下原则：

1. ✅ **每次数据库变更都生成 migration**
2. ✅ **先在开发环境验证，再部署生产**
3. ✅ **Migration 文件和 Entity 一起提交**
4. ✅ **团队成员及时同步和运行 migrations**
5. ✅ **生产环境谨慎操作，准备回滚方案**
6. ✅ **使用有意义的命名描述业务意图**

遵循这些原则，可以确保数据库结构的一致性和可追溯性。
