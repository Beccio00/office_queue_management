import { Request, Response, NextFunction } from 'express';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundError } from '../../../src/interfaces/errors/NotFoundError';

/**
 * Unit Tests for TicketController
 * 
 * This test suite covers the TicketController class methods:
 * - createTicket: Handles ticket creation requests from clients
 * - getAvailableServices: Returns list of available queue services
 * 
 * The tests use Jest mocks to isolate the controller logic from service dependencies,
 * ensuring we only test the controller's responsibilities (request/response handling,
 * data transformation, and error propagation).
 */

// Mock functions for the ticket service with proper TypeScript typing
const mockCreateTicket = jest.fn() as jest.MockedFunction<any>;
const mockGetAvailableServices = jest.fn() as jest.MockedFunction<any>;

// Mock the service dependency first
jest.mock('../../../src/services/getTicketServices', () => ({
    TicketService: jest.fn().mockImplementation(() => ({
        createTicket: mockCreateTicket,
        getAvailableServices: mockGetAvailableServices
    }))
}));

// Import the controller after setting up mocks to ensure mocked version is used
import { TicketController } from '../../../src/controllers/getTicketController';

describe('TicketController Unit Tests', () => {
    // Test fixtures and mocks
    let ticketController: TicketController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
        // Reset all mocks before each test to ensure test isolation
        // This prevents state leakage between tests
        jest.clearAllMocks();
        
        // Create a fresh instance of the controller for each test
        // Ensures each test starts with a clean state
        ticketController = new TicketController();

        // Mock Express Request object - will be populated per test as needed
        // Using Partial<Request> allows us to mock only the properties we need
        mockRequest = {};

        // Mock Express Response object with chainable methods
        // status() returns 'this' to allow method chaining: res.status(200).json(data)
        mockResponse = {
            status: jest.fn().mockReturnThis() as any,
            json: jest.fn() as any
        };

        // Mock Express next function for error handling middleware
        // Controllers should call next(error) to pass errors to error middleware
        mockNext = jest.fn();
    });

    describe('createTicket', () => {
        /**
         * Test the happy path for ticket creation
         * Verifies that the controller properly:
         * 1. Extracts serviceId from request body
         * 2. Calls the service layer with correct parameters
         * 3. Transforms service response to client-expected format
         * 4. Returns appropriate HTTP status code (201 Created)
         */
        it('should create a ticket successfully with valid serviceId', async () => {
            // Arrange: Set up test data and mock behaviors
            const serviceId = 1;
            mockRequest.body = { serviceId };

            // Mock the expected service layer response structure
            const mockTicketResult = {
                ticket: {
                    id: 1,
                    code: 'D-001', // Service tag 'D' with sequence number
                    service: {
                        id: 1,
                        tag: 'D',
                        name: 'Deposit'
                    },
                    positionInQueue: 1, // First in queue
                    createdAt: new Date('2024-01-01T10:00:00Z')
                }
            };

            // Configure mock to return our test data
            mockCreateTicket.mockResolvedValueOnce(mockTicketResult);

            // Act: Execute the controller method
            await ticketController.createTicket(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            // Assert: Verify all expected behaviors occurred
            
            // Verify service was called with correct parameters
            expect(mockCreateTicket).toHaveBeenCalledWith({
                serviceId: serviceId
            });
            
            // Verify correct HTTP status code for resource creation
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            
            // Verify response data is transformed to client-expected format
            // Note: Controller transforms internal format to external API format
            expect(mockResponse.json).toHaveBeenCalledWith({
                id: mockTicketResult.ticket.code,                    // External: use ticket code as ID
                serviceType: mockTicketResult.ticket.service.tag,   // External: simplified service info
                createdAt: mockTicketResult.ticket.createdAt,
                status: 'WAITING',                                  // External: hardcoded status
                queuePosition: mockTicketResult.ticket.positionInQueue
            });
            
            // Verify no errors were passed to error middleware
            expect(mockNext).not.toHaveBeenCalled();
        });

        /**
         * Test graceful handling of missing serviceId in request
         * The controller should handle missing serviceId by defaulting to null
         * This allows for general queue tickets when no specific service is requested
         */
        it('should handle missing serviceId by setting it to null', async () => {
            // Arrange: Request with no serviceId (empty body)
            mockRequest.body = {}; // Simulate client not providing serviceId

            // Mock response for general/default service ticket
            const mockTicketResult = {
                ticket: {
                    id: 1,
                    code: 'G-001', // 'G' for General service
                    service: {
                        id: 1,
                        tag: 'G',
                        name: 'General'
                    },
                    positionInQueue: 1,
                    createdAt: new Date('2024-01-01T10:00:00Z')
                }
            };

            mockCreateTicket.mockResolvedValueOnce(mockTicketResult);

            // Act: Execute controller method
            await ticketController.createTicket(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            // Assert: Verify null is passed as serviceId when missing from request
            expect(mockCreateTicket).toHaveBeenCalledWith({
                serviceId: null // Controller should default missing serviceId to null
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        /**
         * Test proper error handling for service layer errors
         * Controllers should not handle errors directly - they should pass them
         * to Express error handling middleware via next(error)
         */
        it('should handle service errors and pass them to next middleware', async () => {
            // Arrange: Set up scenario where service throws NotFoundError
            mockRequest.body = { serviceId: 999 }; // Non-existent service ID
            const error = new NotFoundError('Service not found');

            // Configure mock to reject with our test error
            mockCreateTicket.mockRejectedValueOnce(error);

            // Act: Execute controller method
            await ticketController.createTicket(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            // Assert: Verify proper error handling behavior
            
            // Service should still be called with the provided parameters
            expect(mockCreateTicket).toHaveBeenCalledWith({
                serviceId: 999
            });
            
            // Error should be passed to Express error middleware
            expect(mockNext).toHaveBeenCalledWith(error);
            
            // Response methods should NOT be called when error occurs
            // Error middleware will handle the response
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
        });

        /**
         * Test handling of unexpected/generic errors from service layer
         * Even non-application errors should be properly propagated to error middleware
         * This ensures consistent error handling regardless of error type
         */
        it('should handle unexpected errors and pass them to next middleware', async () => {
            // Arrange: Set up scenario with generic JavaScript error
            mockRequest.body = { serviceId: 1 };
            const error = new Error('Unexpected database error'); // Generic Error, not AppError

            // Configure mock to reject with generic error
            mockCreateTicket.mockRejectedValueOnce(error);

            // Act: Execute controller method
            await ticketController.createTicket(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            // Assert: Verify error is properly propagated
            expect(mockNext).toHaveBeenCalledWith(error);
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        /**
         * Test edge case where request body is completely undefined
         * This can happen with malformed requests or middleware issues
         * Controller should handle gracefully without crashing
         */
        it('should handle empty request body gracefully', async () => {
            // Arrange: Simulate completely missing request body
            mockRequest.body = undefined; // No body at all (not even empty object)

            // Act: Execute controller method - this should cause an error
            await ticketController.createTicket(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            // Assert: Should pass error to next middleware when body is undefined
            // This is the expected behavior since req.body.serviceId would throw
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockCreateTicket).not.toHaveBeenCalled();
        });
    });

    describe('getAvailableServices', () => {
        /**
         * Test successful retrieval and response of available services
         * This is a read-only operation that should return service catalog
         * No request parameters needed - just returns all available services
         */
        it('should return list of available services successfully', async () => {
            // Arrange: Mock service layer response with typical services
            const mockServices = [
                { id: 1, tag: 'D', name: 'Deposit' },
                { id: 2, tag: 'W', name: 'Withdrawal' },
                { id: 3, tag: 'S', name: 'Shipping' }
            ];

            // Configure mock to return our test services
            mockGetAvailableServices.mockResolvedValueOnce(mockServices);

            // Act: Execute controller method
            await ticketController.getAvailableServices(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            // Assert: Verify proper service call and response
            
            // Service should be called with no parameters (gets all services)
            expect(mockGetAvailableServices).toHaveBeenCalledWith();
            
            // Response should contain the services as-is (no transformation needed)
            expect(mockResponse.json).toHaveBeenCalledWith([
                { id: 1, tag: 'D', name: 'Deposit' },
                { id: 2, tag: 'W', name: 'Withdrawal' },
                { id: 3, tag: 'S', name: 'Shipping' }
            ]);
            
            // No errors should be passed to middleware
            expect(mockNext).not.toHaveBeenCalled();
        });

        /**
         * Test edge case where no services are configured in the system
         * Should return empty array rather than error - this is valid state
         * Client can handle empty array to show "no services available"
         */
        it('should return empty array when no services are available', async () => {
            // Arrange: Mock empty service list (system has no configured services)
            const mockServices: any[] = [];
            mockGetAvailableServices.mockResolvedValueOnce(mockServices);

            // Act: Execute controller method
            await ticketController.getAvailableServices(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            // Assert: Should return empty array, not error
            expect(mockResponse.json).toHaveBeenCalledWith([]);
            expect(mockNext).not.toHaveBeenCalled(); // Empty is not an error condition
        });

        /**
         * Test error handling for database/infrastructure failures
         * Database connection issues should be propagated as errors
         * Client should receive 500 error, not empty array
         */
        it('should handle database errors and pass them to next middleware', async () => {
            // Arrange: Mock database connection failure
            const error = new Error('Database connection failed');
            mockGetAvailableServices.mockRejectedValueOnce(error);

            // Act: Execute controller method
            await ticketController.getAvailableServices(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            // Assert: Error should be properly propagated
            expect(mockGetAvailableServices).toHaveBeenCalledWith();
            expect(mockNext).toHaveBeenCalledWith(error);
            expect(mockResponse.json).not.toHaveBeenCalled(); // No response on error
        });

        /**
         * Test handling of application-level errors from service layer
         * Service layer might throw NotFoundError for business logic reasons
         * These should be handled same as any other error - pass to middleware
         */
        it('should handle service layer errors correctly', async () => {
            // Arrange: Mock business logic error (e.g., no services configured)
            const error = new NotFoundError('No services configured');
            mockGetAvailableServices.mockRejectedValueOnce(error);

            // Act: Execute controller method
            await ticketController.getAvailableServices(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            // Assert: Application errors should be propagated like any other error
            expect(mockNext).toHaveBeenCalledWith(error);
            expect(mockResponse.json).not.toHaveBeenCalled();
        });

        /**
         * Test data transformation/filtering for API response
         * Service layer might return internal data that shouldn't be exposed to clients
         * Controller should filter/transform data to only include public API fields
         */
        it('should transform service data correctly', async () => {
            // Arrange: Mock service data with both public and internal fields
            const mockServices = [
                { 
                    id: 1, 
                    tag: 'D', 
                    name: 'Deposit',
                    // Internal fields that should be filtered out from API response
                    internal: true,           // Internal flag
                    createdAt: new Date(),    // Creation timestamp
                    updatedAt: new Date(),    // Update timestamp
                    isActive: true           // Status flag
                }
            ];

            mockGetAvailableServices.mockResolvedValueOnce(mockServices);

            // Act: Execute controller method
            await ticketController.getAvailableServices(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            // Assert: Only public API fields should be in response
            // Controller should filter out internal fields for security/cleanliness
            expect(mockResponse.json).toHaveBeenCalledWith([
                { 
                    id: 1, 
                    tag: 'D', 
                    name: 'Deposit' 
                    // Note: internal fields should be filtered out
                }
            ]);
        });
    });

    describe('Controller Integration', () => {
        /**
         * Test controller class structure and method signatures
         * Ensures controller conforms to Express.js middleware conventions
         * All controller methods should accept (req, res, next) parameters
         */
        it('should have proper method signatures', () => {
            // Assert: Controller methods should be functions with correct arity
            expect(typeof ticketController.createTicket).toBe('function');
            expect(typeof ticketController.getAvailableServices).toBe('function');
            
            // Express middleware functions should accept exactly 3 parameters: req, res, next
            expect(ticketController.createTicket.length).toBe(3); // req, res, next
            expect(ticketController.getAvailableServices.length).toBe(3); // req, res, next
        });

        /**
         * Test controller instantiation and inheritance
         * Verifies the controller can be properly instantiated
         * Important for dependency injection and testing scenarios
         */
        it('should be instantiable', () => {
            // Act: Create new controller instance
            const controller = new TicketController();
            
            // Assert: Should be proper instance of TicketController class
            expect(controller).toBeInstanceOf(TicketController);
        });
    });
});