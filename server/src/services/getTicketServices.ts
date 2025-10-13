import prisma from './prismaClient';
import { CreateTicketRequest, CreateTicketResponse } from '../interfaces/getTicket';
import { queueManager } from './queueManager';

export class TicketService {

  // new ticket creation for a specific service
  async createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    const { serviceId } = request;

<<<<<<< HEAD
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
=======
    //check if the service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    //compute the next ticket code
    const ticketCode = await this.generateTicketCode(service.tag);

    //find the current queue length
    const queueLength = await prisma.ticket.count({
      where: {
        serviceId: service.id,
        status: 'WAITING'
      }
    });

    //ticket creation
    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        serviceId: service.id,
        status: 'WAITING'
      },
      include: {
        service: true
      }
    });

    return {
      ticket: {
        id: ticket.id,
        code: ticket.code,
        service: {
          id: ticket.service.id,
          tag: ticket.service.tag,
          name: ticket.service.name,
>>>>>>> getTicket
        },
        queueLength: enq.queueLength,
        positionInQueue: enq.positionInQueue,
        createdAt: enq.createdAt
      },
      queueInfo: {
<<<<<<< HEAD
        serviceTypeId,
        queueLength: enq.queueLength,
=======
        serviceId: service.id,
        queueLength: queueLength + 1,
>>>>>>> getTicket
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

<<<<<<< HEAD
  // retrieve queue information for a specific service
  async getQueueInfo(serviceTypeId: string) {
    const queueLength = await queueManager.getQueueLength(serviceTypeId);
=======
  //retrieve queue information for a specific service
  async getQueueInfo(serviceId: number) {
    const queueLength = await prisma.ticket.count({
      where: {
        serviceId,
        status: 'WAITING'
      }
    });
>>>>>>> getTicket

    return {
      serviceId,
      queueLength,
    };
  }
}