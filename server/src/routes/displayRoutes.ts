import { Router } from 'express';
import { DisplayController } from '../controllers/displayController';

const router = Router();
const displayController = new DisplayController();

// GET /api/display/status - Get display status
router.get('/status', (req, res) => displayController.getDisplayStatus(req, res));

export default router;

