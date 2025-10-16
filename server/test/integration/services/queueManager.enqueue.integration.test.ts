import { queueManager } from '../../../src/services/queueManager';
import prisma from '../../../src/services/prismaClient';
import { NotFoundError } from '../../../src/interfaces/errors/NotFoundError';
import { InternalServerError } from '../../../src/interfaces/errors/InternalServerError';

describe('QueueManager Integration Tests', () => {
    let serviceId: number;

    beforeAll(async () => {
        //checking that at least one service exists in the database
        const service = await prisma.service.findFirst();
        if (!service) {
            throw new Error('No services found in database - run seed first');
        }
        serviceId = service.id;
    });

    beforeEach(async () => {
        //clean up tickets before each test
        await prisma.ticket.deleteMany({});

        //reset the in-memory queues
        const instance = (queueManager as any);
        instance.queues.clear();
    });

    afterAll(async () => {
        await prisma.ticket.deleteMany({});
    });

    describe('enqueue', () => {
        it('should successfully enqueue a ticket for existing service', async () => {
            const result = await queueManager.enqueue(serviceId);

            expect(result).toHaveProperty('code');
            expect(result).toHaveProperty('positionInQueue');
            expect(result).toHaveProperty('queueLength');

            expect(result.positionInQueue).toBe(2);
            expect(result.queueLength).toBe(2);
            expect(typeof result.code).toBe('string');

            //checks that the ticket is actually in the database
            const ticket = await prisma.ticket.findFirst({
                where: { code: result.code }
            });

            expect(ticket).toBeDefined();
            expect(ticket?.serviceId).toBe(serviceId);
            expect(ticket?.status).toBe('WAITING');
        });

        it('should throw NotFoundError for non-existent service', async () => {
            const nonExistentServiceId = 99999;

            await expect(queueManager.enqueue(nonExistentServiceId))
                .rejects.toThrow(NotFoundError);

            await expect(queueManager.enqueue(nonExistentServiceId))
                .rejects.toThrow(NotFoundError);
        });

        it('should maintain correct queue position for multiple tickets', async () => {
            const firstResult = await queueManager.enqueue(serviceId);
            expect(firstResult.positionInQueue).toBe(2);
            expect(firstResult.queueLength).toBe(2);

            const secondResult = await queueManager.enqueue(serviceId);
            expect(secondResult.positionInQueue).toBe(3);
            expect(secondResult.queueLength).toBe(3);

            //checks that all tickets are in the database
            const tickets = await prisma.ticket.findMany({
                where: { serviceId },
                orderBy: { createdAt: 'asc' }
            });

            expect(tickets).toHaveLength(2);
            expect(tickets[0].code).toBe(firstResult.code);
            expect(tickets[1].code).toBe(secondResult.code);
        });

        it('should generate unique ticket codes for same service', async () => {
            const result1 = await queueManager.enqueue(serviceId);
            const result2 = await queueManager.enqueue(serviceId);

            expect(result1.code).not.toBe(result2.code);

            //the codes should have the same tag but different sequences
            const service = await prisma.service.findUnique({ where: { id: serviceId } });
            expect(result1.code.startsWith(service!.tag)).toBe(true);
            expect(result2.code.startsWith(service!.tag)).toBe(true);
        });
    });

    describe('generateTicketCode', () => {
        it('should generate ticket code with correct format', async () => {
            const service = await prisma.service.findUnique({ where: { id: serviceId } });

            const instance = (queueManager as any);
            const ticketCode = await instance.generateTicketCode(service!.tag);

            expect(ticketCode).toMatch(new RegExp(`^${service!.tag}-\\d{3}$`));
        });

        it('should increment sequence number for same day', async () => {
            const service = await prisma.service.findUnique({ where: { id: serviceId } });
            const instance = (queueManager as any);

            const code1 = await instance.generateTicketCode(service.tag);
            await prisma.ticket.create({
                data: {
                    code: code1,
                    serviceId: service.id,
                    status: 'WAITING'
                }
            });
            const code2 = await instance.generateTicketCode(service.tag);

            const sequence1 = parseInt(code1.split('-')[1].slice(-3));
            const sequence2 = parseInt(code2.split('-')[1].slice(-3));

            expect(code1).not.toBe(code2);
            expect(sequence2).toBe(sequence1 + 1);
        });
    });

    describe('ensureQueueLoaded', () => {
        it('should load existing waiting tickets on first access', async () => {
            const service = await prisma.service.findUnique({ where: { id: serviceId } });

            await prisma.ticket.createMany({
                data: [
                    { code: 'TEST-001', serviceId, status: 'WAITING' },
                    { code: 'TEST-002', serviceId, status: 'WAITING' },
                    { code: 'TEST-003', serviceId, status: 'COMPLETED' }
                ]
            });

            const result = await queueManager.enqueue(serviceId);

            expect(result.positionInQueue).toBe(4);
            expect(result.queueLength).toBe(4);
        });

        it('should handle database errors gracefully', async () => {

            const originalFindMany = prisma.ticket.findMany;
            prisma.ticket.findMany = jest.fn().mockRejectedValue(new Error('DB Error'));

            await expect(queueManager.enqueue(serviceId))
                .rejects.toThrow(InternalServerError);

            prisma.ticket.findMany = originalFindMany;
        });
    });
});