import prisma from './prismaClient';
import { CreateTicketRequest, CreateTicketResponse } from '../interfaces/getTicket';
import { queueManager } from './queueManager';

export class TicketService {

  // new ticket creation for a specific service
  async createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {

    const { serviceId } = request;

    const response = await queueManager.enqueue(serviceId);
    if (!response) throw new Error('Failed to enqueue ticket');

    // fetch service info for the response
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new Error('Service type not found');

    //salva su prisma il ticket
    const ticket = await prisma.ticket.create({
        data: {
          code: response.code,
          serviceId: service.id,
          status: 'WAITING',
          createdAt: new Date()
        }
    });

    return ({
      ticket: {
        id: ticket.id,
        code: ticket.code,
        service: {
          id: service.id,
          tag: service.tag,
          name: service.name,
        },
        queueLength: response.queueLength,
        positionInQueue: response.positionInQueue,
        createdAt: ticket.createdAt
      }
    });
  }

  // return the service types available
  async getAvailableServices(): Promise<any[]> {
    return await prisma.service.findMany({
      orderBy: {
        tag: 'asc'
      }
    });
  }

  // get service by tag
  async getServiceByTag(tag: string): Promise<any | null> {
    return await prisma.service.findUnique({
      where: { tag }
    });
  }

}