import prisma from './prismaClient';
import { EnqueueResult } from '../interfaces/enqueue';
import { NotFoundError } from '../interfaces/errors/NotFoundError';
import { InternalServerError } from '../interfaces/errors/InternalServerError';
import { AppError } from '../interfaces/errors/AppError';

class QueueManager {

  private static instance: QueueManager | null = null;
  private queues: Map<number, string[]> = new Map();
  private counterServicesCache: Map<number, Array<{
    serviceId: number;
    avgServiceTime: number;
  }>> = new Map();

  private constructor() {}

  private async ensureQueueLoaded(serviceId: number) {
    try {
      if (this.queues.has(serviceId)) return;
      const waitingTickets: Array<{ code: string }> = await prisma.ticket.findMany({
        where: {
          serviceId,
          status: 'WAITING'
        },
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          code: true
        }
      });
      this.queues.set(serviceId, waitingTickets.map(t => t.code));
    } catch (error) {
      throw new InternalServerError('Failed to load waiting tickets');
    }
  }

  private async loadCounterServices(counterId: number) {
    if (this.counterServicesCache.has(counterId)) {
      return this.counterServicesCache.get(counterId)!;
    }

    const counterServices = await prisma.counterService.findMany({
      where: { counterId },
      include: { service: true }
    });

    const services = counterServices.map((cs: any) => ({
      serviceId: cs.serviceId,
      avgServiceTime: cs.service.avgServiceTime
    }));

    this.counterServicesCache.set(counterId, services);
    return services;
  }

  private async ensureCounterQueuesLoaded(counterId: number) {
    const services = await this.loadCounterServices(counterId);
    for (const service of services) {
      await this.ensureQueueLoaded(service.serviceId);
    }
  }

  async getNextTicketForCounter(counterId: number): Promise<string | null> {
    try {
      await this.ensureCounterQueuesLoaded(counterId);
      
      const services = await this.loadCounterServices(counterId);
      
      if (services.length === 0) {
        throw new NotFoundError('Counter has no assigned services');
      }
      
      const queueInfo = services.map((s: any) => ({
        serviceId: s.serviceId,
        avgServiceTime: s.avgServiceTime,
        length: (this.queues.get(s.serviceId) || []).length
      }));
      
      const nonEmpty = queueInfo.filter((q: any) => q.length > 0);
      
      if (nonEmpty.length === 0) {
        return null;
      }
      
      const selected = nonEmpty.sort((a:any, b:any) => {
        if (b.length !== a.length) {
          return b.length - a.length;
        }
        return a.avgServiceTime - b.avgServiceTime;
      })[0];
      
      const queue = this.queues.get(selected.serviceId)!;
      const ticketCode = queue.shift()!;
      
      await prisma.ticket.update({
        where: { code: ticketCode },
        data: {
          status: 'CALLED',
          counterId: counterId,
          calledAt: new Date()
        }
      });
      
      return ticketCode;
      
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError('Failed to get next ticket for counter');
    }
  }

  async getTicketByCode(ticketCode: string) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { code: ticketCode },
        include: { service: true }
      });

      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }

      return ticket;
      
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError('Failed to get ticket');
    }
  }

  async completeTicket(ticketCode: string): Promise<void> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { code: ticketCode }
      });

      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }

      await prisma.ticket.update({
        where: { code: ticketCode },
        data: {
          status: 'SERVED',
          servedAt: new Date()
        }
      });
      
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError('Failed to complete ticket');
    }
  }

  async getQueueStatus(): Promise<Array<{
    serviceId: number;
    serviceTag: string;
    serviceName: string;
    queueLength: number;
  }>> {
    try {
      const services = await prisma.service.findMany({
        orderBy: { id: 'asc' }
      });

      const status = await Promise.all(
        services.map(async (service: any) => {
          await this.ensureQueueLoaded(service.id);
          const queue = this.queues.get(service.id) || [];
          
          return {
            serviceId: service.id,
            serviceTag: service.tag,
            serviceName: service.name,
            queueLength: queue.length
          };
        })
      );

      return status;
      
    } catch (error) {
      throw new InternalServerError('Failed to get queue status');
    }
  }

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  async enqueue(serviceId: number): Promise<EnqueueResult> {
    try {
      const serviceType = await prisma.service.findUnique({ 
          where: { id: serviceId } 
      });
      if (!serviceType) throw new NotFoundError('Service type not found');

      const ticketCode = await this.generateTicketCode(serviceType.tag);

      await prisma.ticket.create({
        data: {
          code: ticketCode,
          serviceId: serviceId,
          status: 'WAITING'
        }
      });

      await this.ensureQueueLoaded(serviceType.id);

      const queue = this.queues.get(serviceType.id) || [];
      const position = queue.length + 1;

      queue.push(ticketCode);
      this.queues.set(serviceType.id, queue);
      
      return ({
        code: ticketCode,
        positionInQueue: position,
        queueLength: queue.length
      });

    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError('Failed to enqueue ticket');
    } 
  }

  private async generateTicketCode(serviceTag: string): Promise<string> {
    try {
      const today = new Date();

      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const todayTicketsCount = await prisma.ticket.count({
        where: {
          service: {
            tag: serviceTag
          },
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      const sequenceNumber = (todayTicketsCount + 1).toString().padStart(3, '0');
      return `${serviceTag}-${sequenceNumber}`;
      
    } catch (error) {
      throw new InternalServerError('Failed to generate ticket code');
    }
  }

}

export const queueManager = QueueManager.getInstance();