import { Router } from 'express';
import { TicketController } from '../controllers/getTicketController';

const router = Router();
const ticketController = new TicketController();

// api/tickets
router.post('/', (req, res, next) => ticketController.createTicket(req, res, next));

// api/tickets/:ticketCode/complete
router.put('/:ticketCode/complete', (req, res, next) => ticketController.completeTicket(req, res, next));

export default router;