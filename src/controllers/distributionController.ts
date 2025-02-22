// src/controllers/distributionController.ts
import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from '../services/leaderboardService';

export const distributionController = {
  distribute: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await leaderboardService.distributePrizes();
      res.status(200).json({
        message: 'Distribution completed successfully',
        result
      });
    } catch (error) {
      next(error);
    }
  }
};
