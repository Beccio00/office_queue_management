import { Router } from 'express';
import { TicketController } from '../controllers/getTicketController';

const router = Router();
const ticketController = new TicketController();

router.post('/', (req, res, next) => ticketController.createTicket(req, res, next));

router.put('/:ticketCode/complete', (req, res, next) => ticketController.completeTicket(req, res, next));

export default router;