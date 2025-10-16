import { AppError } from './AppError';

export class InternalServerError extends AppError {
    constructor(details?: any) {
        super('Internal Server Error', 500, details);
    }
}