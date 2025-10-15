import { Request, Response, NextFunction } from 'express';
import { TicketService } from '../services/getTicketServices';
import { CreateTicketRequest } from '../interfaces/getTicket';
import { queueManager } from '../services/queueManager';

const ticketService = new TicketService();

export class TicketController {

  async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const request: CreateTicketRequest = {
        serviceId: req.body.serviceId || null,
      };

      const result = await ticketService.createTicket(request);

      res.status(201).json({
        id: result.ticket.code,
        serviceType: result.ticket.service.tag,
        createdAt: result.ticket.createdAt,
        status: 'WAITING',
        queuePosition: result.ticket.positionInQueue
      });

    } catch (error) {
      next(error as any);
    }
  }

  async getAvailableServices(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ticketService.getAvailableServices();
      res.json(result.map(service => ({
        id: service.id,
        tag: service.tag,
        name: service.name,
        avgServiceTime: service.avgServiceTime
      })));
    } catch (error) {
      next(error as any);
    }
  }

  async completeTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketCode } = req.params;
      
      await queueManager.completeTicket(ticketCode);
      
      res.json({ 
        success: true,
        message: 'Ticket completed successfully' 
      });
    } catch (error) {
      next(error as any);
    }
  }
}