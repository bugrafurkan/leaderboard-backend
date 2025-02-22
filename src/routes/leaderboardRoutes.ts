import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboardController';
import { authMiddleware } from '../middlewares/authMiddleware';

export const leaderboardRouter = Router();

// GET /leaderboard => public
leaderboardRouter.get('/', leaderboardController.getLeaderboard);

// POST /leaderboard/earn
leaderboardRouter.post('/earn', leaderboardController.earnQueue);

/*
* // POST /leaderboard/earn
leaderboardRouter.post('/earn', leaderboardController.earn);
* */

// POST /leaderboard/distribution => admin testi (örnek), korumalı
leaderboardRouter.post('/distribution', authMiddleware, leaderboardController.distribute);
