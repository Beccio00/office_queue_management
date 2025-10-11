import prisma from './prismaClient';
import { CreateTicketRequest, CreateTicketResponse } from '../interfaces/getTicket';
import { queueManager } from './queueManager';

export class TicketService {

  // new ticket creation for a specific service
  async createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    const { serviceTypeId } = request;

    // insert the ticket in the queue and get its details
    const enq = await queueManager.enqueue(serviceTypeId);
    if (!enq) throw new Error('Failed to enqueue ticket');

    // fetch serviceType info for the response
    const serviceType = await prisma.serviceType.findUnique({ where: { id: serviceTypeId } });
    if (!serviceType) throw new Error('Service type not found');

    return {
      ticket: {
        id: enq.id,
        ticketCode: enq.ticketCode,
        serviceType: {
          id: serviceType.id,
          tag: serviceType.tag,
          name: serviceType.name,
        },
        queueLength: enq.queueLength,
        positionInQueue: enq.positionInQueue,
        createdAt: enq.createdAt
      },
      queueInfo: {
        serviceTypeId,
        queueLength: enq.queueLength,
      }
    };
  }

  // return the service types available
  async getAvailableServices(): Promise<any[]> {
    return await prisma.serviceType.findMany({
      orderBy: {
        tag: 'asc'
      }
    });
  }

  // retrieve queue information for a specific service
  async getQueueInfo(serviceTypeId: string) {
    const queueLength = await queueManager.getQueueLength(serviceTypeId);

    return {
      serviceTypeId,
      queueLength,
    };
  }
}