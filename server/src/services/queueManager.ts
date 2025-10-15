import prisma from './prismaClient';
import { EnqueueResult } from '../interfaces/enqueue';
import { NotFoundError } from '../interfaces/errors/NotFoundError';
import { InternalServerError } from '../interfaces/errors/InternalServerError';
import { AppError } from '../interfaces/errors/AppError';

class QueueManager {

  private static instance: QueueManager | null = null;
  private queues: Map<number, string[]> = new Map();

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