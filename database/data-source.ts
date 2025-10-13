import { DataSource } from 'typeorm';
import path from 'node:path';
import config from 'config';

// 在 CommonJS 模式下，__dirname 是可用的
// 在通过 ts-node 运行时，TypeScript 编译器会处理这个

interface MigrationConfig {
    migration: {
        host: string;
        port: number;
        database: string;
        schema: string;
        username: string;
        password: string;
    };
}

const migrationConfig = config.util.toObject() as MigrationConfig;
const { migration } = migrationConfig;

export const AppDataSource = new DataSource({
    // 数据库连接
    type: 'postgres',
    host: migration.host,
    port: migration.port,
    username: migration.username,
    password: migration.password,
    database: migration.database,
    schema: migration.schema,

    // 扫描整个项目的实体类
    entities: [
        // libs 目录下的所有实体
        path.join(__dirname, '../libs/**/entities/*.entity{.ts,.js}'),
        // apps 目录下的所有实体
        path.join(__dirname, '../apps/**/entities/*.entity{.ts,.js}'),
    ],
    migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],

    // Migration 配置
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false, // app启动时不自动运行 migration，需要手动执行
    synchronize: false, // 不自动同步(entity -> db)，使用 migration 管理

    // 日志
    logging: true,

    // PostgreSQL 连接池配置
    extra: {
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },
});
