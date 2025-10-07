import { ErrorCode } from '@dbc/core/constants/error-code';

export abstract class BusinessException extends Error {
    private readonly errorCode: ErrorCode;

    public constructor(errorCode: ErrorCode) {
        super(errorCode.message);
        Error.captureStackTrace(this, this.constructor);
        this.errorCode = errorCode;
    }
}
