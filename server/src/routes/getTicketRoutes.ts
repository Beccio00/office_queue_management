import { Router } from 'express';
import { TicketController } from '../controllers/getTicketController';

const router = Router();
const ticketController = new TicketController();

//POST /api/tickets - new ticket creation
router.post('/', (req, res, next) => ticketController.createTicket(req, res, next));

export default router;