import { AppError } from './AppError';

export class ConflictError extends AppError {
    constructor(details?: any) {
        super('Conflict', 409, details);
    }
}