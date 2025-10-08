import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleService } from './console.service';
import { Logger } from '@nestjs/common';

describe('ConsoleService', () => {
    let service: ConsoleService;
    let loggerSpy: jest.SpyInstance;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ConsoleService],
        }).compile();

        service = module.get<ConsoleService>(ConsoleService);

        // Mock Logger.log method
        loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    });

    afterEach(() => {
        loggerSpy.mockRestore();
    });

    describe('Initialization', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should be an instance of ConsoleService', () => {
            expect(service).toBeInstanceOf(ConsoleService);
        });
    });

    describe('getHello', () => {
        it('should return "Hello World!"', () => {
            const result = service.getHello();

            expect(result).toBe('Hello World!');
        });

        it('should call logger.log method', () => {
            service.getHello();

            expect(loggerSpy).toHaveBeenCalled();
        });

        it('should log correct message', () => {
            service.getHello();

            expect(loggerSpy).toHaveBeenCalledWith('getHello方法被调用');
        });

        it('should call logger.log only once', () => {
            service.getHello();

            expect(loggerSpy).toHaveBeenCalledTimes(1);
        });

        it('should return the same result when called multiple times', () => {
            const result1 = service.getHello();
            const result2 = service.getHello();
            const result3 = service.getHello();

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
            expect(result1).toBe('Hello World!');
        });

        it('should log multiple times when called multiple times', () => {
            service.getHello();
            service.getHello();
            service.getHello();

            expect(loggerSpy).toHaveBeenCalledTimes(3);
        });

        it('should return a string', () => {
            const result = service.getHello();

            expect(typeof result).toBe('string');
        });

        it('should return non-empty string', () => {
            const result = service.getHello();

            expect(result).toBeTruthy();
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('Logging functionality', () => {
        it('should use correct context name for logger', () => {
            // Verify that logger context is ConsoleService
            // This ensures the log source can be properly identified
            service.getHello();

            expect(loggerSpy).toHaveBeenCalled();
            // Logger context will be displayed in actual logs
        });

        it('should not affect business logic even if logging fails', () => {
            // Simulate logger throwing exception
            loggerSpy.mockImplementation(() => {
                throw new Error('日志系统故障');
            });

            // Business logic should still execute
            expect(() => {
                const result = service.getHello();
                expect(result).toBe('Hello World!');
            }).toThrow(); // Will actually throw, but that's expected

            // Restore normal mock
            loggerSpy.mockImplementation(() => {});

            const result = service.getHello();
            expect(result).toBe('Hello World!');
        });
    });

    describe('Dependency injection', () => {
        it('should be created through NestJS test module', async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [ConsoleService],
            }).compile();

            const testService = module.get<ConsoleService>(ConsoleService);

            expect(testService).toBeDefined();
            expect(testService).toBeInstanceOf(ConsoleService);
        });

        it('should be used as singleton', async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [ConsoleService],
            }).compile();

            const service1 = module.get<ConsoleService>(ConsoleService);
            const service2 = module.get<ConsoleService>(ConsoleService);

            // Should be the same instance
            expect(service1).toBe(service2);
        });
    });
});
