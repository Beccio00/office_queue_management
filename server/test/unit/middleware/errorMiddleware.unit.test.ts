import { Request, Response, NextFunction } from 'express';
import { errorMiddleware } from '../../../src/middleware/errorMiddleware';
import { AppError } from '../../../src/interfaces/errors/AppError';
import { NotFoundError } from '../../../src/interfaces/errors/NotFoundError';
import { ConflictError } from '../../../src/interfaces/errors/ConflictError';
import { InternalServerError } from '../../../src/interfaces/errors/InternalServerError';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

/**
 * Error Middleware Unit Tests
 * 
 * Tests the central error handling middleware that processes all application errors
 * and converts them into standardized HTTP responses. This middleware is critical
 * for consistent API error responses and proper HTTP status code mapping.
 * 
 * Key responsibilities tested:
 * - Converting AppError hierarchy to appropriate HTTP responses
 * - Handling edge cases (null, undefined, non-Error objects)
 * - Maintaining consistent JSON response structure
 * - Proper Express middleware behavior (no next() calls)
 */
describe('errorMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    // Mock Express Response methods with chainable behavior (status returns this)
    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn().mockReturnThis();
    mockNext = jest.fn(); // Should never be called in error middleware
    
    // Minimal mock objects - error middleware doesn't use request properties
    mockReq = {};
    mockRes = {
      status: mockStatus as any,
      json: mockJson as any,
      locals: {} // Preserve any existing response locals
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test core AppError handling - the primary use case for structured error responses
  it('should handle AppError with details', () => {
    const err = new AppError('Validation error', 422, { field: 'serviceId' });
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    
    // Verify correct HTTP status and structured response format
    expect(mockStatus).toHaveBeenCalledWith(422);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Validation error', details: { field: 'serviceId' } });
    expect(mockNext).not.toHaveBeenCalled(); // Error middleware terminates chain
  });

  it('should handle AppError without details', () => {
    const err = new AppError('Not found', 404);
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    
    // Should normalize missing details to null for consistent API structure
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Not found', details: null });
  });

  it('should handle AppError with null details', () => {
    const err = new AppError('Forbidden', 403, null);
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Forbidden', details: null });
  });

  // Test specific error subclasses - ensures inheritance chain works correctly
  it('should handle NotFoundError', () => {
    const err = new NotFoundError();
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Not Found', details: null });
  });

  it('should handle ConflictError', () => {
    const err = new ConflictError();
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Conflict', details: null });
  });

  it('should handle InternalServerError', () => {
    const err = new InternalServerError('DB error');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Internal Server Error', details: 'DB error' });
  });

  // Test fallback behavior for non-AppError cases - critical for robustness
  it('should handle generic Error as 500', () => {
    const err = new Error('Generic error');
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    
    // Generic errors should be sanitized to prevent information leakage
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Internal Server Error', details: 'Unexpected error occurred' });
  });

  it('should handle null error as 500', () => {
    // Edge case: middleware might receive null from buggy code
    errorMiddleware(null, mockReq as Request, mockRes as Response, mockNext);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Internal Server Error', details: 'Unexpected error occurred' });
  });

  it('should handle undefined error as 500', () => {
    errorMiddleware(undefined, mockReq as Request, mockRes as Response, mockNext);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Internal Server Error', details: 'Unexpected error occurred' });
  });

  // Test defensive programming - handle any type that might be passed as error
  it('should handle string error as 500', () => {
    errorMiddleware('string error', mockReq as Request, mockRes as Response, mockNext);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Internal Server Error', details: 'Unexpected error occurred' });
  });

  it('should handle number error as 500', () => {
    errorMiddleware(123, mockReq as Request, mockRes as Response, mockNext);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Internal Server Error', details: 'Unexpected error occurred' });
  });

  it('should handle object error as 500', () => {
    // Plain objects might be thrown by third-party libraries
    errorMiddleware({ foo: 'bar' }, mockReq as Request, mockRes as Response, mockNext);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: 'Internal Server Error', details: 'Unexpected error occurred' });
  });

  // Critical Express middleware behavior - error middleware must terminate the chain
  it('should not call next()', () => {
    const err = new AppError('Test', 400);
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).not.toHaveBeenCalled(); // Error middleware is terminal
  });

  // Test message handling for internationalization and special characters
  it('should preserve error message with special chars', () => {
    const msg = 'Error: àáâãäåæçèéêë!@#$%^&*()';
    const err = new AppError(msg, 400);
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: msg }));
  });

  it('should handle empty error message', () => {
    const err = new AppError('', 400);
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockJson).toHaveBeenCalledWith({ error: true, message: '', details: null });
  });

  // Ensure consistent API contract - all error responses include error flag
  it('should always include error: true in response', () => {
    const err = new AppError('Test', 400);
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: true }));
    
    jest.clearAllMocks();
    errorMiddleware(new Error('Test'), mockReq as Request, mockRes as Response, mockNext);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: true }));
  });

  it('should work with minimal Request object', () => {
    const minimalReq = {} as Request;
    const err = new AppError('Test', 400);
    expect(() => errorMiddleware(err, minimalReq, mockRes as Response, mockNext)).not.toThrow();
  });

  it('should preserve response.locals', () => {
    const initialLocals = { user: 'test' };
    mockRes.locals = initialLocals;
    const err = new AppError('Test', 400);
    errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.locals).toBe(initialLocals);
  });

  /**
   * API Contract Validation - ensures consistent response structure for client consumption.
   * Critical for frontend error handling and API documentation accuracy.
   */
  describe('Response Structure Validation', () => {
    it('should always return valid JSON structure for AppError', () => {
      const err = new AppError('Test message', 418, { custom: 'data' });
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      
      // Verify response conforms to expected API schema
      const responseCall = mockJson.mock.calls[0][0] as any;
      expect(responseCall).toHaveProperty('error');
      expect(responseCall).toHaveProperty('message');
      expect(responseCall).toHaveProperty('details');
      expect(typeof responseCall.error).toBe('boolean');
      expect(typeof responseCall.message).toBe('string');
    });

    it('should always return valid JSON structure for generic errors', () => {
      const err = new TypeError('Runtime error');
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      
      const responseCall = mockJson.mock.calls[0][0] as any;
      expect(responseCall).toHaveProperty('error');
      expect(responseCall).toHaveProperty('message');
      expect(responseCall).toHaveProperty('details');
      expect(responseCall.error).toBe(true);
      expect(responseCall.message).toBe('Internal Server Error');
      expect(responseCall.details).toBe('Unexpected error occurred');
    });
  });

  /**
   * Express Response Method Behavior - ensures proper HTTP response construction.
   * Status must be set before JSON to ensure correct Content-Type headers.
   */
  describe('Method Call Order and Behavior', () => {
    it('should call status before json', () => {
      // Track method invocation order for proper HTTP response sequence
      const callOrder: string[] = [];
      mockStatus.mockImplementation(() => {
        callOrder.push('status');
        return mockRes;
      });
      mockJson.mockImplementation(() => {
        callOrder.push('json');
        return mockRes;
      });

      const err = new AppError('Test', 400);
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      
      expect(callOrder).toEqual(['status', 'json']);
    });

    it('should call status and json exactly once each', () => {
      const err = new AppError('Test', 400);
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockStatus).toHaveBeenCalledTimes(1);
      expect(mockJson).toHaveBeenCalledTimes(1);
    });

    it('should ensure status method returns response object', () => {
      const err = new AppError('Test', 400);
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockStatus).toHaveReturnedWith(mockRes);
    });
  });

  /**
   * Real-world Error Complexity - tests handling of rich error information
   * that might come from validation libraries or complex business logic.
   */
  describe('Complex Error Scenarios', () => {
    it('should handle AppError with complex nested details', () => {
      // Simulate validation error with multiple fields and metadata
      const complexDetails = {
        validation: {
          fields: ['email', 'password'],
          errors: [
            { field: 'email', code: 'INVALID_FORMAT' },
            { field: 'password', code: 'TOO_SHORT' }
          ]
        },
        metadata: {
          requestId: '12345',
          timestamp: Date.now()
        }
      };
      
      const err = new AppError('Validation failed', 422, complexDetails);
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      
      // Complex objects should be preserved for detailed client feedback
      expect(mockStatus).toHaveBeenCalledWith(422);
      expect(mockJson).toHaveBeenCalledWith({
        error: true,
        message: 'Validation failed',
        details: complexDetails
      });
    });

    it('should handle AppError with array as details', () => {
      const arrayDetails = [
        { field: 'name', message: 'Required' },
        { field: 'age', message: 'Must be positive' }
      ];
      
      const err = new AppError('Multiple errors', 400, arrayDetails);
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockJson).toHaveBeenCalledWith({
        error: true,
        message: 'Multiple errors',
        details: arrayDetails
      });
    });

    it('should handle boolean false as details', () => {
      // Test falsy values - middleware converts false to null due to || operator
      const err = new AppError('Test', 400, false);
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockJson).toHaveBeenCalledWith({
        error: true,
        message: 'Test',
        details: null // false is falsy, so it gets converted to null
      });
    });

    it('should handle zero as details', () => {
      // Zero is falsy - middleware converts 0 to null due to || operator
      const err = new AppError('Test', 400, 0);
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockJson).toHaveBeenCalledWith({
        error: true,
        message: 'Test',
        details: null // 0 is falsy, so it gets converted to null
      });
    });
  });

  /**
   * HTTP Status Code Flexibility - ensures middleware handles any valid HTTP status.
   * Important for future extensibility and RFC compliance.
   */
  describe('Edge Case Status Codes', () => {
    it('should handle custom 4xx status codes', () => {
      // Test unusual but valid HTTP status codes
      const err = new AppError('I am a teapot', 418);
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      expect(mockStatus).toHaveBeenCalledWith(418);
    });

    it('should handle custom 5xx status codes', () => {
      const err = new AppError('Bandwidth Limit Exceeded', 509);
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      expect(mockStatus).toHaveBeenCalledWith(509);
    });

    it('should handle edge case status codes', () => {
      // Test informational status codes (though unusual for errors)
      const err = new AppError('Continue', 100);
      errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);
      expect(mockStatus).toHaveBeenCalledWith(100);
    });
  });
});