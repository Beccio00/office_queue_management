import { Router } from 'express';
import { TicketController } from '../controllers/getTicketController';

const router = Router();
const ticketController = new TicketController();

// GET /api/services - get all available services
router.get('/', (req, res) => ticketController.getAvailableServices(req, res));

export default router;

