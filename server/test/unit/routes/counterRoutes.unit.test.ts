import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import express, { Application, Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { AppError } from '../../../src/interfaces/errors/AppError';
import { NotFoundError } from '../../../src/interfaces/errors/NotFoundError';

// Mock Prisma client before importing routes to ensure proper dependency injection
const mockPrismaCounter = {
  findUnique: jest.fn() as jest.MockedFunction<any>,
};

const mockPrismaCounterService = {
  findMany: jest.fn() as jest.MockedFunction<any>,
};

const mockPrisma = {
  counter: mockPrismaCounter,
  counterService: mockPrismaCounterService,
};

jest.mock('../../../src/services/prismaClient', () => mockPrisma);

// Import routes after mocking to ensure mocked Prisma client is used
import counterRoutes from '../../../src/routes/counterRoutes';

describe('counterRoutes', () => {
  let app: Application;

  beforeEach(() => {
    // Create fresh Express app instance for each test to ensure isolation
    app = express();
    app.use(express.json());
    app.use('/api/counters', counterRoutes);
    
    // Add error handling middleware to simulate production environment
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/counters/:counterId/services', () => {
    const validCounterId = 1;
    const mockCounter = { id: validCounterId, name: 'Counter 1' };
    const mockCounterServices = [
      {
        service: {
          id: 1,
          tag: 'D',
          name: 'Deposit',
          avgServiceTime: 300
        }
      },
      {
        service: {
          id: 2,
          tag: 'S',
          name: 'Shipping',
          avgServiceTime: 450
        }
      }
    ];

    describe('Successful operations', () => {
      it('should return services for a valid counter ID', async () => {
        // Arrange - Set up successful database responses
        mockPrismaCounter.findUnique.mockResolvedValue(mockCounter);
        mockPrismaCounterService.findMany.mockResolvedValue(mockCounterServices);

        const expectedServices = [
          {
            id: 1,
            tag: 'D',
            name: 'Deposit',
            avgServiceTime: 300
          },
          {
            id: 2,
            tag: 'S',
            name: 'Shipping',
            avgServiceTime: 450
          }
        ];

        // Act & Assert
        const response = await request(app)
          .get(`/api/counters/${validCounterId}/services`)
          .expect(200);

        expect(response.body).toEqual(expectedServices);
        
        // Verify database interactions
        expect(mockPrismaCounter.findUnique).toHaveBeenCalledTimes(1);
        expect(mockPrismaCounter.findUnique).toHaveBeenCalledWith({
          where: { id: validCounterId }
        });

        expect(mockPrismaCounterService.findMany).toHaveBeenCalledTimes(1);
        expect(mockPrismaCounterService.findMany).toHaveBeenCalledWith({
          where: { counterId: validCounterId },
          include: { service: true }
        });
      });

      it('should return empty array when counter has no services', async () => {
        // Arrange - Counter exists but has no services
        mockPrismaCounter.findUnique.mockResolvedValue(mockCounter);
        mockPrismaCounterService.findMany.mockResolvedValue([]);

        // Act & Assert
        const response = await request(app)
          .get(`/api/counters/${validCounterId}/services`)
          .expect(200);

        expect(response.body).toEqual([]);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(0);
      });

      it('should handle counter with single service correctly', async () => {
        // Arrange - Counter with only one service
        const singleServiceMock = [{
          service: {
            id: 1,
            tag: 'P',
            name: 'Payment',
            avgServiceTime: 200
          }
        }];

        mockPrismaCounter.findUnique.mockResolvedValue(mockCounter);
        mockPrismaCounterService.findMany.mockResolvedValue(singleServiceMock);

        const expectedService = [{
          id: 1,
          tag: 'P',
          name: 'Payment',
          avgServiceTime: 200
        }];

        // Act & Assert
        const response = await request(app)
          .get(`/api/counters/${validCounterId}/services`)
          .expect(200);

        expect(response.body).toEqual(expectedService);
        expect(response.body).toHaveLength(1);
      });
    });

    describe('Validation errors', () => {
      it('should return 400 for non-numeric counter ID', async () => {
        // Act & Assert
        const response = await request(app)
          .get('/api/counters/invalid/services')
          .expect(400);

        expect(response.body).toEqual({ error: 'Invalid counter ID' });
        
        // Verify no database calls were made
        expect(mockPrismaCounter.findUnique).not.toHaveBeenCalled();
        expect(mockPrismaCounterService.findMany).not.toHaveBeenCalled();
      });

      it('should return 404 for negative counter ID (parseInt accepts negative numbers)', async () => {
        // Arrange - parseInt('-1') returns -1, not NaN, so validation passes but counter won't exist
        mockPrismaCounter.findUnique.mockResolvedValue(null);
        
        // Act & Assert
        const response = await request(app)
          .get('/api/counters/-1/services')
          .expect(404);

        expect(response.body).toEqual({ error: 'Not Found' });
        
        // Verify database was called since validation passed
        expect(mockPrismaCounter.findUnique).toHaveBeenCalledWith({
          where: { id: -1 }
        });
        expect(mockPrismaCounterService.findMany).not.toHaveBeenCalled();
      });

      it('should handle floating point counter ID (parseInt truncates to integer)', async () => {
        // Arrange - parseInt('1.5') returns 1, so this becomes a normal request for counter ID 1
        mockPrismaCounter.findUnique.mockResolvedValue(mockCounter);
        mockPrismaCounterService.findMany.mockResolvedValue(mockCounterServices);
        
        // Act & Assert
        const response = await request(app)
          .get('/api/counters/1.5/services')
          .expect(200);

        // Should work normally since parseInt('1.5') = 1
        expect(Array.isArray(response.body)).toBe(true);
        expect(mockPrismaCounter.findUnique).toHaveBeenCalledWith({
          where: { id: 1 }
        });
      });

      it('should return 404 for zero counter ID (parseInt accepts zero)', async () => {
        // Arrange - parseInt('0') returns 0, not NaN, so validation passes but counter won't exist
        mockPrismaCounter.findUnique.mockResolvedValue(null);
        
        // Act & Assert
        const response = await request(app)
          .get('/api/counters/0/services')
          .expect(404);

        expect(response.body).toEqual({ error: 'Not Found' });
        
        // Verify database was called since validation passed
        expect(mockPrismaCounter.findUnique).toHaveBeenCalledWith({
          where: { id: 0 }
        });
        expect(mockPrismaCounterService.findMany).not.toHaveBeenCalled();
      });
    });

    describe('Not found errors', () => {
      it('should return 404 when counter does not exist', async () => {
        // Arrange - Counter not found in database
        mockPrismaCounter.findUnique.mockResolvedValue(null);

        // Act & Assert
        const response = await request(app)
          .get(`/api/counters/${validCounterId}/services`)
          .expect(404);

        expect(response.body).toEqual({ error: 'Not Found' });
        
        // Verify counter lookup was attempted but services were not queried
        expect(mockPrismaCounter.findUnique).toHaveBeenCalledTimes(1);
        expect(mockPrismaCounterService.findMany).not.toHaveBeenCalled();
      });

      it('should return 404 for very large counter ID that does not exist', async () => {
        // Arrange - Large ID that doesn't exist
        const largeCounterId = 999999;
        mockPrismaCounter.findUnique.mockResolvedValue(null);

        // Act & Assert
        const response = await request(app)
          .get(`/api/counters/${largeCounterId}/services`)
          .expect(404);

        expect(response.body).toEqual({ error: 'Not Found' });
        expect(mockPrismaCounter.findUnique).toHaveBeenCalledWith({
          where: { id: largeCounterId }
        });
      });
    });

    describe('Database error handling', () => {
      it('should handle database connection errors for counter lookup', async () => {
        // Arrange - Database error during counter lookup
        const dbError = new Error('Database connection failed');
        mockPrismaCounter.findUnique.mockRejectedValue(dbError);

        // Act & Assert
        const response = await request(app)
          .get(`/api/counters/${validCounterId}/services`)
          .expect(500);

        expect(response.body).toEqual({ error: 'Internal Server Error' });
        expect(mockPrismaCounter.findUnique).toHaveBeenCalledTimes(1);
      });

      it('should handle database errors for services lookup', async () => {
        // Arrange - Counter exists but services query fails
        mockPrismaCounter.findUnique.mockResolvedValue(mockCounter);
        const dbError = new Error('Services query failed');
        mockPrismaCounterService.findMany.mockRejectedValue(dbError);

        // Act & Assert
        const response = await request(app)
          .get(`/api/counters/${validCounterId}/services`)
          .expect(500);

        expect(response.body).toEqual({ error: 'Internal Server Error' });
        
        expect(mockPrismaCounter.findUnique).toHaveBeenCalledTimes(1);
        expect(mockPrismaCounterService.findMany).toHaveBeenCalledTimes(1);
      });

      it('should properly handle AppError instances from database operations', async () => {
        // Arrange - Custom AppError thrown
        const customError = new AppError('Custom database error', 503);
        mockPrismaCounter.findUnique.mockRejectedValue(customError);

        // Act & Assert
        const response = await request(app)
          .get(`/api/counters/${validCounterId}/services`)
          .expect(503);

        expect(response.body).toEqual({ error: 'Custom database error' });
      });
    });

    describe('Response format validation', () => {
      it('should return services with correct data types', async () => {
        // Arrange
        mockPrismaCounter.findUnique.mockResolvedValue(mockCounter);
        mockPrismaCounterService.findMany.mockResolvedValue(mockCounterServices);

        // Act
        const response = await request(app)
          .get(`/api/counters/${validCounterId}/services`)
          .expect(200);

        // Assert - Validate response structure and data types
        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((service: any) => {
          expect(typeof service.id).toBe('number');
          expect(typeof service.tag).toBe('string');
          expect(typeof service.name).toBe('string');
          expect(typeof service.avgServiceTime).toBe('number');
          expect(service.avgServiceTime).toBeGreaterThan(0);
        });
      });

      it('should not include extra fields in response', async () => {
        // Arrange - Mock with extra fields that should be filtered out
        const mockServicesWithExtraFields = [{
          service: {
            id: 1,
            tag: 'D',
            name: 'Deposit',
            avgServiceTime: 300,
            extraField: 'should not appear',
            internalData: { sensitive: 'data' }
          }
        }];

        mockPrismaCounter.findUnique.mockResolvedValue(mockCounter);
        mockPrismaCounterService.findMany.mockResolvedValue(mockServicesWithExtraFields);

        // Act
        const response = await request(app)
          .get(`/api/counters/${validCounterId}/services`)
          .expect(200);

        // Assert - Only expected fields should be present
        expect(response.body[0]).toEqual({
          id: 1,
          tag: 'D',
          name: 'Deposit',
          avgServiceTime: 300
        });

        expect(response.body[0]).not.toHaveProperty('extraField');
        expect(response.body[0]).not.toHaveProperty('internalData');
      });
    });

    describe('Edge cases', () => {
      it('should handle counter ID at integer boundary values', async () => {
        // Test with maximum safe integer
        const maxSafeInt = Number.MAX_SAFE_INTEGER;
        mockPrismaCounter.findUnique.mockResolvedValue(null);

        const response = await request(app)
          .get(`/api/counters/${maxSafeInt}/services`)
          .expect(404);

        expect(mockPrismaCounter.findUnique).toHaveBeenCalledWith({
          where: { id: maxSafeInt }
        });
      });

      it('should handle services with null or undefined avgServiceTime', async () => {
        // Arrange - Service with null avgServiceTime
        const serviceWithNullTime = [{
          service: {
            id: 1,
            tag: 'T',
            name: 'Test Service',
            avgServiceTime: null
          }
        }];

        mockPrismaCounter.findUnique.mockResolvedValue(mockCounter);
        mockPrismaCounterService.findMany.mockResolvedValue(serviceWithNullTime);

        // Act & Assert
        const response = await request(app)
          .get(`/api/counters/${validCounterId}/services`)
          .expect(200);

        expect(response.body[0].avgServiceTime).toBe(null);
      });
    });
  });
});