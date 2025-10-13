import { Request, Response } from 'express';
import { TicketService } from '../services/getTicketServices';
import { CreateTicketRequest } from '../interfaces/getTicket';

//Singleton pattern for the service
//to avoid multiple instances and database connections
const ticketService = new TicketService();

export class TicketController {

  async createTicket(req: Request, res: Response) {
    try {
      const { serviceType, serviceId } = req.body;
      
      // Handle both serviceType (tag) and serviceId formats
      let request: CreateTicketRequest;
      
      if (serviceType) {
        // Front-end sends serviceType (tag), need to convert to serviceId
        const service = await ticketService.getServiceByTag(serviceType);
        if (!service) {
          return res.status(400).json({
            success: false,
            error: 'Invalid service type'
          });
        }
        request = { serviceId: service.id };
      } else if (serviceId) {
        request = { serviceId };
      } else {
        return res.status(400).json({
          success: false,
          error: 'serviceType or serviceId is required'
        });
      }
      
      const result = await ticketService.createTicket(request);
      
      // Format response to match front-end expectations
      res.status(201).json({
        id: result.ticket.code,
        serviceType: result.ticket.service.tag,
        timestamp: result.ticket.createdAt,
        status: 'waiting',
        queuePosition: result.ticket.positionInQueue
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
      
      // Format response to match front-end expectations
      const response = services.map(service => ({
        id: service.id,
        tag: service.tag,
        name: service.name,
        serviceTime: service.avgServiceTime
      }));

      res.json(response);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available services'
      });
    }
  }
}