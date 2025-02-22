import { Request, Response, NextFunction } from 'express';
import { playerService } from '../services/playerService';
import { sendCreateMessage } from '../config/queue';

export const playerController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try{
      const  { name, country } = req.body;
      const player = await playerService.registerPlayer(name, country);
      res.status(201).json(player);
    }catch(error){
      next(error);
    }
  },
  async getPlayer(req: Request, res: Response, next: NextFunction) : Promise<void> {
    try {
      const playerId = Number(req.params.playerId);
      const player = await playerService.getPlayer(playerId);
      if (!player) {
        res.status(404).json({ error: "Player not found" });
        return;
      }
      res.json(player);
    }catch(error){
      next(error);
    }
  },
  async createPlayerHandler(req: Request, res: Response) {
    const { name, country } = req.body;
    if (!name || !country) {
      return res.status(400).json({ error: 'Missing name or country' });
    }

    const payload = { name, country };
    sendCreateMessage(name, country);
    return res.json({ message: 'Creating player in background' });
  }
};
