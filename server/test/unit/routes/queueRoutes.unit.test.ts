import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import express, { Application, Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { AppError } from '../../../src/interfaces/errors/AppError';
import { NotFoundError } from '../../../src/interfaces/errors/NotFoundError';
import { InternalServerError } from '../../../src/interfaces/errors/InternalServerError';

// Mock queueManager before importing routes to ensure proper dependency injection
const mockQueueManager = {
  getNextTicketForCounter: jest.fn() as jest.MockedFunction<any>,
  getTicketByCode: jest.fn() as jest.MockedFunction<any>,
  getQueueStatus: jest.fn() as jest.MockedFunction<any>,
};

jest.mock('../../../src/services/queueManager', () => ({
  queueManager: mockQueueManager
}));

// Import routes after mocking to ensure mocked queueManager is used
import queueRoutes from '../../../src/routes/queueRoutes';

describe('queueRoutes', () => {
  let app: Application;

  beforeEach(() => {
    // Create fresh Express app instance for each test to ensure isolation
    app = express();
    app.use(express.json());
    app.use('/api/queue', queueRoutes);
    
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

  describe('POST /api/queue/next', () => {
    const validCounterId = 1;
    const mockTicketCode = 'D-001';
    const mockTicket = {
      id: 1,
      code: 'D-001',
      service: { tag: 'D' },
      calledAt: new Date('2024-01-01T10:00:00.000Z')
    };

    describe('Successful operations', () => {
      it('should return next ticket for valid counter ID', async () => {
        // Arrange - Set up successful queue operations
        mockQueueManager.getNextTicketForCounter.mockResolvedValue(mockTicketCode);
        mockQueueManager.getTicketByCode.mockResolvedValue(mockTicket);

        const requestBody = { counterId: validCounterId };
        const expectedResponse = {
          code: 'D-001',
          id: 1,
          serviceType: 'D',
          timestamp: '2024-01-01T10:00:00.000Z'
        };

        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send(requestBody)
          .expect(200);

        expect(response.body).toEqual(expectedResponse);
        
        // Verify service interactions
        expect(mockQueueManager.getNextTicketForCounter).toHaveBeenCalledTimes(1);
        expect(mockQueueManager.getNextTicketForCounter).toHaveBeenCalledWith(validCounterId);
        
        expect(mockQueueManager.getTicketByCode).toHaveBeenCalledTimes(1);
        expect(mockQueueManager.getTicketByCode).toHaveBeenCalledWith(mockTicketCode);
      });

      it('should handle different service types correctly', async () => {
        // Arrange - Test with shipping service
        const shippingTicket = {
          id: 2,
          code: 'S-001',
          service: { tag: 'S' },
          calledAt: new Date('2024-01-01T11:00:00.000Z')
        };

        mockQueueManager.getNextTicketForCounter.mockResolvedValue('S-001');
        mockQueueManager.getTicketByCode.mockResolvedValue(shippingTicket);

        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: validCounterId })
          .expect(200);

        expect(response.body.serviceType).toBe('S');
        expect(response.body.code).toBe('S-001');
      });
    });

    describe('Validation errors', () => {
      it('should return 400 when counterId is missing', async () => {
        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({})
          .expect(400);

        expect(response.body).toEqual({ 
          error: 'counterId is required and must be a number' 
        });
        
        // Verify no service calls were made
        expect(mockQueueManager.getNextTicketForCounter).not.toHaveBeenCalled();
        expect(mockQueueManager.getTicketByCode).not.toHaveBeenCalled();
      });

      it('should return 400 when counterId is null', async () => {
        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: null })
          .expect(400);

        expect(response.body).toEqual({ 
          error: 'counterId is required and must be a number' 
        });
      });

      it('should return 400 when counterId is not a number', async () => {
        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: 'invalid' })
          .expect(400);

        expect(response.body).toEqual({ 
          error: 'counterId is required and must be a number' 
        });
      });

      it('should return 400 when counterId is undefined', async () => {
        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: undefined })
          .expect(400);

        expect(response.body).toEqual({ 
          error: 'counterId is required and must be a number' 
        });
      });

      it('should return 400 when counterId is a boolean', async () => {
        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: true })
          .expect(400);

        expect(response.body).toEqual({ 
          error: 'counterId is required and must be a number' 
        });
      });
    });

    describe('No customers in queue', () => {
      it('should return 404 when no customers are in queue', async () => {
        // Arrange - Queue manager returns null (no tickets)
        mockQueueManager.getNextTicketForCounter.mockResolvedValue(null);

        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: validCounterId })
          .expect(404);

        expect(response.body).toEqual({ 
          error: 'No customers in queue' 
        });
        
        // Verify getNextTicketForCounter was called but getTicketByCode was not
        expect(mockQueueManager.getNextTicketForCounter).toHaveBeenCalledTimes(1);
        expect(mockQueueManager.getTicketByCode).not.toHaveBeenCalled();
      });
    });

    describe('Error handling', () => {
      it('should handle NotFoundError from getNextTicketForCounter', async () => {
        // Arrange - Service throws NotFoundError
        const notFoundError = new NotFoundError('Counter has no assigned services');
        mockQueueManager.getNextTicketForCounter.mockRejectedValue(notFoundError);

        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: validCounterId })
          .expect(404);

        expect(response.body).toEqual({ error: 'Not Found' });
      });

      it('should handle InternalServerError from getNextTicketForCounter', async () => {
        // Arrange - Service throws InternalServerError
        const internalError = new InternalServerError('Failed to get next ticket for counter');
        mockQueueManager.getNextTicketForCounter.mockRejectedValue(internalError);

        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: validCounterId })
          .expect(500);

        expect(response.body).toEqual({ error: 'Internal Server Error' });
      });

      it('should handle errors from getTicketByCode', async () => {
        // Arrange - getNextTicketForCounter succeeds, getTicketByCode fails
        mockQueueManager.getNextTicketForCounter.mockResolvedValue(mockTicketCode);
        const ticketError = new NotFoundError('Ticket not found');
        mockQueueManager.getTicketByCode.mockRejectedValue(ticketError);

        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: validCounterId })
          .expect(404);

        expect(response.body).toEqual({ error: 'Not Found' });
        
        // Verify both services were called
        expect(mockQueueManager.getNextTicketForCounter).toHaveBeenCalledTimes(1);
        expect(mockQueueManager.getTicketByCode).toHaveBeenCalledTimes(1);
      });

      it('should handle generic errors and pass to error middleware', async () => {
        // Arrange - Generic error (not AppError)
        const genericError = new Error('Database connection failed');
        mockQueueManager.getNextTicketForCounter.mockRejectedValue(genericError);

        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: validCounterId })
          .expect(500);

        expect(response.body).toEqual({ error: 'Internal Server Error' });
      });
    });

    describe('Edge cases', () => {
      it('should handle negative counter ID correctly', async () => {
        // Arrange - Negative counterId is still a number, so validation passes
        mockQueueManager.getNextTicketForCounter.mockResolvedValue(null);

        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: -1 })
          .expect(404);

        expect(response.body).toEqual({ error: 'No customers in queue' });
        expect(mockQueueManager.getNextTicketForCounter).toHaveBeenCalledWith(-1);
      });

      it('should return 400 for zero counter ID (zero is falsy in validation)', async () => {
        // Arrange - Zero fails the !counterId check in validation
        
        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: 0 })
          .expect(400);

        expect(response.body).toEqual({ 
          error: 'counterId is required and must be a number' 
        });
        
        // Verify no service calls were made since validation failed
        expect(mockQueueManager.getNextTicketForCounter).not.toHaveBeenCalled();
      });

      it('should handle large counter ID values', async () => {
        // Arrange
        const largeCounterId = Number.MAX_SAFE_INTEGER;
        mockQueueManager.getNextTicketForCounter.mockResolvedValue(null);

        // Act & Assert
        const response = await request(app)
          .post('/api/queue/next')
          .send({ counterId: largeCounterId })
          .expect(404);

        expect(mockQueueManager.getNextTicketForCounter).toHaveBeenCalledWith(largeCounterId);
      });
    });
  });

  describe('GET /api/queue/status', () => {
    const mockQueueStatus = [
      {
        serviceId: 1,
        serviceTag: 'D',
        serviceName: 'Deposit',
        queueLength: 3
      },
      {
        serviceId: 2,
        serviceTag: 'S',
        serviceName: 'Shipping',
        queueLength: 1
      },
      {
        serviceId: 3,
        serviceTag: 'P',
        serviceName: 'Payment',
        queueLength: 0
      }
    ];

    describe('Successful operations', () => {
      it('should return queue status for all services', async () => {
        // Arrange
        mockQueueManager.getQueueStatus.mockResolvedValue(mockQueueStatus);

        const expectedResponse = {
          data: [
            {
              serviceTag: 'D',
              serviceName: 'Deposit',
              queueLength: 3
            },
            {
              serviceTag: 'S',
              serviceName: 'Shipping',
              queueLength: 1
            },
            {
              serviceTag: 'P',
              serviceName: 'Payment',
              queueLength: 0
            }
          ]
        };

        // Act & Assert
        const response = await request(app)
          .get('/api/queue/status')
          .expect(200);

        expect(response.body).toEqual(expectedResponse);
        expect(mockQueueManager.getQueueStatus).toHaveBeenCalledTimes(1);
      });

      it('should return empty data array when no services exist', async () => {
        // Arrange
        mockQueueManager.getQueueStatus.mockResolvedValue([]);

        // Act & Assert
        const response = await request(app)
          .get('/api/queue/status')
          .expect(200);

        expect(response.body).toEqual({ data: [] });
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should handle services with zero queue length', async () => {
        // Arrange - All services have empty queues
        const emptyQueues = [
          {
            serviceId: 1,
            serviceTag: 'D',
            serviceName: 'Deposit',
            queueLength: 0
          }
        ];
        mockQueueManager.getQueueStatus.mockResolvedValue(emptyQueues);

        // Act & Assert
        const response = await request(app)
          .get('/api/queue/status')
          .expect(200);

        expect(response.body.data[0].queueLength).toBe(0);
      });
    });

    describe('Response format validation', () => {
      it('should return data with correct structure and types', async () => {
        // Arrange
        mockQueueManager.getQueueStatus.mockResolvedValue(mockQueueStatus);

        // Act
        const response = await request(app)
          .get('/api/queue/status')
          .expect(200);

        // Assert - Check response structure
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        
        // Validate each service entry
        response.body.data.forEach((service: any) => {
          expect(typeof service.serviceTag).toBe('string');
          expect(typeof service.serviceName).toBe('string');
          expect(typeof service.queueLength).toBe('number');
          expect(service.queueLength).toBeGreaterThanOrEqual(0);
          
          // Should not include serviceId in response
          expect(service).not.toHaveProperty('serviceId');
        });
      });

      it('should not include extra fields in response', async () => {
        // Arrange - Mock with extra fields that should be filtered out
        const statusWithExtraFields = [{
          serviceId: 1,
          serviceTag: 'D',
          serviceName: 'Deposit',
          queueLength: 3,
          extraField: 'should not appear',
          internalData: { sensitive: 'data' }
        }];
        mockQueueManager.getQueueStatus.mockResolvedValue(statusWithExtraFields);

        // Act
        const response = await request(app)
          .get('/api/queue/status')
          .expect(200);

        // Assert - Only expected fields should be present
        expect(response.body.data[0]).toEqual({
          serviceTag: 'D',
          serviceName: 'Deposit',
          queueLength: 3
        });

        expect(response.body.data[0]).not.toHaveProperty('serviceId');
        expect(response.body.data[0]).not.toHaveProperty('extraField');
        expect(response.body.data[0]).not.toHaveProperty('internalData');
      });
    });

    describe('Error handling', () => {
      it('should handle InternalServerError from getQueueStatus', async () => {
        // Arrange
        const internalError = new InternalServerError('Failed to get queue status');
        mockQueueManager.getQueueStatus.mockRejectedValue(internalError);

        // Act & Assert
        const response = await request(app)
          .get('/api/queue/status')
          .expect(500);

        expect(response.body).toEqual({ error: 'Internal Server Error' });
        expect(mockQueueManager.getQueueStatus).toHaveBeenCalledTimes(1);
      });

      it('should handle custom AppError from getQueueStatus', async () => {
        // Arrange
        const customError = new AppError('Database connection failed', 503);
        mockQueueManager.getQueueStatus.mockRejectedValue(customError);

        // Act & Assert
        const response = await request(app)
          .get('/api/queue/status')
          .expect(503);

        expect(response.body).toEqual({ error: 'Database connection failed' });
      });

      it('should handle generic errors and pass to error middleware', async () => {
        // Arrange
        const genericError = new Error('Unexpected error');
        mockQueueManager.getQueueStatus.mockRejectedValue(genericError);

        // Act & Assert
        const response = await request(app)
          .get('/api/queue/status')
          .expect(500);

        expect(response.body).toEqual({ error: 'Internal Server Error' });
      });
    });

    describe('Edge cases', () => {
      it('should handle very large queue lengths', async () => {
        // Arrange
        const largeQueueStatus = [{
          serviceId: 1,
          serviceTag: 'D',
          serviceName: 'Deposit',
          queueLength: Number.MAX_SAFE_INTEGER
        }];
        mockQueueManager.getQueueStatus.mockResolvedValue(largeQueueStatus);

        // Act & Assert
        const response = await request(app)
          .get('/api/queue/status')
          .expect(200);

        expect(response.body.data[0].queueLength).toBe(Number.MAX_SAFE_INTEGER);
      });

      it('should handle services with special characters in names', async () => {
        // Arrange
        const specialCharStatus = [{
          serviceId: 1,
          serviceTag: 'D',
          serviceName: 'Dépôt & Crédit (€)',
          queueLength: 2
        }];
        mockQueueManager.getQueueStatus.mockResolvedValue(specialCharStatus);

        // Act & Assert
        const response = await request(app)
          .get('/api/queue/status')
          .expect(200);

        expect(response.body.data[0].serviceName).toBe('Dépôt & Crédit (€)');
      });
    });
  });
});
