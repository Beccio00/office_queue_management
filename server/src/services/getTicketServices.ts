import { PrismaClient, ServiceType } from '@prisma/client';
import { CreateTicketRequest, CreateTicketResponse } from '../interfaces/getTicket';

const prisma = new PrismaClient();

export class TicketService {
  
  //new ticket creation for a specific service
  async createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    const { serviceTypeId } = request;

    //check if the service type exists
    const serviceType = await prisma.serviceType.findUnique({
      where: { id: serviceTypeId }
    });

    if (!serviceType) {
      throw new Error('Service type not found');
    }

    //compute the next ticket code
    const ticketCode = await this.generateTicketCode(serviceType.tag);

    //find the current queue length
    const queueLength = await prisma.ticket.count({
      where: {
        serviceTypeId,
        status: 'WAITING'
      }
    });

    //ticket creation
    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        serviceTypeId,
        status: 'WAITING'
      },
      include: {
        serviceType: true
      }
    });

    return {
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        serviceType: {
          id: ticket.serviceType.id,
          tag: ticket.serviceType.tag,
          name: ticket.serviceType.name,
        },
        queueLength: queueLength + 1, //+1 because of the ticket just created
        positionInQueue: queueLength + 1,
        createdAt: ticket.createdAt
      },
      queueInfo: {
        serviceTypeId,
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
  async getQueueInfo(serviceTypeId: string) {
    const queueLength = await prisma.ticket.count({
      where: {
        serviceTypeId,
        status: 'WAITING'
      }
    });

    return {
      serviceTypeId,
      queueLength,
    };
  }
}