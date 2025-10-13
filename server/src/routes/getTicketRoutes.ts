import { Router } from 'express';
import { TicketController } from '../controllers/getTicketController';

const router = Router();

//Singleton pattern for the controller
//to avoid multiple instances
const ticketController = new TicketController();

//POST /api/tickets - new ticket creation
router.post('/', (req, res) => ticketController.createTicket(req, res));

//GET /api/tickets/services - get all available services
router.get('/services', (req, res) => ticketController.getAvailableServices(req, res));


export default router;