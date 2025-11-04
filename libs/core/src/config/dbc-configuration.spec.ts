import { plainToClass } from 'class-transformer';
import { validate, validateSync } from 'class-validator';
import {
    DbcConfiguration,
    MiniprogramConfig,
    ConsoleConfig,
    CorsConfig,
    ServerPortConfig,
    DatasourceConfig,
    LoggerConfig,
} from './dbc-configuration';
import { APP_NAMES } from '../constants';

describe('Configuration Validators', () => {
    describe('IsHostname Validator', () => {
        describe('Valid hostnames', () => {
            it('should accept valid domain name', async () => {
                const config = plainToClass(DatasourceConfig, {
                    host: 'example.com',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });

            it('should accept subdomain', async () => {
                const config = plainToClass(DatasourceConfig, {
                    host: 'db.example.com',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });

            it('should accept localhost', async () => {
                const config = plainToClass(DatasourceConfig, {
                    host: 'localhost',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });

            it('should accept IPv4 address', async () => {
                const config = plainToClass(DatasourceConfig, {
                    host: '192.168.1.1',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });

            it('should accept IPv6 address', async () => {
                const config = plainToClass(DatasourceConfig, {
                    host: '::1',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });

            it('should accept full IPv6 address', async () => {
                const config = plainToClass(DatasourceConfig, {
                    host: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });
        });

        describe('Invalid hostnames', () => {
            it('should reject empty string', async () => {
                const config = plainToClass(DatasourceConfig, {
                    host: '',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors[0].property).toBe('host');
            });

            it('should reject invalid characters', async () => {
                const config = plainToClass(DatasourceConfig, {
                    host: 'invalid_host@name',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject spaces', async () => {
                const config = plainToClass(DatasourceConfig, {
                    host: 'host name',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject number type', async () => {
                const config = plainToClass(DatasourceConfig, {
                    host: 123 as any,
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject null', async () => {
                const config = plainToClass(DatasourceConfig, {
                    host: null as any,
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
            });
        });
    });

    describe('IsCorsOrigin Validator', () => {
        describe('Valid origins', () => {
            it('should accept wildcard "*"', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: '*',
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });

            it('should accept wildcard "*" in array', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: ['*'],
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });

            it('should accept valid HTTPS URL', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: 'https://example.com',
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });

            it('should accept valid HTTPS URL array', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: [
                        'https://example.com',
                        'https://www.example.com',
                        'http://localhost:3000',
                    ],
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });

            it('should accept URL with port', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: 'http://localhost:8080',
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });

            it('should accept IP address as domain', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: 'http://192.168.1.1:8080',
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBe(0);
            });
        });

        describe('Invalid origins', () => {
            it('should reject invalid URL', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: 'not-a-valid-url',
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors[0].property).toBe('origin');
            });

            it('should reject array containing invalid URL', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: ['https://example.com', 'invalid-url'],
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject empty array', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: [],
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject non-HTTP/HTTPS protocol', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: 'ftp://example.com',
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject array containing non-string elements', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: ['https://example.com', 123, null] as any,
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject number type', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: 123 as any,
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject null', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: null as any,
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
            });

            it('should reject empty string', async () => {
                const config = plainToClass(CorsConfig, {
                    origin: '',
                    credentials: true,
                });
                const errors = await validate(config);
                expect(errors.length).toBeGreaterThan(0);
            });
        });
    });
});

describe('Configuration Classes', () => {
    describe('MiniprogramConfig', () => {
        it('should validate a complete miniprogram configuration', () => {
            const rawConfig = {
                server: { port: 3000 },
                cors: { origin: '*', credentials: true },
                datasource: {
                    host: 'localhost',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                },
                logger: { level: 'info', prettyPrint: false },
            };

            const config = plainToClass(MiniprogramConfig, rawConfig, {
                enableImplicitConversion: true,
            });

            const errors = validateSync(config);
            expect(errors.length).toBe(0);
            expect(config.server).toBeInstanceOf(ServerPortConfig);
            expect(config.cors).toBeInstanceOf(CorsConfig);
            expect(config.datasource).toBeInstanceOf(DatasourceConfig);
            expect(config.logger).toBeInstanceOf(LoggerConfig);
        });

        it('should reject invalid miniprogram configuration', () => {
            const rawConfig = {
                server: { port: 100 }, // Invalid: port too small
                cors: { origin: '*', credentials: true },
                datasource: {
                    host: 'localhost',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                },
                logger: { level: 'info', prettyPrint: false },
            };

            const config = plainToClass(MiniprogramConfig, rawConfig, {
                enableImplicitConversion: true,
            });

            const errors = validateSync(config);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('ConsoleConfig', () => {
        it('should validate a complete console configuration', () => {
            const rawConfig = {
                server: { port: 4000 },
                cors: {
                    origin: ['https://example.com', 'https://www.example.com'],
                    credentials: true,
                },
                datasource: {
                    host: '192.168.1.1',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                },
                logger: { level: 'debug', prettyPrint: true },
            };

            const config = plainToClass(ConsoleConfig, rawConfig, {
                enableImplicitConversion: true,
            });

            const errors = validateSync(config);
            expect(errors.length).toBe(0);
            expect(config.server).toBeInstanceOf(ServerPortConfig);
            expect(config.cors).toBeInstanceOf(CorsConfig);
            expect(config.datasource).toBeInstanceOf(DatasourceConfig);
            expect(config.logger).toBeInstanceOf(LoggerConfig);
        });

        it('should reject invalid console configuration', () => {
            const rawConfig = {
                server: { port: 4000 },
                cors: { origin: 'invalid-url', credentials: true }, // Invalid URL
                datasource: {
                    host: 'localhost',
                    port: 5432,
                    database: 'testdb',
                    schema: 'public',
                    username: 'user',
                    password: 'pass',
                },
                logger: { level: 'info', prettyPrint: false },
            };

            const config = plainToClass(ConsoleConfig, rawConfig, {
                enableImplicitConversion: true,
            });

            const errors = validateSync(config);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('DbcConfiguration', () => {
        it('should validate complete DBC configuration', () => {
            const rawConfig = {
                [APP_NAMES.MINIPROGRAM]: {
                    server: { port: 3000 },
                    cors: { origin: '*', credentials: true },
                    datasource: {
                        host: 'localhost',
                        port: 5432,
                        database: 'testdb',
                        schema: 'public',
                        username: 'user',
                        password: 'pass',
                    },
                    logger: { level: 'info', prettyPrint: false },
                },
                [APP_NAMES.CONSOLE]: {
                    server: { port: 4000 },
                    cors: { origin: 'https://example.com', credentials: true },
                    datasource: {
                        host: 'localhost',
                        port: 5432,
                        database: 'testdb',
                        schema: 'public',
                        username: 'user',
                        password: 'pass',
                    },
                    logger: { level: 'debug', prettyPrint: true },
                },
            };

            const config = plainToClass(DbcConfiguration, rawConfig, {
                enableImplicitConversion: true,
            });

            const errors = validateSync(config);
            expect(errors.length).toBe(0);
            expect(config[APP_NAMES.MINIPROGRAM]).toBeInstanceOf(
                MiniprogramConfig,
            );
            expect(config[APP_NAMES.CONSOLE]).toBeInstanceOf(ConsoleConfig);
        });

        it('should reject invalid DBC configuration', () => {
            const rawConfig = {
                [APP_NAMES.MINIPROGRAM]: {
                    server: { port: 3000 },
                    cors: { origin: [], credentials: true }, // Invalid: empty array
                    datasource: {
                        host: 'localhost',
                        port: 5432,
                        database: 'testdb',
                        schema: 'public',
                        username: 'user',
                        password: 'pass',
                    },
                    logger: { level: 'info', prettyPrint: false },
                },
                [APP_NAMES.CONSOLE]: {
                    server: { port: 4000 },
                    cors: { origin: 'https://example.com', credentials: true },
                    datasource: {
                        host: 'localhost',
                        port: 5432,
                        database: 'testdb',
                        schema: 'public',
                        username: 'user',
                        password: 'pass',
                    },
                    logger: { level: 'debug', prettyPrint: true },
                },
            };

            const config = plainToClass(DbcConfiguration, rawConfig, {
                enableImplicitConversion: true,
            });

            const errors = validateSync(config);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('Nested validation', () => {
        it('should validate nested server port config', () => {
            const config = plainToClass(ServerPortConfig, { port: 3000 });
            const errors = validateSync(config);
            expect(errors.length).toBe(0);
        });

        it('should reject invalid port number', () => {
            const config = plainToClass(ServerPortConfig, { port: 100 });
            const errors = validateSync(config);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should validate nested CORS config', () => {
            const config = plainToClass(CorsConfig, {
                origin: '*',
                credentials: true,
            });
            const errors = validateSync(config);
            expect(errors.length).toBe(0);
        });

        it('should validate nested logger config', () => {
            const config = plainToClass(LoggerConfig, {
                level: 'info',
                prettyPrint: false,
            });
            const errors = validateSync(config);
            expect(errors.length).toBe(0);
        });

        it('should reject invalid logger level', () => {
            const config = plainToClass(LoggerConfig, {
                level: 'invalid' as any,
                prettyPrint: false,
            });
            const errors = validateSync(config);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should validate nested datasource config', () => {
            const config = plainToClass(DatasourceConfig, {
                host: 'localhost',
                port: 5432,
                database: 'testdb',
                schema: 'public',
                username: 'user',
                password: 'pass',
            });
            const errors = validateSync(config);
            expect(errors.length).toBe(0);
        });

        it('should reject empty database name', () => {
            const config = plainToClass(DatasourceConfig, {
                host: 'localhost',
                port: 5432,
                database: '',
                schema: 'public',
                username: 'user',
                password: 'pass',
            });
            const errors = validateSync(config);
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});
