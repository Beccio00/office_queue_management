import prisma from './prismaClient';
import { NextCustomerResponse, CompleteTicketResponse } from '../interfaces/queue';
import { queueManager } from './queueManager';

export class QueueService {
  
  /**
   * Calls the next customer in queue for a specific counter
   * This method finds the oldest waiting ticket that matches the counter's services
   */
  async callNextCustomer(counterId: number): Promise<NextCustomerResponse> {
    try {
      // Get counter information and its available services
      const counter = await prisma.counter.findUnique({
        where: { id: counterId },
        include: {
          services: {
            include: {
              service: true
            }
          }
        }
      });

      if (!counter) {
        return {
          success: false,
          message: 'Counter not found'
        };
      }

      if (!counter.isActive) {
        return {
          success: false,
          message: 'Counter is not active'
        };
      }

      // Get service IDs that this counter can handle
      const serviceIds = counter.services.map(cs => cs.serviceId);

      if (serviceIds.length === 0) {
        return {
          success: false,
          message: 'Counter has no assigned services'
        };
      }

      // Find the oldest waiting ticket for any of the counter's services
      const nextTicket = await prisma.ticket.findFirst({
        where: {
          serviceId: { in: serviceIds },
          status: 'WAITING'
        },
        orderBy: {
          createdAt: 'asc'
        },
        include: {
          service: true
        }
      });

      if (!nextTicket) {
        return {
          success: false,
          message: 'No customers waiting in queue'
        };
      }

      // Update ticket status to CALLED and assign to counter
      const updatedTicket = await prisma.ticket.update({
        where: { id: nextTicket.id },
        data: {
          status: 'CALLED',
          counterId: counterId,
          calledAt: new Date()
        },
        include: {
          service: true
        }
      });

      return {
        success: true,
        ticket: {
          id: updatedTicket.id.toString(),
          code: updatedTicket.code,
          serviceType: updatedTicket.service.tag,
          timestamp: updatedTicket.calledAt || updatedTicket.createdAt,
          status: 'serving'
        }
      };

    } catch (error) {
      console.error('Error calling next customer:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Marks a ticket as completed
   */
  async completeTicket(ticketCode: string): Promise<CompleteTicketResponse> {
    try {
      // Find ticket by code
      const ticket = await prisma.ticket.findUnique({
        where: { code: ticketCode }
      });

      if (!ticket) {
        return {
          success: false,
          message: 'Ticket not found'
        };
      }

      if (ticket.status === 'COMPLETED') {
        return {
          success: false,
          message: 'Ticket already completed'
        };
      }

      // Update ticket status to COMPLETED
      const completedTicket = await prisma.ticket.update({
        where: { code: ticketCode },
        data: {
          status: 'COMPLETED',
          servedAt: new Date()
        }
      });

      return {
        success: true,
        ticket: {
          id: completedTicket.id.toString(),
          code: completedTicket.code,
          status: 'completed',
          completionTime: completedTicket.servedAt || new Date()
        }
      };

    } catch (error) {
      console.error('Error completing ticket:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Gets the current queue status for all services
   */
  async getQueueStatus(): Promise<any> {
    try {
      const services = await prisma.service.findMany({
        include: {
          tickets: {
            where: {
              status: 'WAITING'
            }
          }
        }
      });

      return services.map(service => ({
        serviceId: service.id,
        serviceTag: service.tag,
        serviceName: service.name,
        queueLength: service.tickets.length
      }));

    } catch (error) {
      console.error('Error getting queue status:', error);
      throw error;
    }
  }
}

