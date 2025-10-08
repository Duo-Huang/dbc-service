import { ErrorCodeType } from '@dbc/core/constants/error-code';

export abstract class BusinessException extends Error {
    private readonly errorCode: ErrorCodeType;

    public constructor(errorCode: ErrorCodeType) {
        super(errorCode.message);
        Error.captureStackTrace(this, this.constructor);
        this.errorCode = errorCode;
    }
}
