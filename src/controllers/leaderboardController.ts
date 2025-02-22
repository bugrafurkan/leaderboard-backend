import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from "../services/leaderboardService";
import { socketIO } from '../index';
import { sendEarnMessage } from '../config/queue';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const leaderboardController = {
  /*
  * async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { searchPlayerId } = req.query;
      const data = await leaderboardService.getLeaderboard(
        searchPlayerId ? Number(searchPlayerId) : undefined
      );
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },
  *
  * */


  // GET /leaderboard?searchPlayerId=xxx
   getLeaderboard: async(
     req: Request,
     res: Response,
     next: NextFunction):Promise<void> => {
    try {
      const { searchPlayerId } = req.query;
      let searchId: number | undefined;
      if (searchPlayerId) {
        searchId = parseInt(searchPlayerId as string, 10);
      }
      const result = await leaderboardService.getLeaderboard(searchId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },


  // POST /leaderboard/earn
  earn: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { playerId, amount } = req.body;
      if (typeof playerId !== 'number' || typeof amount !== 'number') {
        res.status(400).json({ error: 'playerId and amount must be numbers' });
      }
      const rank = await leaderboardService.earn(playerId, amount);
      // 0-based rank => rank=0 => leader
      // rank < 100 => Player could be entered top 100 or updated position
      if (rank < 100) {
        socketIO.emit('leaderboard-update', {
          playerId,
          rank,
          message: 'Player entered top 100'
        });
      }
      res.status(200).json({ message: 'Score updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  earnQueue:async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
      const { playerId, amount } = req.body;
      if (!playerId || !amount) {
         res.status(400).json({ error: 'playerId & amount required' });
      }
      sendEarnMessage(Number(playerId), Number(amount));
       res.status(200).json({ message: 'Earn request queued' });
    } catch (err) {
      next(err);
    }
  },


  async distribute(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaderboardService.distributePrizes();
      res.status(200).json({ message: 'Distribution completed', result });
    } catch (err) {
      next(err);
    }
  }
};
