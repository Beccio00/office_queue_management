import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { TicketService } from '../../../src/services/getTicketServices';
import { queueManager } from '../../../src/services/queueManager';
import prisma from '../../../src/services/prismaClient';
import { NotFoundError } from '../../../src/interfaces/errors/NotFoundError';
import { ConflictError } from '../../../src/interfaces/errors/ConflictError';
import { InternalServerError } from '../../../src/interfaces/errors/InternalServerError';
import { AppError } from '../../../src/interfaces/errors/AppError';

// Mock external dependencies to isolate service layer business logic testing
jest.mock('../../../src/services/queueManager');
jest.mock('../../../src/services/prismaClient', () => ({
  __esModule: true,
  default: {
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn()
    },
    ticket: {
      findUnique: jest.fn()
    }
  }
}));

// Apply TypeScript typing to mocked modules for better IDE support and type safety
const mockedQueueManager = queueManager as jest.Mocked<typeof queueManager>;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('TicketService Unit Tests', () => {
  let ticketService: TicketService;
  let mockEnqueue: jest.MockedFunction<any>;
  let mockServiceFindUnique: jest.MockedFunction<any>;
  let mockServiceFindMany: jest.MockedFunction<any>;
  let mockTicketFindUnique: jest.MockedFunction<any>;

  beforeEach(() => {
    // Ensure clean test state by resetting all mock call history and implementations
    jest.clearAllMocks();

    // Create fresh service instance for each test to avoid state pollution
    ticketService = new TicketService();

    // Extract typed mock functions for easier access and better test readability
    mockEnqueue = mockedQueueManager.enqueue as jest.MockedFunction<any>;
    mockServiceFindUnique = mockedPrisma.service.findUnique as jest.MockedFunction<any>;
    mockServiceFindMany = mockedPrisma.service.findMany as jest.MockedFunction<any>;
    mockTicketFindUnique = mockedPrisma.ticket.findUnique as jest.MockedFunction<any>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    // Test fixture data representing realistic ticket creation scenario
    const mockServiceId = 1;
    const mockService = {
      id: mockServiceId,
      tag: 'D',
      name: 'Deposit Service',
      description: 'Deposit and withdrawal operations'
    };
    const mockQueueResponse = {
      code: 'D001',
      queueLength: 5,
      positionInQueue: 5
    };
    const mockTicket = {
      id: 123,
      code: 'D001',
      serviceId: mockServiceId,
      createdAt: new Date('2024-01-01T10:00:00Z')
    };
    const mockCreateTicketRequest = { serviceId: mockServiceId };

    describe('Success Cases', () => {
      it('should create a ticket successfully with all dependencies working', async () => {
        // Arrange - Configure all mocks to simulate successful ticket creation flow
        mockEnqueue.mockResolvedValue(mockQueueResponse);
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindUnique.mockResolvedValue(mockTicket);

        // Act
        const result = await ticketService.createTicket(mockCreateTicketRequest);

        // Assert
        expect(result).toEqual({
          ticket: {
            id: mockTicket.id,
            code: mockTicket.code,
            service: {
              id: mockService.id,
              tag: mockService.tag,
              name: mockService.name,
            },
            queueLength: mockQueueResponse.queueLength,
            positionInQueue: mockQueueResponse.positionInQueue,
            createdAt: mockTicket.createdAt
          }
        });

        // Verify correct dependency interaction sequence and parameter passing
        expect(mockEnqueue).toHaveBeenCalledTimes(1);
        expect(mockEnqueue).toHaveBeenCalledWith(mockServiceId);
        expect(mockServiceFindUnique).toHaveBeenCalledTimes(1);
        expect(mockServiceFindUnique).toHaveBeenCalledWith({ where: { id: mockServiceId } });
        expect(mockTicketFindUnique).toHaveBeenCalledTimes(1);
        expect(mockTicketFindUnique).toHaveBeenCalledWith({ where: { code: mockQueueResponse.code } });
      });

      it('should handle different service types correctly', async () => {
        // Arrange - Test service polymorphism with different service categories
        const shippingService = { id: 2, tag: 'S', name: 'Shipping Service' };
        const shippingQueueResponse = { code: 'S042', queueLength: 10, positionInQueue: 10 };
        const shippingTicket = { id: 456, code: 'S042', serviceId: 2, createdAt: new Date() };

        mockEnqueue.mockResolvedValue(shippingQueueResponse);
        mockServiceFindUnique.mockResolvedValue(shippingService);
        mockTicketFindUnique.mockResolvedValue(shippingTicket);

        // Act
        const result = await ticketService.createTicket({ serviceId: 2 });

        // Assert
        expect(result.ticket.service.tag).toBe('S');
        expect(result.ticket.code).toBe('S042');
        expect(result.ticket.queueLength).toBe(10);
      });
    });

    describe('Validation Errors', () => {
      // Test suite for input validation and business rule enforcement
      it('should throw NotFoundError when serviceId is undefined', async () => {
        // Act & Assert
        await expect(ticketService.createTicket({} as any))
          .rejects
          .toThrow(NotFoundError);
        
        try {
          await ticketService.createTicket({} as any);
        } catch (error: any) {
          expect(error.details).toBe('Service ID is required');
        }

        expect(mockEnqueue).not.toHaveBeenCalled();
      });

      it('should throw NotFoundError when serviceId is null', async () => {
        // Act & Assert
        await expect(ticketService.createTicket({ serviceId: null as any }))
          .rejects
          .toThrow(NotFoundError);
      });

      it('should throw NotFoundError when serviceId is 0', async () => {
        // Act & Assert
        await expect(ticketService.createTicket({ serviceId: 0 }))
          .rejects
          .toThrow(NotFoundError);
      });

      it('should throw NotFoundError when service does not exist in database', async () => {
        // Arrange - Test data integrity validation between queue and database
        mockEnqueue.mockResolvedValue(mockQueueResponse);
        mockServiceFindUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(ticketService.createTicket(mockCreateTicketRequest))
          .rejects
          .toThrow(NotFoundError);
        
        try {
          await ticketService.createTicket(mockCreateTicketRequest);
        } catch (error: any) {
          expect(error.details).toBe('Service type not found');
        }

        expect(mockEnqueue).toHaveBeenCalledWith(mockServiceId);
        expect(mockServiceFindUnique).toHaveBeenCalledWith({ where: { id: mockServiceId } });
        expect(mockTicketFindUnique).not.toHaveBeenCalled();
      });
    });

    describe('Queue Manager Errors', () => {
      // Test suite for queue system integration failure scenarios
      it('should throw InternalServerError when queueManager.enqueue returns null', async () => {
        // Arrange - Simulate queue manager returning null (system failure)
        mockEnqueue.mockResolvedValue(null);

        // Act & Assert
        await expect(ticketService.createTicket(mockCreateTicketRequest))
          .rejects
          .toThrow(InternalServerError);
        
        try {
          await ticketService.createTicket(mockCreateTicketRequest);
        } catch (error: any) {
          expect(error.details).toBe('Failed to enqueue ticket');
        }

        expect(mockEnqueue).toHaveBeenCalledWith(mockServiceId);
        expect(mockServiceFindUnique).not.toHaveBeenCalled();
      });

      it('should throw InternalServerError when queueManager.enqueue returns undefined', async () => {
        // Arrange
        mockEnqueue.mockResolvedValue(undefined);

        // Act & Assert
        await expect(ticketService.createTicket(mockCreateTicketRequest))
          .rejects
          .toThrow(InternalServerError);
      });

      it('should propagate queueManager errors as InternalServerError', async () => {
        // Arrange - Test error transformation from external dependency failures
        mockEnqueue.mockRejectedValue(new Error('Queue system down'));

        // Act & Assert
        await expect(ticketService.createTicket(mockCreateTicketRequest))
          .rejects
          .toThrow(InternalServerError);
      });
    });

    describe('Database Constraint Errors', () => {
      // Test suite for Prisma-specific error handling and constraint violations
      it('should throw ConflictError on unique constraint violation (P2002)', async () => {
        // Arrange - Simulate database unique constraint failure via queueManager
        mockEnqueue.mockRejectedValue({ code: 'P2002', message: 'Unique constraint failed' });

        // Act & Assert
        await expect(ticketService.createTicket(mockCreateTicketRequest))
          .rejects
          .toThrow(ConflictError);
        
        try {
          await ticketService.createTicket(mockCreateTicketRequest);
        } catch (error: any) {
          expect(error.details).toBe('Unique constraint violation');
        }

        expect(mockEnqueue).toHaveBeenCalledWith(mockServiceId);
      });

      it('should handle other Prisma constraint errors as InternalServerError', async () => {
        // Arrange
        mockEnqueue.mockRejectedValue({ code: 'P2003', message: 'Foreign key constraint failed' });

        // Act & Assert
        await expect(ticketService.createTicket(mockCreateTicketRequest))
          .rejects
          .toThrow(InternalServerError);
      });
    });

    describe('Error Propagation', () => {
      // Test suite for error handling hierarchy and proper error type preservation
      it('should propagate AppError subclasses without wrapping', async () => {
        // Arrange - Test that domain-specific errors maintain their type through the call stack
        const customError = new NotFoundError('Custom service error');
        mockEnqueue.mockRejectedValue(customError);

        // Act & Assert
        await expect(ticketService.createTicket(mockCreateTicketRequest))
          .rejects
          .toThrow(NotFoundError);
        
        try {
          await ticketService.createTicket(mockCreateTicketRequest);
        } catch (error: any) {
          expect(error.details).toBe('Custom service error');
        }
      });

      it('should wrap generic errors in InternalServerError', async () => {
        // Arrange - Test error standardization for unexpected system failures
        mockEnqueue.mockRejectedValue(new Error('Generic database error'));

        // Act & Assert
        await expect(ticketService.createTicket(mockCreateTicketRequest))
          .rejects
          .toThrow(InternalServerError);
        
        try {
          await ticketService.createTicket(mockCreateTicketRequest);
        } catch (error: any) {
          expect(error.details).toBe('Failed to create ticket');
        }
      });
    });
  });

  describe('getAvailableServices', () => {
    // Test data representing complete service catalog for queue management system
    const mockServices = [
      { id: 1, tag: 'D', name: 'Deposit Service', description: 'Deposit operations' },
      { id: 2, tag: 'P', name: 'Payment Service', description: 'Payment processing' },
      { id: 3, tag: 'S', name: 'Shipping Service', description: 'Shipping and delivery' }
    ];

    describe('Success Cases', () => {
      it('should return all available services ordered by tag', async () => {
        // Arrange - Test service catalog retrieval with proper sorting
        mockServiceFindMany.mockResolvedValue(mockServices);

        // Act
        const result = await ticketService.getAvailableServices();

        // Assert
        expect(result).toEqual(mockServices);
        expect(mockServiceFindMany).toHaveBeenCalledTimes(1);
        expect(mockServiceFindMany).toHaveBeenCalledWith({
          orderBy: {
            tag: 'asc'
          }
        });
      });

      it('should return empty array when no services exist', async () => {
        // Arrange - Test edge case when service catalog is empty
        mockServiceFindMany.mockResolvedValue([]);

        // Act
        const result = await ticketService.getAvailableServices();

        // Assert
        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });

      it('should handle single service correctly', async () => {
        // Arrange
        const singleService = [mockServices[0]];
        mockServiceFindMany.mockResolvedValue(singleService);

        // Act
        const result = await ticketService.getAvailableServices();

        // Assert
        expect(result).toEqual(singleService);
        expect(result.length).toBe(1);
        expect(result[0].tag).toBe('D');
      });
    });

    describe('Error Cases', () => {
      // Test suite for database connectivity and query failure scenarios
      it('should throw InternalServerError when database query fails', async () => {
        // Arrange - Simulate database connectivity issues
        mockServiceFindMany.mockRejectedValue(new Error('Database connection failed'));

        // Act & Assert
        await expect(ticketService.getAvailableServices())
          .rejects
          .toThrow(InternalServerError);
        
        try {
          await ticketService.getAvailableServices();
        } catch (error: any) {
          expect(error.details).toBe('Failed to fetch available services');
        }
      });

      it('should throw InternalServerError on database timeout', async () => {
        // Arrange
        mockServiceFindMany.mockRejectedValue(new Error('Query timeout'));

        // Act & Assert
        await expect(ticketService.getAvailableServices())
          .rejects
          .toThrow(InternalServerError);
      });
    });
  });

  describe('getServiceByTag', () => {
    // Test fixture for service lookup by unique tag identifier
    const mockService = {
      id: 1,
      tag: 'D',
      name: 'Deposit Service',
      description: 'Deposit and withdrawal operations'
    };

    describe('Success Cases', () => {
      it('should return service when found by tag', async () => {
        // Arrange - Test successful service lookup by tag identifier
        mockServiceFindUnique.mockResolvedValue(mockService);

        // Act
        const result = await ticketService.getServiceByTag('D');

        // Assert
        expect(result).toEqual(mockService);
        expect(mockServiceFindUnique).toHaveBeenCalledTimes(1);
        expect(mockServiceFindUnique).toHaveBeenCalledWith({
          where: { tag: 'D' }
        });
      });

      it('should return null when service not found', async () => {
        // Arrange
        mockServiceFindUnique.mockResolvedValue(null);

        // Act
        const result = await ticketService.getServiceByTag('NONEXISTENT');

        // Assert
        expect(result).toBeNull();
        expect(mockServiceFindUnique).toHaveBeenCalledWith({
          where: { tag: 'NONEXISTENT' }
        });
      });

      it('should handle case-sensitive tag search', async () => {
        // Arrange - Test case sensitivity in service tag matching
        mockServiceFindUnique.mockResolvedValue(null);

        // Act
        const result = await ticketService.getServiceByTag('d'); // lowercase

        // Assert
        expect(result).toBeNull();
        expect(mockServiceFindUnique).toHaveBeenCalledWith({
          where: { tag: 'd' }
        });
      });

      it('should handle special characters in tag', async () => {
        // Arrange
        const specialService = { id: 99, tag: 'VIP-1', name: 'VIP Service' };
        mockServiceFindUnique.mockResolvedValue(specialService);

        // Act
        const result = await ticketService.getServiceByTag('VIP-1');

        // Assert
        expect(result).toEqual(specialService);
      });
    });

    describe('Error Cases', () => {
      it('should throw InternalServerError when database query fails', async () => {
        // Arrange
        mockServiceFindUnique.mockRejectedValue(new Error('Database connection lost'));

        // Act & Assert
        await expect(ticketService.getServiceByTag('D'))
          .rejects
          .toThrow(InternalServerError);
        
        try {
          await ticketService.getServiceByTag('D');
        } catch (error: any) {
          expect(error.details).toBe('Failed to fetch service by tag');
        }
      });

      it('should throw InternalServerError on constraint violation', async () => {
        // Arrange
        mockServiceFindUnique.mockRejectedValue({ code: 'P2001', message: 'Record not found' });

        // Act & Assert
        await expect(ticketService.getServiceByTag('D'))
          .rejects
          .toThrow(InternalServerError);
      });
    });

    describe('Input Validation', () => {
      // Test suite for edge cases in tag parameter validation
      it('should handle empty string tag', async () => {
        // Arrange - Test behavior with empty tag input
        mockServiceFindUnique.mockResolvedValue(null);

        // Act
        const result = await ticketService.getServiceByTag('');

        // Assert
        expect(result).toBeNull();
        expect(mockServiceFindUnique).toHaveBeenCalledWith({
          where: { tag: '' }
        });
      });

      it('should handle whitespace-only tag', async () => {
        // Arrange
        mockServiceFindUnique.mockResolvedValue(null);

        // Act
        const result = await ticketService.getServiceByTag('   ');

        // Assert
        expect(result).toBeNull();
        expect(mockServiceFindUnique).toHaveBeenCalledWith({
          where: { tag: '   ' }
        });
      });
    });
  });
});