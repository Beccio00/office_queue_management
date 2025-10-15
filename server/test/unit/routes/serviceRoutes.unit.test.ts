import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { errorMiddleware } from '../../../src/middleware/errorMiddleware';

// Mock controller method before importing routes to ensure proper dependency injection
const mockGetAvailableServices = jest.fn();
jest.mock('../../../src/controllers/getTicketController', () => ({
    TicketController: jest.fn().mockImplementation(() => ({
        getAvailableServices: mockGetAvailableServices
    }))
}));

// Import routes after mocking to ensure mocked controller is used
import serviceRoutes from '../../../src/routes/serviceRoutes';

describe('Service Routes Integration Tests', () => {
    let app: express.Application;

    beforeEach(() => {
        // Clear previous test mock states to ensure test isolation  
        jest.clearAllMocks();

        // Configure Express app to simulate production environment
        app = express();
        app.use(express.json());
        app.use('/api/services', serviceRoutes);
        app.use(errorMiddleware);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/services', () => {
        it('should call controller and return services successfully', async () => {
            // Arrange - Set up realistic service data matching queue management system
            const mockServices = [
                { id: 1, tag: 'D', name: 'Deposit' },
                { id: 2, tag: 'S', name: 'Shipping' },
                { id: 3, tag: 'P', name: 'Payment' }
            ];

            mockGetAvailableServices.mockImplementation((req: any, res: any) => {
                res.status(200).json(mockServices);
            });

            // Act & Assert
            const response = await request(app)
                .get('/api/services')
                .expect(200);

            expect(response.body).toEqual(mockServices);
            expect(mockGetAvailableServices).toHaveBeenCalledTimes(1);
            // Verify controller receives proper Express middleware signature
            expect(mockGetAvailableServices).toHaveBeenCalledWith(
                expect.any(Object), // req
                expect.any(Object), // res
                expect.any(Function) // next
            );
        });

        it('should return services in correct format', async () => {
            // Arrange - Test API contract compliance for service data structure
            const mockServices = [
                { id: 1, tag: 'D', name: 'Deposit' },
                { id: 2, tag: 'S', name: 'Shipping' }
            ];

            mockGetAvailableServices.mockImplementation((req: any, res: any) => {
                res.status(200).json(mockServices);
            });

            // Act & Assert
            const response = await request(app)
                .get('/api/services')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // Validate each service object matches expected schema
            response.body.forEach((service: any) => {
                expect(service).toEqual(
                    expect.objectContaining({
                        id: expect.any(Number),
                        tag: expect.any(String),
                        name: expect.any(String)
                    })
                );
            });
        });

        it('should return empty array when no services available', async () => {
            // Arrange - Test edge case when no services are configured
            mockGetAvailableServices.mockImplementation((req: any, res: any) => {
                res.status(200).json([]);
            });

            // Act & Assert
            const response = await request(app)
                .get('/api/services')
                .expect(200);

            expect(response.body).toEqual([]);
            expect(Array.isArray(response.body)).toBe(true);
            expect(mockGetAvailableServices).toHaveBeenCalledTimes(1);
        });

        it('should handle controller errors with error middleware', async () => {
            // Arrange - Test error propagation through Express error handling chain
            const errorMessage = 'Database connection failed';
            mockGetAvailableServices.mockImplementation((req: any, res: any, next: any) => {
                const error = new Error(errorMessage);
                next(error);
            });

            // Act & Assert
            const response = await request(app)
                .get('/api/services')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Internal Server Error',
                details: 'Unexpected error occurred',
                error: true
            });
            expect(mockGetAvailableServices).toHaveBeenCalledTimes(1);
        });

        it('should handle async controller errors', async () => {
            // Arrange - Test async error handling in controller layer
            const errorMessage = 'Service unavailable';
            mockGetAvailableServices.mockImplementation(async (req: any, res: any, next: any) => {
                try {
                    throw new Error(errorMessage);
                } catch (error) {
                    next(error);
                }
            });

            // Act & Assert
            const response = await request(app)
                .get('/api/services')
                .expect(500);

            expect(response.body.error).toBe(true);
            expect(mockGetAvailableServices).toHaveBeenCalledTimes(1);
        });

        it('should handle concurrent requests correctly', async () => {
            // Arrange - Test route behavior under simultaneous load
            const mockServices = [{ id: 1, tag: 'D', name: 'Deposit' }];
            mockGetAvailableServices.mockImplementation((req: any, res: any) => {
                res.status(200).json(mockServices);
            });

            // Act - Simulate multiple clients requesting services simultaneously
            const requests = Array(3).fill(null).map(() =>
                request(app).get('/api/services')
            );

            const responses = await Promise.all(requests);

            // Assert
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body).toEqual(mockServices);
            });
            expect(mockGetAvailableServices).toHaveBeenCalledTimes(3);
        });

        it('should have correct content-type header', async () => {
            // Arrange - Verify proper HTTP response headers for API compliance
            mockGetAvailableServices.mockImplementation((req: any, res: any) => {
                res.status(200).json([]);
            });

            // Act & Assert
            await request(app)
                .get('/api/services')
                .expect(200)
                .expect('Content-Type', /json/);
        });
    });

    describe('HTTP Method Restrictions', () => {
        // Test suite ensures read-only API contract - only GET operations allowed
        it('should not allow POST method', async () => {
            // Act & Assert
            await request(app)
                .post('/api/services')
                .expect(404);

            expect(mockGetAvailableServices).not.toHaveBeenCalled();
        });

        it('should not allow PUT method', async () => {
            // Act & Assert
            await request(app)
                .put('/api/services')
                .expect(404);

            expect(mockGetAvailableServices).not.toHaveBeenCalled();
        });

        it('should not allow DELETE method', async () => {
            // Act & Assert
            await request(app)
                .delete('/api/services')
                .expect(404);

            expect(mockGetAvailableServices).not.toHaveBeenCalled();
        });

        it('should not allow PATCH method', async () => {
            // Act & Assert
            await request(app)
                .patch('/api/services')
                .expect(404);

            expect(mockGetAvailableServices).not.toHaveBeenCalled();
        });
    });

    describe('Route Parameter Handling', () => {
        it('should not accept route parameters', async () => {
            // Arrange - Test route specificity - services endpoint should not accept IDs
            mockGetAvailableServices.mockImplementation((req: any, res: any) => {
                res.status(200).json([]);
            });

            // Act & Assert - Verify strict route matching prevents parameter access
            await request(app)
                .get('/api/services/123')
                .expect(404);

            expect(mockGetAvailableServices).not.toHaveBeenCalled();
        });

        it('should ignore query parameters', async () => {
            // Arrange - Verify query string handling (should not affect response)
            const mockServices = [{ id: 1, tag: 'D', name: 'Deposit' }];
            mockGetAvailableServices.mockImplementation((req: any, res: any) => {
                res.status(200).json(mockServices);
            });

            // Act & Assert
            const response = await request(app)
                .get('/api/services?limit=10&offset=0')
                .expect(200);

            expect(response.body).toEqual(mockServices);
            expect(mockGetAvailableServices).toHaveBeenCalledTimes(1);
        });
    });
});