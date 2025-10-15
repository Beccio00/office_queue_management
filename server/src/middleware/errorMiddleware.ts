import { Request, Response, NextFunction } from 'express';
import { AppError } from "../interfaces/errors/AppError";

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ 
      error: true, 
      message: err.message, 
      details: err.details || null
    });
  } else {
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      details: 'Unexpected error occurred'
    });
  }
};