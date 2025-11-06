import { BusinessException } from './business.exception';
import { ErrorCodeType } from '@dbc/core/constants/error-code';

export class RecordNotFoundException extends BusinessException {
    constructor(errorCode: ErrorCodeType) {
        super(errorCode);
    }
}
