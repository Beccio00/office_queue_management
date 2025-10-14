import { Router } from 'express';
import { TicketController } from '../controllers/getTicketController';
import { QueueController } from '../controllers/queueController';

const router = Router();

//Singleton pattern for the controllers
//to avoid multiple instances
const ticketController = new TicketController();
const queueController = new QueueController();

//POST /api/tickets/request - new ticket creation
router.post('/request', (req, res) => ticketController.createTicket(req, res));

//POST /api/tickets - new ticket creation (alternative endpoint)
router.post('/', (req, res) => ticketController.createTicket(req, res));

//PUT /api/tickets/:code/complete - complete ticket service
router.put('/:code/complete', (req, res) => queueController.completeTicket(req, res));

export default router;