import prisma from './prismaClient';
import { CreateTicketRequest, CreateTicketResponse } from '../interfaces/getTicket';
import { queueManager } from './queueManager';
import { NotFoundError } from '../ErrorHandlers/NotFoundError';
import { ConflictError } from '../ErrorHandlers/ConflictError';
import { InternalServerError } from '../ErrorHandlers/InternalServerError';
import { AppError } from '../ErrorHandlers/AppError';

export class TicketService {

  // new ticket creation for a specific service
  async createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    const serviceId = request.serviceId;

    try {
      if (!serviceId) throw new NotFoundError('Service ID is required');

      const response = await queueManager.enqueue(serviceId);
      if (!response) throw new InternalServerError('Failed to enqueue ticket');

      // fetch serviceType info for the response
      const serviceType = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!serviceType) throw new NotFoundError('Service type not found');

      //salva su prisma il ticket
      const ticket = await prisma.ticket.create({
        data: {
          code: response.code,
          serviceId: serviceType.id
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
    } catch (err: any) {
      // se c'è una violazione del codice ticket univoco, lancia un ConflictError
      if (err?.code === 'P2002') {
        throw new ConflictError('Unique constraint violation');
      }
      // rilancia AppError già wrappati
      if (err instanceof AppError) throw err;
      // altrimenti wrap generico in un AppError
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
