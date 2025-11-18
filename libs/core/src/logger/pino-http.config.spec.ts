import { ConfigService } from '@nestjs/config';
import { createPinoHttpConfig } from './pino-http.config';
import type { IncomingMessage, ServerResponse } from 'http';

// Define interface for pino-http options to avoid using 'any'
interface PinoHttpOptions {
    level?: string;
    transport?: {
        target: string;
        options?: Record<string, unknown>;
    };
    formatters?: {
        level?: (label: string) => { level: string };
        bindings?: (
            bindings: Record<string, unknown>,
        ) => Record<string, unknown>;
    };
    timestamp?: () => string;
    serializers?: {
        req?: (
            req: IncomingMessage & { id?: string | number },
        ) => Record<string, unknown>;
        res?: (
            res: ServerResponse & { statusCode: number },
        ) => Record<string, unknown>;
    };
    autoLogging?: boolean | { ignore?: (req: IncomingMessage) => boolean };
    customLogLevel?: (
        req: IncomingMessage,
        res: ServerResponse & { statusCode: number },
        err?: Error,
    ) => string;
}

describe('PinoHttpConfig', () => {
    let mockConfigService: jest.Mocked<ConfigService>;

    beforeEach(() => {
        mockConfigService = {
            get: jest.fn(),
        } as any;
    });

    describe('createPinoHttpConfig', () => {
        it('should return object containing pinoHttp config', () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'logger.prettyPrint') return false;
                if (key === 'logger.level') return 'info';
                return undefined;
            });

            const config = createPinoHttpConfig(mockConfigService);

            expect(config).toHaveProperty('pinoHttp');
            expect(config.pinoHttp).toBeDefined();
        });

        it('should read logger config from flattened configuration', () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'logger.prettyPrint') return false;
                if (key === 'logger.level') return 'debug';
                return undefined;
            });

            createPinoHttpConfig(mockConfigService);

            expect(mockConfigService.get).toHaveBeenCalledWith(
                'logger.prettyPrint',
                false,
            );
            expect(mockConfigService.get).toHaveBeenCalledWith(
                'logger.level',
                'info',
            );
        });

        it('should configure pino-pretty when prettyPrint is true', () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'logger.prettyPrint') return true;
                if (key === 'logger.level') return 'info';
                return undefined;
            });

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.transport).toBeDefined();
            expect(pinoHttp.transport?.target).toBe('pino-pretty');
            expect(pinoHttp.transport?.options).toMatchObject({
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                singleLine: false,
            });
        });

        it('should not configure transport when prettyPrint is false', () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'logger.prettyPrint') return false;
                if (key === 'logger.level') return 'info';
                return undefined;
            });

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.transport).toBeUndefined();
        });

        it('should set correct log level', () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'logger.level') return 'debug';
                if (key === 'logger.prettyPrint') return false;
                return undefined;
            });

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.level).toBe('debug');
        });

        it('should use default log level info', () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'logger.level') return undefined;
                if (key === 'logger.prettyPrint') return false;
                return undefined;
            });

            createPinoHttpConfig(mockConfigService);

            expect(mockConfigService.get).toHaveBeenCalledWith(
                'logger.level',
                'info',
            );
        });
    });

    describe('Formatters', () => {
        it('should configure level formatter', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.formatters).toBeDefined();
            expect(pinoHttp.formatters?.level).toBeDefined();
        });

        it('should return level object from level formatter', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);
            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            const levelFormatter = pinoHttp.formatters?.level;

            expect(levelFormatter).toBeDefined();
            if (levelFormatter) {
                const result = levelFormatter('info');
                expect(result).toEqual({ level: 'info' });
            }
        });

        it('should configure bindings formatter', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.formatters?.bindings).toBeDefined();
        });

        it('should remove pid and hostname from bindings but keep other fields', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);
            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            const bindingsFormatter = pinoHttp.formatters?.bindings;

            expect(bindingsFormatter).toBeDefined();
            if (bindingsFormatter) {
                // Test with only pid and hostname - should return empty
                const result1 = bindingsFormatter({
                    pid: 123,
                    hostname: 'test',
                });
                expect(result1).toEqual({});

                // Test with additional fields - should keep them
                const result2 = bindingsFormatter({
                    pid: 123,
                    hostname: 'test',
                    customField: 'value',
                    requestId: 'req-123',
                });
                expect(result2).toEqual({
                    customField: 'value',
                    requestId: 'req-123',
                });
            }
        });
    });

    describe('Timestamp', () => {
        it('should configure custom timestamp function', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.timestamp).toBeDefined();
            expect(typeof pinoHttp.timestamp).toBe('function');
        });

        it('should return Beijing timezone formatted time', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);
            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            const timestampFn = pinoHttp.timestamp;

            if (timestampFn && typeof timestampFn === 'function') {
                const result = timestampFn();
                // Should return format like: ,"time":"2024-01-01 08:00:00.000"
                expect(result).toMatch(/^,"time":"[\d-]+ [\d:.]+"/);
            }
        });
    });

    describe('Serializers', () => {
        it('should configure req serializer', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.serializers).toBeDefined();
            expect(pinoHttp.serializers?.req).toBeDefined();
        });

        it('should serialize request object correctly', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);
            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            const reqSerializer = pinoHttp.serializers?.req;

            expect(reqSerializer).toBeDefined();
            if (reqSerializer) {
                const mockReq = {
                    id: 'req-123',
                    method: 'GET',
                    url: '/api/test',
                } as IncomingMessage & { id: string };

                const result = reqSerializer(mockReq);

                expect(result).toEqual({
                    id: 'req-123',
                    method: 'GET',
                    url: '/api/test',
                });
            }
        });

        it('should configure res serializer', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.serializers?.res).toBeDefined();
        });

        it('should serialize response object correctly', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);
            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            const resSerializer = pinoHttp.serializers?.res;

            expect(resSerializer).toBeDefined();
            if (resSerializer) {
                const mockRes = {
                    statusCode: 200,
                } as ServerResponse & { statusCode: number };

                const result = resSerializer(mockRes);

                expect(result).toEqual({
                    statusCode: 200,
                });
            }
        });
    });

    describe('AutoLogging', () => {
        it('should enable autoLogging with ignore function', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.autoLogging).toBeDefined();
            expect(typeof pinoHttp.autoLogging).toBe('object');
            if (
                typeof pinoHttp.autoLogging === 'object' &&
                pinoHttp.autoLogging !== null
            ) {
                expect(pinoHttp.autoLogging.ignore).toBeDefined();
                expect(typeof pinoHttp.autoLogging.ignore).toBe('function');
            }
        });

        it('should ignore health check endpoints', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);
            const pinoHttp = config.pinoHttp as PinoHttpOptions;

            if (
                typeof pinoHttp.autoLogging === 'object' &&
                pinoHttp.autoLogging !== null &&
                pinoHttp.autoLogging.ignore
            ) {
                const mockReqWithHealth = {
                    url: '/health',
                } as IncomingMessage;
                const mockReqWithoutHealth = {
                    url: '/api/users',
                } as IncomingMessage;

                expect(pinoHttp.autoLogging.ignore(mockReqWithHealth)).toBe(
                    true,
                );
                expect(pinoHttp.autoLogging.ignore(mockReqWithoutHealth)).toBe(
                    false,
                );
            }
        });
    });

    describe('CustomLogLevel', () => {
        it('should configure customLogLevel function', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.customLogLevel).toBeDefined();
            expect(typeof pinoHttp.customLogLevel).toBe('function');
        });

        it('should return warn level for 4xx status codes', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);
            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            const customLogLevel = pinoHttp.customLogLevel;

            if (customLogLevel) {
                const mockReq = {} as IncomingMessage;
                const mockRes400 = { statusCode: 400 } as ServerResponse & {
                    statusCode: number;
                };
                const mockRes404 = { statusCode: 404 } as ServerResponse & {
                    statusCode: number;
                };

                expect(customLogLevel(mockReq, mockRes400)).toBe('warn');
                expect(customLogLevel(mockReq, mockRes404)).toBe('warn');
            }
        });

        it('should return error level for 5xx status codes', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);
            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            const customLogLevel = pinoHttp.customLogLevel;

            if (customLogLevel) {
                const mockReq = {} as IncomingMessage;
                const mockRes500 = { statusCode: 500 } as ServerResponse & {
                    statusCode: number;
                };
                const mockRes503 = { statusCode: 503 } as ServerResponse & {
                    statusCode: number;
                };

                expect(customLogLevel(mockReq, mockRes500)).toBe('error');
                expect(customLogLevel(mockReq, mockRes503)).toBe('error');
            }
        });

        it('should return error level when error object is present', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);
            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            const customLogLevel = pinoHttp.customLogLevel;

            if (customLogLevel) {
                const mockReq = {} as IncomingMessage;
                const mockRes = { statusCode: 200 } as ServerResponse & {
                    statusCode: number;
                };
                const error = new Error('test error');

                expect(customLogLevel(mockReq, mockRes, error)).toBe('error');
            }
        });

        it('should return info level for 2xx/3xx status codes', () => {
            mockConfigService.get.mockReturnValue(false);

            const config = createPinoHttpConfig(mockConfigService);
            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            const customLogLevel = pinoHttp.customLogLevel;

            if (customLogLevel) {
                const mockReq = {} as IncomingMessage;
                const mockRes200 = { statusCode: 200 } as ServerResponse & {
                    statusCode: number;
                };
                const mockRes304 = { statusCode: 304 } as ServerResponse & {
                    statusCode: number;
                };

                expect(customLogLevel(mockReq, mockRes200)).toBe('info');
                expect(customLogLevel(mockReq, mockRes304)).toBe('info');
            }
        });
    });

    describe('Different environment configs', () => {
        it('should use pretty print in development environment', () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'logger.prettyPrint') return true;
                if (key === 'logger.level') return 'debug';
                return undefined;
            });

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.transport).toBeDefined();
            expect(pinoHttp.level).toBe('debug');
        });

        it('should use JSON format in production environment', () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'logger.prettyPrint') return false;
                if (key === 'logger.level') return 'info';
                return undefined;
            });

            const config = createPinoHttpConfig(mockConfigService);

            const pinoHttp = config.pinoHttp as PinoHttpOptions;
            expect(pinoHttp.transport).toBeUndefined();
            expect(pinoHttp.level).toBe('info');
        });
    });
});
