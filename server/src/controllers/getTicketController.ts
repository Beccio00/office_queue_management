import { Request, Response } from 'express';
import { TicketService } from '../services/getTicketServices';
import { CreateTicketRequest } from '../interfaces/getTicket';

//Singleton pattern for the service
//to avoid multiple instances and database connections
const ticketService = new TicketService();

export class TicketController {

  async createTicket(req: Request, res: Response) {
    try {
      const request: CreateTicketRequest = req.body;
      
      const result = await ticketService.createTicket(request);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAvailableServices(req: Request, res: Response) {
    try {
      const services = await ticketService.getAvailableServices();
      
      const response = services.map(service => ({
        id: service.id,
        tag: service.tag,
        name: service.name
      }));

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available services'
      });
    }
  }
}