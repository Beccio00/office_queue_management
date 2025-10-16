import prisma from './prismaClient';
import { CreateTicketRequest, CreateTicketResponse } from '../interfaces/getTicket';
import { queueManager } from './queueManager';
import { NotFoundError } from '../interfaces/errors/NotFoundError';
import { ConflictError } from '../interfaces/errors/ConflictError';
import { InternalServerError } from '../interfaces/errors/InternalServerError';
import { AppError } from '../interfaces/errors/AppError';

export class TicketService {

  async createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    const serviceId = request.serviceId;

    try {
      if (!serviceId) throw new NotFoundError('Service ID is required');

      const response = await queueManager.enqueue(serviceId);
      if (!response) throw new InternalServerError('Failed to enqueue ticket');

      const serviceType = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!serviceType) throw new NotFoundError('Service type not found');

      const ticket = await prisma.ticket.findUnique({
        where: { code: response.code }
      });

      if (!ticket) throw new InternalServerError('Ticket created but not found');

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
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictError('Unique constraint violation');
      }
      if (err instanceof AppError) throw err;
      throw new InternalServerError('Failed to create ticket');
    }
  }


  // return the service types available
  async getAvailableServices(): Promise<any[]> {
    try {
      return await prisma.service.findMany({
        orderBy: {
          tag: 'asc'
        }
      });
    } catch (error) {
      throw new InternalServerError('Failed to fetch available services');
    }
  }

  // get service by tag
  async getServiceByTag(tag: string): Promise<any | null> {
    try {
      return await prisma.service.findUnique({
        where: { tag }
      });
    } catch (error) {
      throw new InternalServerError('Failed to fetch service by tag');
    }
  }

}
