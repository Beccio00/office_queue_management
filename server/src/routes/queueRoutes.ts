import { Router, Request, Response, NextFunction } from 'express';
import { queueManager } from '../services/queueManager';
import { AppError } from '../interfaces/errors/AppError';

const router = Router();

router.post('/next', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { counterId } = req.body;

    if (!counterId || typeof counterId !== 'number') {
      return res.status(400).json({ 
        error: 'counterId is required and must be a number' 
      });
    }

    const ticketCode = await queueManager.getNextTicketForCounter(counterId);

    if (!ticketCode) {
      return res.status(404).json({ 
        error: 'No customers in queue' 
      });
    }

    const ticket = await queueManager.getTicketByCode(ticketCode);

    res.json({
      code: ticket.code,
      id: ticket.id,
      serviceType: ticket.service.tag,
      timestamp: ticket.calledAt
    });

  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
});

router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await queueManager.getQueueStatus();

    res.json({
      data: status.map(s => ({
        serviceTag: s.serviceTag,
        serviceName: s.serviceName,
        queueLength: s.queueLength
      }))
    });

  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
