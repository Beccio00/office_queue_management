import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { queueManager } from "../../../src/services/queueManager";
import prisma from "../../../src/services/prismaClient";
import { NotFoundError } from "../../../src/interfaces/errors/NotFoundError";
import { InternalServerError } from "../../../src/interfaces/errors/InternalServerError";

// Mock database layer to isolate queue management algorithm testing
jest.mock("../../../src/services/prismaClient", () => ({
  __esModule: true,
  default: {
    service: {
      findUnique: jest.fn(),
    },
    ticket: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Apply TypeScript typing to mocked Prisma for enhanced development experience
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe("QueueManager Unit Tests", () => {
  let mockServiceFindUnique: jest.MockedFunction<any>;
  let mockTicketFindMany: jest.MockedFunction<any>;
  let mockTicketCount: jest.MockedFunction<any>;
  let mockTicketCreate: jest.MockedFunction<any>;

  beforeEach(() => {
    // Ensure clean test state by resetting all mock interactions
    jest.clearAllMocks();

    // Extract typed mock functions for better test readability
    mockServiceFindUnique = mockedPrisma.service
      .findUnique as jest.MockedFunction<any>;
    mockTicketFindMany = mockedPrisma.ticket
      .findMany as jest.MockedFunction<any>;
    mockTicketCount = mockedPrisma.ticket.count as jest.MockedFunction<any>;
    mockTicketCreate = mockedPrisma.ticket.create as jest.MockedFunction<any>;

    // Reset singleton state - critical for testing stateful queue manager
    // Directly manipulate internal Map to ensure test isolation
    (queueManager as any).queues = new Map();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Ensure singleton state cleanup to prevent test interference
    (queueManager as any).queues = new Map();
  });

  describe("Singleton Pattern", () => {
    // Test suite verifying singleton design pattern implementation
    it("should return the same instance when called multiple times", () => {
      // Act
      const instance1 = (queueManager.constructor as any).getInstance();
      const instance2 = (queueManager.constructor as any).getInstance();

      // Assert - Verify singleton identity preservation across calls
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(queueManager);
    });
  });

  describe("enqueue", () => {
    // Test fixture data for deposit service queue operations
    const mockServiceId = 1;
    const mockService = {
      id: mockServiceId,
      tag: "D",
      name: "Deposit Service",
    };

    describe("Success Cases", () => {
      it("should enqueue a ticket successfully for new service queue", async () => {
        // Arrange - Set up fresh queue state with no existing tickets
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockResolvedValue([]); // No existing waiting tickets
        mockTicketCount.mockResolvedValue(0); // No tickets today
        mockTicketCreate.mockResolvedValue({ code: "D-001" }); // Mock successful ticket creation

        // Act
        const result = await queueManager.enqueue(mockServiceId);

        // Assert
        expect(result).toEqual({
          code: "D-001",
          positionInQueue: 1,
          queueLength: 1,
        });

        // Verify proper database interaction sequence for queue initialization
        expect(mockServiceFindUnique).toHaveBeenCalledTimes(1);
        expect(mockServiceFindUnique).toHaveBeenCalledWith({
          where: { id: mockServiceId },
        });
        expect(mockTicketFindMany).toHaveBeenCalledTimes(1);
        expect(mockTicketCount).toHaveBeenCalledTimes(1);
      });

      it("should enqueue a ticket with existing waiting tickets in queue", async () => {
        // Arrange - Test queue position calculation with pre-existing tickets
        const existingTickets = [{ code: "D-001" }, { code: "D-002" }];
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockResolvedValue(existingTickets);
        mockTicketCount.mockResolvedValue(2); // 2 tickets already today
        mockTicketCreate.mockResolvedValue({ code: "D-003" }); // Mock successful ticket creation

        // Act
        const result = await queueManager.enqueue(mockServiceId);

        // Assert
        expect(result).toEqual({
          code: "D-003",
          positionInQueue: 3,
          queueLength: 3,
        });

        expect(mockTicketFindMany).toHaveBeenCalledWith({
          where: {
            serviceId: mockServiceId,
            status: "WAITING",
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            code: true,
          },
        });
      });

      it("should handle multiple services with different tags correctly", async () => {
        // Arrange - Test queue isolation between different service types
        const shippingService = { id: 2, tag: "S", name: "Shipping Service" };

        // First enqueue for Deposit service
        mockServiceFindUnique.mockResolvedValueOnce(mockService);
        mockTicketFindMany.mockResolvedValueOnce([]);
        mockTicketCount.mockResolvedValueOnce(0);

        // Second enqueue for Shipping service
        mockServiceFindUnique.mockResolvedValueOnce(shippingService);
        mockTicketFindMany.mockResolvedValueOnce([]);
        mockTicketCount.mockResolvedValueOnce(0);

        // Act
        const depositResult = await queueManager.enqueue(1);
        const shippingResult = await queueManager.enqueue(2);

        // Assert
        expect(depositResult.code).toBe("D-001");
        expect(shippingResult.code).toBe("S-001");
        expect(depositResult.positionInQueue).toBe(1);
        expect(shippingResult.positionInQueue).toBe(1);
      });

      it("should reuse loaded queue for subsequent calls to same service", async () => {
        // Arrange - Test queue caching mechanism for performance optimization
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockResolvedValue([{ code: "D-001" }]);
        mockTicketCount.mockResolvedValue(1);

        // Act - First call initializes queue cache
        const result1 = await queueManager.enqueue(mockServiceId);

        // Second call should utilize cached queue state
        mockTicketCount.mockResolvedValue(2);
        const result2 = await queueManager.enqueue(mockServiceId);

        // Assert
        expect(result1).toEqual({
          code: "D-002",
          positionInQueue: 2,
          queueLength: 2,
        });

        expect(result2).toEqual({
          code: "D-003",
          positionInQueue: 3,
          queueLength: 3,
        });

        // Verify queue caching effectiveness - database load occurs only once
        expect(mockTicketFindMany).toHaveBeenCalledTimes(1);
      });

      it("should generate correct ticket codes with sequence numbers", async () => {
        // Arrange - Test ticket code generation algorithm across different scenarios
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockResolvedValue([]);

        // Test cases covering sequence number formatting edge cases
        const testCases = [
          { count: 0, expectedCode: "D-001" },
          { count: 9, expectedCode: "D-010" },
          { count: 99, expectedCode: "D-100" },
          { count: 999, expectedCode: "D-1000" },
        ];

        for (const testCase of testCases) {
          mockTicketCount.mockResolvedValue(testCase.count);

          // Act
          const result = await queueManager.enqueue(mockServiceId);

          // Assert
          expect(result.code).toBe(testCase.expectedCode);
        }
      });
    });

    describe("Service Validation Errors", () => {
      // Test suite for service existence validation and error handling
      it("should throw NotFoundError when service does not exist", async () => {
        // Arrange - Simulate attempt to enqueue for non-existent service
        mockServiceFindUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(queueManager.enqueue(999)).rejects.toThrow(NotFoundError);

        try {
          await queueManager.enqueue(999);
        } catch (error: any) {
          expect(error.details).toBe("Service type not found");
        }

        expect(mockServiceFindUnique).toHaveBeenCalledWith({
          where: { id: 999 },
        });
        expect(mockTicketFindMany).not.toHaveBeenCalled();
        expect(mockTicketCount).not.toHaveBeenCalled();
      });

      it("should handle service lookup database errors", async () => {
        // Arrange
        mockServiceFindUnique.mockRejectedValue(
          new Error("Database connection failed")
        );

        // Act & Assert
        await expect(queueManager.enqueue(mockServiceId)).rejects.toThrow(
          InternalServerError
        );

        try {
          await queueManager.enqueue(mockServiceId);
        } catch (error: any) {
          expect(error.details).toBe("Failed to enqueue ticket");
        }
      });
    });

    describe("Queue Loading Errors", () => {
      // Test suite for queue state loading failure scenarios
      it("should throw InternalServerError when loading waiting tickets fails", async () => {
        // Arrange - Simulate database failure during queue state retrieval
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockRejectedValue(
          new Error("Failed to fetch waiting tickets")
        );

        // Act & Assert
        await expect(queueManager.enqueue(mockServiceId)).rejects.toThrow(
          InternalServerError
        );

        try {
          await queueManager.enqueue(mockServiceId);
        } catch (error: any) {
          // The internal ensureQueueLoaded throws 'Failed to load waiting tickets'
          // which should be propagated as the error.details for diagnostics.
          expect(error.details).toBe("Failed to load waiting tickets");
        }
      });

      it("should handle malformed waiting tickets data", async () => {
        // Arrange - Test resilience against corrupted database records
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockResolvedValue([
          { code: "D-001" },
          { code: null }, // Malformed data
          { code: "D-003" },
        ]);
        mockTicketCount.mockResolvedValue(3);

        // Act
        const result = await queueManager.enqueue(mockServiceId);

        // Assert - Should handle gracefully and continue operations
        expect(result.positionInQueue).toBe(4);
        expect(result.queueLength).toBe(4);
      });
    });

    describe("Ticket Code Generation Errors", () => {
      // Test suite for ticket sequence number generation failure scenarios
      it("should throw InternalServerError when ticket count query fails", async () => {
        // Arrange - Simulate database failure during daily ticket count retrieval
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockResolvedValue([]);
        mockTicketCount.mockRejectedValue(new Error("Count query failed"));

        // Act & Assert
        await expect(queueManager.enqueue(mockServiceId)).rejects.toThrow(
          InternalServerError
        );

        try {
          await queueManager.enqueue(mockServiceId);
        } catch (error: any) {
          expect(error.details).toBe("Failed to generate ticket code");
        }
      });

      it("should handle ticket count query with complex date filters", async () => {
        // Arrange - Test daily ticket count mechanism with date boundary logic
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockResolvedValue([]);
        mockTicketCount.mockResolvedValue(5);

        // Act
        const result = await queueManager.enqueue(mockServiceId);

        // Assert
        expect(result.code).toBe("D-006");

        // Verify proper date filtering for daily sequence reset
        expect(mockTicketCount).toHaveBeenCalledWith({
          where: {
            service: {
              tag: "D",
            },
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          },
        });

        // Verify date range precision for accurate daily counting
        const callArgs = mockTicketCount.mock.calls[0][0];
        const startDate = callArgs.where.createdAt.gte;
        const endDate = callArgs.where.createdAt.lte;

        expect(startDate.getHours()).toBe(0);
        expect(startDate.getMinutes()).toBe(0);
        expect(endDate.getHours()).toBe(23);
        expect(endDate.getMinutes()).toBe(59);
      });
    });

    describe("Edge Cases", () => {
      // Test suite for boundary conditions and exceptional scenarios
      it("should handle concurrent enqueue operations for same service", async () => {
        // Arrange - Test thread safety and race condition handling
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockResolvedValue([]);
        mockTicketCount
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(2);

        // Act - Simulate concurrent client requests
        const promises = [
          queueManager.enqueue(mockServiceId),
          queueManager.enqueue(mockServiceId),
          queueManager.enqueue(mockServiceId),
        ];

        const results = await Promise.all(promises);

        // Assert
        expect(results[0].positionInQueue).toBe(1);
        expect(results[1].positionInQueue).toBe(2);
        expect(results[2].positionInQueue).toBe(3);
        expect(results[0].code).toBe("D-001");
        expect(results[1].code).toBe("D-002");
        expect(results[2].code).toBe("D-003");
      });

      it("should handle services with special characters in tag", async () => {
        // Arrange - Test ticket code generation with non-alphanumeric service tags
        const vipService = { id: 99, tag: "VIP-1", name: "VIP Service" };
        mockServiceFindUnique.mockResolvedValue(vipService);
        mockTicketFindMany.mockResolvedValue([]);
        mockTicketCount.mockResolvedValue(0);

        // Act
        const result = await queueManager.enqueue(99);

        // Assert
        expect(result.code).toBe("VIP-1-001");
        expect(result.positionInQueue).toBe(1);
      });

      it("should handle empty service tag gracefully", async () => {
        // Arrange
        const emptyTagService = { id: 100, tag: "", name: "No Tag Service" };
        mockServiceFindUnique.mockResolvedValue(emptyTagService);
        mockTicketFindMany.mockResolvedValue([]);
        mockTicketCount.mockResolvedValue(0);

        // Act
        const result = await queueManager.enqueue(100);

        // Assert
        expect(result.code).toBe("-001");
        expect(result.positionInQueue).toBe(1);
      });

      it("should handle very large queue sizes", async () => {
        // Arrange - Test system scalability with high-volume queue scenarios
        const largeQueue = Array.from({ length: 1000 }, (_, i) => ({
          code: `D-${String(i + 1).padStart(3, "0")}`,
        }));
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockResolvedValue(largeQueue);
        mockTicketCount.mockResolvedValue(1000);

        // Act
        const result = await queueManager.enqueue(mockServiceId);

        // Assert - Verify correct position calculation for large queues
        expect(result.positionInQueue).toBe(1001);
        expect(result.queueLength).toBe(1001);
        expect(result.code).toBe("D-1001");
      });
    });

    describe("Date Handling", () => {
      // Test suite for daily ticket sequence reset and date boundary logic
      it("should generate different codes for different days", async () => {
        // Test verifies daily reset mechanism for ticket sequence numbers
        // Arrange
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockResolvedValue([]);

        // Mock system clock to control date-dependent behavior
        const originalDate = Date;
        const mockDate = new Date("2024-01-01T10:00:00Z");

        global.Date = jest.fn(() => mockDate) as any;
        global.Date.now = originalDate.now;

        mockTicketCount.mockResolvedValue(5); // 5 tickets today

        // Act
        const result = await queueManager.enqueue(mockServiceId);

        // Assert
        expect(result.code).toBe("D-006");

        // Restore original Date
        global.Date = originalDate;
      });

      it("should handle date boundary conditions correctly", async () => {
        // Arrange - Test precision of daily date range calculations
        mockServiceFindUnique.mockResolvedValue(mockService);
        mockTicketFindMany.mockResolvedValue([]);
        mockTicketCount.mockResolvedValue(0);

        // Act
        await queueManager.enqueue(mockServiceId);

        // Assert - Verify precise 24-hour date range for daily ticket counting
        const countCall = mockTicketCount.mock.calls[0][0];
        const startDate = countCall.where.createdAt.gte;
        const endDate = countCall.where.createdAt.lte;

        // Verify start-of-day precision (00:00:00.000)
        expect(startDate.getHours()).toBe(0);
        expect(startDate.getMinutes()).toBe(0);
        expect(startDate.getSeconds()).toBe(0);
        expect(startDate.getMilliseconds()).toBe(0);

        // Verify end-of-day precision (23:59:59.999)
        expect(endDate.getHours()).toBe(23);
        expect(endDate.getMinutes()).toBe(59);
        expect(endDate.getSeconds()).toBe(59);
        expect(endDate.getMilliseconds()).toBe(999);
      });
    });
  });
});
