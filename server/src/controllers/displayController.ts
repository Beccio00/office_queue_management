import { Request, Response } from 'express';
import { DisplayService } from '../services/displayService';

const displayService = new DisplayService();

export class DisplayController {
  
  /**
   * GET /api/display/status
   * Get current display status for public display screens
   */
  async getDisplayStatus(req: Request, res: Response) {
    try {
      const status = await displayService.getDisplayStatus();
      
      res.status(200).json(status);

    } catch (error) {
      console.error('Error in getDisplayStatus:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

