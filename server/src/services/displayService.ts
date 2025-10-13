import prisma from './prismaClient';

export class DisplayService {
  
  /**
   * Get current display information including:
   * - Currently serving ticket
   * - Next tickets in queue
   * - Queue status for all services
   * - Counter information
   */
  async getDisplayStatus(): Promise<any> {
    try {
      // Get the most recently called ticket (currently being served)
      const currentTicket = await prisma.ticket.findFirst({
        where: {
          status: 'CALLED'
        },
        orderBy: {
          calledAt: 'desc'
        },
        include: {
          service: true,
          counter: true
        }
      });

      // Get next 4 waiting tickets
      const nextTickets = await prisma.ticket.findMany({
        where: {
          status: 'WAITING'
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 4,
        include: {
          service: true
        }
      });

      // Get queue status for all services
      const services = await prisma.service.findMany({
        include: {
          tickets: {
            where: {
              status: 'WAITING'
            }
          }
        }
      });

      const queueStatus = services.map(service => ({
        serviceType: service.tag,
        length: service.tickets.length,
        estimatedWaitTime: service.tickets.length * service.avgServiceTime
      }));

      // Get all counters
      const counters = await prisma.counter.findMany({
        include: {
          services: {
            include: {
              service: true
            }
          },
          tickets: {
            where: {
              status: 'CALLED'
            },
            orderBy: {
              calledAt: 'desc'
            },
            take: 1,
            include: {
              service: true
            }
          }
        }
      });

      // Format response
      return {
        currentTicket: currentTicket ? {
          id: currentTicket.code,
          serviceType: currentTicket.service.tag,
          timestamp: currentTicket.calledAt || currentTicket.createdAt,
          status: 'serving',
          counterId: currentTicket.counterId
        } : null,
        
        nextTickets: nextTickets.map(ticket => ({
          id: ticket.code,
          serviceType: ticket.service.tag,
          timestamp: ticket.createdAt,
          status: 'waiting'
        })),
        
        queueStatus: queueStatus,
        
        counters: counters.map(counter => ({
          id: counter.id,
          number: counter.id,
          availableServices: counter.services.map(cs => cs.service.tag),
          currentTicket: counter.tickets.length > 0 ? counter.tickets[0].code : null,
          status: counter.isActive ? (counter.tickets.length > 0 ? 'busy' : 'available') : 'offline'
        })),
        
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error getting display status:', error);
      throw error;
    }
  }
}

