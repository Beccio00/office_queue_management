import prisma from './prismaClient';
import { CreateTicketRequest, CreateTicketResponse } from '../interfaces/getTicket';
import { queueManager } from './queueManager';

export class TicketService {

  // new ticket creation for a specific service
  async createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {

    const { serviceId } = request;

    const response = await queueManager.enqueue(serviceId);
    if (!response) throw new Error('Failed to enqueue ticket');

    // fetch serviceType info for the response
    const serviceType = await prisma.serviceType.findUnique({ where: { id: serviceId } });
    if (!serviceType) throw new Error('Service type not found');

    //salva su prisma il ticket
    const ticket = await prisma.ticket.create({
        data: {
          code: response.code,
          serviceTypeId: serviceType.id,
          positionInQueue: response.positionInQueue,
          createdAt: Date.now()
        }
    });

    return ({
      ticket: {
        id: ticket.id,
        code: ticket.code,
        service: {
          id: serviceType.id,
          tag: serviceType.tag,
          name: serviceType.name,
        },
        queueLength: response.queueLength,
        positionInQueue: response.positionInQueue,
        createdAt: ticket.createdAt
      }
    });
  }

  // return the service types available
  async getAvailableServices(): Promise<any[]> {
    return await prisma.serviceType.findMany({
      orderBy: {
        tag: 'asc'
      }
    });
  }

  //retrieve queue information for a specific service
  async getQueueInfo(serviceId: number) {
    const queueLength = await prisma.ticket.count({
      where: {
        serviceId,
        status: 'WAITING'
      }
    });

    return {
      serviceId,
      queueLength,
    };
  }
}