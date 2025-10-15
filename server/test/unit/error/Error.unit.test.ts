import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AppError } from '../../../src/interfaces/errors/AppError';
import { NotFoundError } from '../../../src/interfaces/errors/NotFoundError';
import { ConflictError } from '../../../src/interfaces/errors/ConflictError';
import { InternalServerError } from '../../../src/interfaces/errors/InternalServerError';

/**
 * Comprehensive test suite for custom error hierarchy
 * 
 * Tests the application's error handling system which provides structured error responses
 * with appropriate HTTP status codes and detailed error information for debugging.
 * 
 * Error hierarchy:
 * - AppError (base class): Custom error with statusCode and details
 * - NotFoundError (404): Resource not found scenarios
 * - ConflictError (409): Business rule violations, duplicates
 * - InternalServerError (500): System failures, unexpected errors
 */
describe('Error Classes Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AppError', () => {
    /**
     * AppError serves as the foundation for all application-specific errors.
     * It extends JavaScript's native Error with HTTP status codes and structured details.
     */
    describe('Constructor and Basic Properties', () => {
      it('should create AppError with default status code 500', () => {
        // Test the most basic AppError instantiation - message only
        const error = new AppError('Test error message');

        // Verify inheritance chain and default behavior
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe('Test error message');
        expect(error.statusCode).toBe(500); // Default to server error
        expect(error.details).toBeUndefined();
        expect(error.name).toBe('Error');
      });

      it('should create AppError with custom status code', () => {
        // Arrange & Act
        const error = new AppError('Custom error', 400);

        // Assert
        expect(error.message).toBe('Custom error');
        expect(error.statusCode).toBe(400);
        expect(error.details).toBeUndefined();
      });

      it('should create AppError with status code and details', () => {
        // Arrange
        const details = { field: 'email', reason: 'invalid format' };

        // Act
        const error = new AppError('Validation failed', 422, details);

        // Assert
        expect(error.message).toBe('Validation failed');
        expect(error.statusCode).toBe(422);
        expect(error.details).toEqual(details);
      });

      it('should handle complex details object', () => {
        // Test rich error context - useful for validation errors or debugging
        const complexDetails = {
          errors: [
            { field: 'email', message: 'Invalid email format' },
            { field: 'password', message: 'Password too weak' }
          ],
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'req_123456'
        };

        const error = new AppError('Multiple validation errors', 400, complexDetails);

        // Verify complex objects are preserved for detailed error reporting
        expect(error.details).toEqual(complexDetails);
        expect(error.details.errors).toHaveLength(2);
        expect(error.details.requestId).toBe('req_123456');
      });
    });

    /**
     * Critical for proper error handling in JavaScript/TypeScript.
     * Ensures instanceof checks work correctly and stack traces are preserved.
     */
    describe('Prototype and Inheritance', () => {
      it('should maintain proper prototype chain', () => {
        const error = new AppError('Test error');

        // Verify prototype chain is correctly established (important for instanceof)
        expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
        expect(error.constructor).toBe(AppError);
      });

      it('should be instance of Error and AppError', () => {
        const error = new AppError('Test error');

        // Essential for try-catch blocks and error middleware to work correctly
        expect(error instanceof Error).toBe(true);
        expect(error instanceof AppError).toBe(true);
      });

      it('should work with instanceof checks after JSON serialization', () => {
        const error = new AppError('Test error');
        
        // Simulate logging/API response scenario where errors are serialized
        const serialized = JSON.stringify({
          message: error.message,
          statusCode: error.statusCode,
          details: error.details
        });
        const parsed = JSON.parse(serialized);
        const reconstructed = new AppError(parsed.message, parsed.statusCode, parsed.details);

        // Verify errors can be reconstructed properly from serialized data
        expect(reconstructed instanceof AppError).toBe(true);
        expect(reconstructed.message).toBe(error.message);
      });
    });

    /**
     * Stack traces are essential for debugging - they show where errors originated.
     * Error.captureStackTrace() in AppError constructor enables this functionality.
     */
    describe('Stack Trace', () => {
      it('should capture stack trace', () => {
        const error = new AppError('Test error');

        // Verify stack trace is captured for debugging purposes
        expect(error.stack).toBeDefined();
        expect(typeof error.stack).toBe('string');
        expect(error.stack).toContain('AppError');
      });

      it('should have different stack traces for different creation points', () => {
        // Test that stack traces accurately reflect where errors were created
        const createError1 = () => new AppError('Error 1');
        const createError2 = () => new AppError('Error 2');

        const error1 = createError1();
        const error2 = createError2();

        // Each error should show its unique creation context
        expect(error1.stack).toBeDefined();
        expect(error2.stack).toBeDefined();
        expect(error1.stack).toContain('createError1');
        expect(error2.stack).toContain('createError2');
      });
    });

    /**
     * Testing robustness with unusual inputs that might occur in real applications.
     * Error classes should handle edge cases gracefully without crashing.
     */
    describe('Edge Cases', () => {
      it('should handle empty message', () => {
        const error = new AppError('');

        // Should accept empty messages without breaking
        expect(error.message).toBe('');
        expect(error.statusCode).toBe(500);
      });

      it('should handle null details', () => {
        // Arrange & Act
        const error = new AppError('Test error', 400, null);

        // Assert
        expect(error.details).toBeNull();
      });

      it('should handle undefined details explicitly', () => {
        // Arrange & Act
        const error = new AppError('Test error', 400, undefined);

        // Assert
        expect(error.details).toBeUndefined();
      });

      it('should handle zero status code', () => {
        // Arrange & Act
        const error = new AppError('Test error', 0);

        // Assert
        expect(error.statusCode).toBe(0);
      });

      it('should handle negative status code', () => {
        // Arrange & Act
        const error = new AppError('Test error', -1);

        // Assert
        expect(error.statusCode).toBe(-1);
      });

      it('should handle very long messages', () => {
        // Test memory handling with large error messages (e.g., full stack dumps)
        const longMessage = 'A'.repeat(10000);

        const error = new AppError(longMessage);

        // Should handle large messages without memory issues
        expect(error.message).toBe(longMessage);
        expect(error.message.length).toBe(10000);
      });
    });
  });

  /**
   * NotFoundError (HTTP 404) - Used when requested resources don't exist.
   * Common in REST APIs for missing tickets, services, or users.
   */
  describe('NotFoundError', () => {
    describe('Basic Functionality', () => {
      it('should create NotFoundError with default message and status code', () => {
        const error = new NotFoundError();

        // Verify proper inheritance and HTTP 404 semantics
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error.message).toBe('Not Found');
        expect(error.statusCode).toBe(404); // HTTP Not Found
        expect(error.details).toBeUndefined();
      });

      it('should create NotFoundError with custom details', () => {
        // Arrange
        const details = { resource: 'user', id: 123 };

        // Act
        const error = new NotFoundError(details);

        // Assert
        expect(error.message).toBe('Not Found');
        expect(error.statusCode).toBe(404);
        expect(error.details).toEqual(details);
      });

      it('should maintain inheritance chain', () => {
        // Arrange & Act
        const error = new NotFoundError();

        // Assert
        expect(error instanceof Error).toBe(true);
        expect(error instanceof AppError).toBe(true);
        expect(error instanceof NotFoundError).toBe(true);
      });
    });

    /**
     * Real-world scenarios where NotFoundError would be thrown.
     * Details provide context for API consumers and debugging.
     */
    describe('Use Cases', () => {
      it('should handle resource not found scenario', () => {
        // Typical REST API scenario - ticket lookup by ID fails
        const details = {
          resource: 'ticket',
          id: 'T-123',
          message: 'Ticket with ID T-123 not found'
        };

        const error = new NotFoundError(details);

        // Details help API consumers understand what was not found
        expect(error.details.resource).toBe('ticket');
        expect(error.details.id).toBe('T-123');
      });

      it('should handle service not found scenario', () => {
        // Arrange
        const details = { serviceId: 999, serviceName: 'NonExistent Service' };

        // Act
        const error = new NotFoundError(details);

        // Assert
        expect(error.details.serviceId).toBe(999);
        expect(error.statusCode).toBe(404);
      });

      it('should work with null details', () => {
        // Arrange & Act
        const error = new NotFoundError(null);

        // Assert
        expect(error.details).toBeNull();
        expect(error.statusCode).toBe(404);
      });
    });
  });

  /**
   * ConflictError (HTTP 409) - Business rule violations, duplicates, state conflicts.
   * Often used for database constraint violations or concurrent modification issues.
   */
  describe('ConflictError', () => {
    describe('Basic Functionality', () => {
      it('should create ConflictError with default message and status code', () => {
        const error = new ConflictError();

        // Verify HTTP 409 Conflict semantics
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(ConflictError);
        expect(error.message).toBe('Conflict');
        expect(error.statusCode).toBe(409); // HTTP Conflict
        expect(error.details).toBeUndefined();
      });

      it('should create ConflictError with custom details', () => {
        // Arrange
        const details = { constraint: 'unique_email', value: 'test@example.com' };

        // Act
        const error = new ConflictError(details);

        // Assert
        expect(error.message).toBe('Conflict');
        expect(error.statusCode).toBe(409);
        expect(error.details).toEqual(details);
      });

      it('should maintain inheritance chain', () => {
        // Arrange & Act
        const error = new ConflictError();

        // Assert
        expect(error instanceof Error).toBe(true);
        expect(error instanceof AppError).toBe(true);
        expect(error instanceof ConflictError).toBe(true);
      });
    });

    /**
     * ConflictError scenarios in queue management system.
     * Important for handling duplicate resources and business rule enforcement.
     */
    describe('Use Cases', () => {
      it('should handle unique constraint violation', () => {
        // Database constraint violation - common in ticket code generation
        const details = {
          constraint: 'unique_ticket_code',
          field: 'code',
          value: 'D-001',
          message: 'Ticket code D-001 already exists'
        };

        const error = new ConflictError(details);

        // Provides specific information about what constraint was violated
        expect(error.details.constraint).toBe('unique_ticket_code');
        expect(error.details.value).toBe('D-001');
        expect(error.statusCode).toBe(409);
      });

      it('should handle resource state conflict', () => {
        // Arrange
        const details = {
          resource: 'ticket',
          id: 'T-123',
          currentState: 'COMPLETED',
          requestedState: 'CANCELLED',
          message: 'Cannot cancel completed ticket'
        };

        // Act
        const error = new ConflictError(details);

        // Assert
        expect(error.details.currentState).toBe('COMPLETED');
        expect(error.details.requestedState).toBe('CANCELLED');
      });

      it('should handle concurrent modification conflict', () => {
        // Arrange
        const details = {
          type: 'concurrent_modification',
          resource: 'queue',
          version: 5,
          expectedVersion: 4
        };

        // Act
        const error = new ConflictError(details);

        // Assert
        expect(error.details.type).toBe('concurrent_modification');
        expect(error.details.version).toBe(5);
      });
    });
  });

  /**
   * InternalServerError (HTTP 500) - System failures, infrastructure issues.
   * Used for database connections, external service failures, unexpected errors.
   */
  describe('InternalServerError', () => {
    describe('Basic Functionality', () => {
      it('should create InternalServerError with default message and status code', () => {
        const error = new InternalServerError();

        // Verify HTTP 500 Internal Server Error semantics
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(InternalServerError);
        expect(error.message).toBe('Internal Server Error');
        expect(error.statusCode).toBe(500); // HTTP Internal Server Error
        expect(error.details).toBeUndefined();
      });

      it('should create InternalServerError with custom details', () => {
        // Arrange
        const details = { service: 'database', error: 'connection timeout' };

        // Act
        const error = new InternalServerError(details);

        // Assert
        expect(error.message).toBe('Internal Server Error');
        expect(error.statusCode).toBe(500);
        expect(error.details).toEqual(details);
      });

      it('should maintain inheritance chain', () => {
        // Arrange & Act
        const error = new InternalServerError();

        // Assert
        expect(error instanceof Error).toBe(true);
        expect(error instanceof AppError).toBe(true);
        expect(error instanceof InternalServerError).toBe(true);
      });
    });

    /**
     * Infrastructure failure scenarios that should result in HTTP 500 responses.
     * Details help operations teams diagnose system issues.
     */
    describe('Use Cases', () => {
      it('should handle database connection errors', () => {
        // Network/infrastructure failure - critical system dependency down
        const details = {
          service: 'postgresql',
          error: 'ECONNREFUSED',
          host: 'localhost',
          port: 5432,
          timestamp: new Date().toISOString()
        };

        const error = new InternalServerError(details);

        // Rich context for operations teams to diagnose infrastructure issues
        expect(error.details.service).toBe('postgresql');
        expect(error.details.error).toBe('ECONNREFUSED');
        expect(error.statusCode).toBe(500);
      });

      it('should handle queue manager failures', () => {
        // Arrange
        const details = {
          component: 'queueManager',
          operation: 'enqueue',
          serviceId: 1,
          originalError: 'Failed to generate ticket code'
        };

        // Act
        const error = new InternalServerError(details);

        // Assert
        expect(error.details.component).toBe('queueManager');
        expect(error.details.operation).toBe('enqueue');
      });

      it('should handle third-party service failures', () => {
        // Arrange
        const details = {
          service: 'external-api',
          endpoint: '/api/validate',
          statusCode: 503,
          response: 'Service Unavailable'
        };

        // Act
        const error = new InternalServerError(details);

        // Assert
        expect(error.details.service).toBe('external-api');
        expect(error.details.statusCode).toBe(503);
      });
    });
  });

  /**
   * Testing how different error types work together in the application.
   * Critical for error middleware that needs to handle different error types appropriately.
   */
  describe('Error Interoperability', () => {
    /**
     * Error discrimination is essential for middleware that provides different
     * responses based on error type (404 vs 409 vs 500).
     */
    describe('Error Comparison and Identification', () => {
      it('should be able to distinguish between different error types', () => {
        const notFoundError = new NotFoundError();
        const conflictError = new ConflictError();
        const internalError = new InternalServerError();

        // Each error type should be identifiable via instanceof
        // This enables error middleware to provide appropriate HTTP responses
        expect(notFoundError instanceof NotFoundError).toBe(true);
        expect(notFoundError instanceof ConflictError).toBe(false);
        expect(notFoundError instanceof InternalServerError).toBe(false);

        expect(conflictError instanceof ConflictError).toBe(true);
        expect(conflictError instanceof NotFoundError).toBe(false);
        expect(conflictError instanceof InternalServerError).toBe(false);

        expect(internalError instanceof InternalServerError).toBe(true);
        expect(internalError instanceof NotFoundError).toBe(false);
        expect(internalError instanceof ConflictError).toBe(false);
      });

      it('should all be instances of AppError', () => {
        // Arrange & Act
        const errors = [
          new NotFoundError(),
          new ConflictError(),
          new InternalServerError()
        ];

        // Assert
        errors.forEach(error => {
          expect(error instanceof AppError).toBe(true);
          expect(error instanceof Error).toBe(true);
        });
      });

      it('should have different status codes', () => {
        // Arrange & Act
        const errors = [
          new NotFoundError(),
          new ConflictError(), 
          new InternalServerError()
        ];

        // Assert
        const statusCodes = errors.map(e => e.statusCode);
        expect(statusCodes).toEqual([404, 409, 500]);
        expect(new Set(statusCodes).size).toBe(3); // All unique
      });
    });

    /**
     * Error serialization is crucial for API responses and logging systems.
     * Ensures error information can be transmitted and stored properly.
     */
    describe('Serialization and JSON', () => {
      it('should serialize properly to JSON', () => {
        const details = { resource: 'ticket', id: 123 };
        const error = new NotFoundError(details);

        // Simulate API response or logging scenario
        const serialized = JSON.stringify({
          message: error.message,
          statusCode: error.statusCode,
          details: error.details,
          name: error.constructor.name
        });

        const parsed = JSON.parse(serialized);

        // Verify all error information is preserved in JSON form
        expect(parsed.message).toBe('Not Found');
        expect(parsed.statusCode).toBe(404);
        expect(parsed.details).toEqual(details);
        expect(parsed.name).toBe('NotFoundError');
      });

      it('should handle circular references in details', () => {
        // Arrange
        const circularDetails: any = { prop: 'value' };
        circularDetails.self = circularDetails;

        // Act & Assert
        expect(() => {
          new NotFoundError(circularDetails);
        }).not.toThrow();

        // JSON serialization would fail, but error creation should not
        const error = new NotFoundError(circularDetails);
        expect(error.details).toBe(circularDetails);
      });
    });

    /**
     * Verifies errors work correctly in common JavaScript error handling patterns.
     * Essential for integration with Express middleware and async operations.
     */
    describe('Error Handling Patterns', () => {
      it('should work in try-catch blocks correctly', () => {
        const throwNotFound = () => {
          throw new NotFoundError({ resource: 'user' });
        };

        // Test Jest's toThrow matcher works with custom error hierarchy
        expect(() => throwNotFound()).toThrow(NotFoundError);
        expect(() => throwNotFound()).toThrow(AppError);
        expect(() => throwNotFound()).toThrow(Error);

        // Test traditional try-catch error handling
        try {
          throwNotFound();
        } catch (error) {
          expect(error instanceof NotFoundError).toBe(true);
          expect((error as NotFoundError).statusCode).toBe(404);
        }
      });

      it('should work with Promise rejections', async () => {
        const asyncFunction = async () => {
          throw new ConflictError({ reason: 'duplicate entry' });
        };

        // Test async/await error handling - crucial for Express async routes
        await expect(asyncFunction()).rejects.toThrow(ConflictError);
        await expect(asyncFunction()).rejects.toThrow(AppError);

        try {
          await asyncFunction();
        } catch (error) {
          expect(error instanceof ConflictError).toBe(true);
          expect((error as ConflictError).details.reason).toBe('duplicate entry');
        }
      });

      it('should maintain stack trace through async operations', async () => {
        // Arrange
        const asyncThrow = async () => {
          throw new InternalServerError({ component: 'async-test' });
        };

        // Act & Assert
        try {
          await asyncThrow();
        } catch (error) {
          expect(error instanceof InternalServerError).toBe(true);
          expect((error as InternalServerError).stack).toBeDefined();
          expect((error as InternalServerError).stack).toContain('asyncThrow');
        }
      });
    });
  });
});