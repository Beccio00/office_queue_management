import { Request, Response } from 'express';
import { QueueService } from '../services/queueService';
import { NextCustomerRequest } from '../interfaces/queue';

const queueService = new QueueService();

export class QueueController {
  
  /**
   * POST /api/queue/next
   * Calls the next customer in queue for a specific counter
   */
  async callNextCustomer(req: Request, res: Response) {
    try {
      const { counterId }: NextCustomerRequest = req.body;

      if (!counterId) {
        return res.status(400).json({
          success: false,
          error: 'Counter ID is required'
        });
      }

      const result = await queueService.callNextCustomer(counterId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result.ticket);

    } catch (error) {
      console.error('Error in callNextCustomer:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /api/tickets/:code/complete
   * Marks a ticket as completed
   */
  async completeTicket(req: Request, res: Response) {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Ticket code is required'
        });
      }

      const result = await queueService.completeTicket(code);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result.ticket);

    } catch (error) {
      console.error('Error in completeTicket:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/queue/status
   * Gets the current queue status for all services
   */
  async getQueueStatus(req: Request, res: Response) {
    try {
      const status = await queueService.getQueueStatus();
      
      res.status(200).json({
        success: true,
        data: status
      });

    } catch (error) {
      console.error('Error in getQueueStatus:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

