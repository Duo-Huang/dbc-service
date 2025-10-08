import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseTransformInterceptor } from './response-transform.interceptor';
import { DbcResponseBody } from '@dbc/core/dto/response/dbc-response-body';

describe('ResponseTransformInterceptor', () => {
    let interceptor: ResponseTransformInterceptor;
    let mockExecutionContext: ExecutionContext;
    let mockCallHandler: CallHandler;

    beforeEach(() => {
        interceptor = new ResponseTransformInterceptor();
        mockExecutionContext = {} as ExecutionContext;
    });

    describe('intercept', () => {
        it('should wrap plain data as DbcResponseBody.success()', (done) => {
            const testData = { id: 1, name: 'test' };
            mockCallHandler = {
                handle: () => of(testData),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBeInstanceOf(DbcResponseBody);
                    expect(result.code).toBe(0);
                    expect(result.message).toBeNull();
                    expect(result.data).toEqual(testData);
                    done();
                });
        });

        it('should wrap string data as DbcResponseBody.success()', (done) => {
            const testData = 'Hello World';
            mockCallHandler = {
                handle: () => of(testData),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBeInstanceOf(DbcResponseBody);
                    expect(result.code).toBe(0);
                    expect(result.message).toBeNull();
                    expect(result.data).toBe(testData);
                    done();
                });
        });

        it('should wrap number data as DbcResponseBody.success()', (done) => {
            const testData = 42;
            mockCallHandler = {
                handle: () => of(testData),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBeInstanceOf(DbcResponseBody);
                    expect(result.code).toBe(0);
                    expect(result.data).toBe(testData);
                    done();
                });
        });

        it('should wrap array data as DbcResponseBody.success()', (done) => {
            const testData = [1, 2, 3];
            mockCallHandler = {
                handle: () => of(testData),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBeInstanceOf(DbcResponseBody);
                    expect(result.code).toBe(0);
                    expect(result.data).toEqual(testData);
                    done();
                });
        });

        it('should wrap undefined as success response with no data', (done) => {
            mockCallHandler = {
                handle: () => of(undefined),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBeInstanceOf(DbcResponseBody);
                    expect(result.code).toBe(0);
                    expect(result.message).toBeNull();
                    expect(result.data).toBeNull();
                    done();
                });
        });

        it('should wrap null as success response with no data', (done) => {
            mockCallHandler = {
                handle: () => of(null),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBeInstanceOf(DbcResponseBody);
                    expect(result.code).toBe(0);
                    expect(result.message).toBeNull();
                    expect(result.data).toBeNull();
                    done();
                });
        });

        it('should return data directly if already DbcResponseBody instance', (done) => {
            const testData = DbcResponseBody.success({ id: 1, name: 'test' });
            mockCallHandler = {
                handle: () => of(testData),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBe(testData); // Should be the same instance
                    expect(result).toBeInstanceOf(DbcResponseBody);
                    done();
                });
        });

        it('should return error DbcResponseBody instance directly', (done) => {
            const errorResponse = DbcResponseBody.error(1001, '测试错误');
            mockCallHandler = {
                handle: () => of(errorResponse),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBe(errorResponse);
                    expect(result.code).toBe(1001);
                    expect(result.message).toBe('测试错误');
                    done();
                });
        });

        it('should handle boolean false correctly', (done) => {
            mockCallHandler = {
                handle: () => of(false),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBeInstanceOf(DbcResponseBody);
                    expect(result.code).toBe(0);
                    expect(result.data).toBe(false);
                    done();
                });
        });

        it('should handle number 0 correctly', (done) => {
            mockCallHandler = {
                handle: () => of(0),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBeInstanceOf(DbcResponseBody);
                    expect(result.code).toBe(0);
                    expect(result.data).toBe(0);
                    done();
                });
        });

        it('should handle empty string correctly', (done) => {
            mockCallHandler = {
                handle: () => of(''),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBeInstanceOf(DbcResponseBody);
                    expect(result.code).toBe(0);
                    expect(result.data).toBe('');
                    done();
                });
        });

        it('should handle complex nested objects correctly', (done) => {
            const complexData = {
                user: {
                    id: 1,
                    profile: {
                        name: 'test',
                        addresses: [{ city: 'Beijing', street: 'test street' }],
                    },
                },
            };
            mockCallHandler = {
                handle: () => of(complexData),
            };

            interceptor
                .intercept(mockExecutionContext, mockCallHandler)
                .subscribe((result) => {
                    expect(result).toBeInstanceOf(DbcResponseBody);
                    expect(result.code).toBe(0);
                    expect(result.data).toEqual(complexData);
                    done();
                });
        });
    });
});
