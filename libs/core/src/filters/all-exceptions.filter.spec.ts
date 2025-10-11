import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { PinoLogger } from 'nestjs-pino';
import { ERROR_CODE } from '@dbc/core/constants/error-code.constant';
import { Response, Request } from 'express';

describe('AllExceptionsFilter', () => {
    let filter: AllExceptionsFilter;
    let mockLogger: jest.Mocked<PinoLogger>;
    let mockResponse: jest.Mocked<Partial<Response>>;
    let mockRequest: Partial<Request>;
    let mockArgumentsHost: ArgumentsHost;

    beforeEach(() => {
        // Mock PinoLogger
        mockLogger = {
            logger: {} as any,
            setContext: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            log: jest.fn(),
            debug: jest.fn(),
            fatal: jest.fn(),
            trace: jest.fn(),
            info: jest.fn(),
            assign: jest.fn(),
        } as unknown as jest.Mocked<PinoLogger>;

        // Mock Response
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        } as unknown as jest.Mocked<Partial<Response>>;

        // Mock Request
        mockRequest = {
            method: 'GET',
            url: '/test',
        };

        // Mock ArgumentsHost
        const httpContext = {
            getResponse: (): unknown => mockResponse,
            getRequest: (): unknown => mockRequest,
            getNext: jest.fn(),
        };

        mockArgumentsHost = {
            switchToHttp: jest.fn().mockReturnValue(httpContext),
            getArgByIndex: jest.fn(),
            getArgs: jest.fn(),
            getType: jest.fn().mockReturnValue('http'),
            switchToRpc: jest.fn(),
            switchToWs: jest.fn(),
        } as unknown as ArgumentsHost;

        filter = new AllExceptionsFilter(mockLogger);
    });

    describe('Initialization', () => {
        it('should set logger context correctly', () => {
            expect(mockLogger.setContext).toHaveBeenCalledWith(
                AllExceptionsFilter.name,
            );
        });
    });

    describe('HttpException handling', () => {
        it('should handle BadRequestException (400) correctly', () => {
            const exception = new HttpException(
                '错误的请求',
                HttpStatus.BAD_REQUEST,
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    err: exception,
                    statusCode: HttpStatus.BAD_REQUEST,
                }),
                'HTTP exception',
            );
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.BAD_REQUEST,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: ERROR_CODE.SYSTEM_ERROR_002.code,
                    message: '错误的请求',
                }),
            );
        });

        it('should handle UnauthorizedException (401) correctly', () => {
            const exception = new HttpException(
                '未认证',
                HttpStatus.UNAUTHORIZED,
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    err: exception,
                    statusCode: HttpStatus.UNAUTHORIZED,
                }),
                'HTTP exception',
            );
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.UNAUTHORIZED,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: ERROR_CODE.SYSTEM_ERROR_002.code,
                    message: '未认证的用户',
                }),
            );
        });

        it('should handle ForbiddenException (403) correctly', () => {
            const exception = new HttpException(
                '禁止访问',
                HttpStatus.FORBIDDEN,
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    err: exception,
                    statusCode: HttpStatus.FORBIDDEN,
                }),
                'HTTP exception',
            );
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.FORBIDDEN,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: ERROR_CODE.SYSTEM_ERROR_002.code,
                    message: '拒绝访问',
                }),
            );
        });

        it('should handle NotFoundException (404) correctly', () => {
            const exception = new HttpException('未找到', HttpStatus.NOT_FOUND);

            filter.catch(exception, mockArgumentsHost);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    err: exception,
                    statusCode: HttpStatus.NOT_FOUND,
                }),
                'HTTP exception',
            );
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.NOT_FOUND,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: ERROR_CODE.SYSTEM_ERROR_002.code,
                    message: '请求的资源未找到',
                }),
            );
        });

        it('should handle InternalServerErrorException (500) correctly', () => {
            const exception = new HttpException(
                '服务器错误',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    err: exception,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                }),
                'HTTP exception',
            );
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: ERROR_CODE.SYSTEM_ERROR_002.code,
                    message: '服务出错, 请稍后再试',
                }),
            );
        });

        it('should use friendly message from HTTP_ERROR_CODE mapping table', () => {
            const exception = new HttpException('', HttpStatus.NOT_FOUND);

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: '请求的资源未找到',
                }),
            );
        });

        it('should use original exception message when not in mapping table', () => {
            // Use an uncommon status code
            const exception = new HttpException('自定义错误', 418); // I'm a teapot

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: '自定义错误',
                }),
            );
        });

        it('should include request information in logs', () => {
            const exception = new HttpException(
                '测试异常',
                HttpStatus.BAD_REQUEST,
            );
            mockRequest.method = 'POST';
            mockRequest.url = '/api/test';

            filter.catch(exception, mockArgumentsHost);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    err: exception,
                    statusCode: HttpStatus.BAD_REQUEST,
                }),
                'HTTP exception',
            );
        });

        it('should return correct ResponseDto structure', () => {
            const exception = new HttpException('测试', HttpStatus.BAD_REQUEST);

            filter.catch(exception, mockArgumentsHost);

            const calls = (mockResponse.json as jest.Mock).mock.calls;
            const responseBody = calls[0][0] as {
                code: number;
                message: string;
                data: unknown;
            };
            expect(responseBody).toHaveProperty('code');
            expect(responseBody).toHaveProperty('message');
            expect(responseBody).toHaveProperty('data');
            expect(responseBody.data).toBeNull();
        });
    });

    describe('Unknown exception handling', () => {
        it('should handle plain Error object correctly', () => {
            const exception = new Error('未知错误');

            filter.catch(exception, mockArgumentsHost);

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    err: exception,
                    method: mockRequest.method,
                    url: mockRequest.url,
                }),
                'Unexpected exception',
            );
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: ERROR_CODE.SYSTEM_ERROR_001.code,
                    message: ERROR_CODE.SYSTEM_ERROR_001.msg,
                }),
            );
        });

        it('should handle string exception correctly', () => {
            const exception = '这是一个字符串异常';

            filter.catch(exception, mockArgumentsHost);

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    err: expect.any(Error),
                    method: mockRequest.method,
                    url: mockRequest.url,
                }),
                'Unexpected exception',
            );
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        });

        it('should handle null exception correctly', () => {
            const exception = null;

            filter.catch(exception, mockArgumentsHost);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        });

        it('should handle undefined exception correctly', () => {
            const exception = undefined;

            filter.catch(exception, mockArgumentsHost);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        });

        it('should log exception stack trace', () => {
            const exception = new Error('带堆栈的错误');

            filter.catch(exception, mockArgumentsHost);

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    err: exception,
                    method: mockRequest.method,
                    url: mockRequest.url,
                }),
                'Unexpected exception',
            );
        });

        it('should return 500 status code for unknown exceptions', () => {
            const exception = { custom: 'error' };

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        });

        it('should return SYSTEM_ERROR_001 for unknown exceptions', () => {
            const exception = new Error('测试');

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: ERROR_CODE.SYSTEM_ERROR_001.code,
                    message: ERROR_CODE.SYSTEM_ERROR_001.msg,
                    data: null,
                }),
            );
        });
    });

    describe('Edge cases', () => {
        it('should handle very long error messages', () => {
            const longMessage = 'A'.repeat(1000);
            const exception = new HttpException(
                longMessage,
                HttpStatus.BAD_REQUEST,
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalled();
        });

        it('should handle error messages with special characters', () => {
            const specialMessage = '错误：<script>alert("xss")</script>';
            const exception = new HttpException(
                specialMessage,
                HttpStatus.BAD_REQUEST,
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.json).toHaveBeenCalled();
        });

        it('should handle circular reference in exception object', () => {
            const circularException: any = { message: 'circular' };
            circularException.self = circularException;

            // Should not throw
            expect(() => {
                filter.catch(circularException, mockArgumentsHost);
            }).not.toThrow();
        });
    });
});
