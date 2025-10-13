import { Router } from 'express';
import { QueueController } from '../controllers/queueController';

const router = Router();
const queueController = new QueueController();

// POST /api/queue/next - Call next customer
router.post('/next', (req, res) => queueController.callNextCustomer(req, res));

// GET /api/queue/status - Get queue status
router.get('/status', (req, res) => queueController.getQueueStatus(req, res));

export default router;

