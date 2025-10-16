import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaClient';
import { AppError } from '../interfaces/errors/AppError';
import { NotFoundError } from '../interfaces/errors/NotFoundError';

const router = Router();

router.get('/:counterId/services', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const counterId = parseInt(req.params.counterId);

    if (isNaN(counterId)) {
      return res.status(400).json({ error: 'Invalid counter ID' });
    }

    const counter = await prisma.counter.findUnique({
      where: { id: counterId }
    });

    if (!counter) {
      throw new NotFoundError('Counter not found');
    }

    const counterServices = await prisma.counterService.findMany({
      where: { counterId },
      include: { 
        service: true 
      }
    });

    const services = counterServices.map((cs:any) => ({
      id: cs.service.id,
      tag: cs.service.tag,
      name: cs.service.name,
      avgServiceTime: cs.service.avgServiceTime
    }));

    res.json(services);

  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
