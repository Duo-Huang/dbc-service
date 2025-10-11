import { BusinessException } from './business.exception';
import { ErrorCodeType } from '@dbc/core/constants/error-code.constant';

export class RecordNotFoundException extends BusinessException {
    constructor(errorCode: ErrorCodeType) {
        super(errorCode);
    }
}
