import { AppError } from './AppError';

export class NotFoundError extends AppError {
    constructor(details?: any) {
        super('Not Found', 404, details);
    }
}