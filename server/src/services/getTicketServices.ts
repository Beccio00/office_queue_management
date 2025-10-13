import { PrismaClient, ServiceType } from '@prisma/client';
import { CreateTicketRequest, CreateTicketResponse } from '../interfaces/getTicket';

const prisma = new PrismaClient();

export class TicketService {
  
  //new ticket creation for a specific service
  async createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    const { serviceId } = request;

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
        },
        queueLength: queueLength + 1, //+1 because of the ticket just created
        positionInQueue: queueLength + 1,
        createdAt: ticket.createdAt
      },
      queueInfo: {
        serviceId: service.id,
        queueLength: queueLength + 1,
      }
    };
  }

  //generates a unique ticket code based on the service tag
  private async generateTicketCode(serviceTag: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); //extract only YYYYMMDD

    //count today's tickets for this service
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayTicketsCount = await prisma.ticket.count({
      where: {
        serviceType: {
          tag: serviceTag
        },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    //format: serviceTag-YYYYMMDD-sequentialNumber
    //sequentialNumber will be padded with 3 digits
    //e.g. A-20231005-001
    const sequenceNumber = (todayTicketsCount + 1).toString().padStart(3, '0');
    return `${serviceTag}-${dateStr}-${sequenceNumber}`;
  }

  //return the service types available
  async getAvailableServices(): Promise<ServiceType[]> {
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