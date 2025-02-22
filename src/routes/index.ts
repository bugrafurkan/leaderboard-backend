import { Router } from 'express';
import { playerRouter } from './playerRoutes';
import { leaderboardRouter } from './leaderboardRoutes';
import { distributionRouter } from './distributionRoutes';
import { pdfController } from '../controllers/pdfController';
import { authController } from '../controllers/authController';

export const router = Router();

// Basit test
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Auth route
router.post('/auth/login', authController.login);

// Player routes
router.use('/players', playerRouter);

// Leaderboard routes
router.use('/leaderboard', leaderboardRouter);

// Distribution routes
router.use('/distribution', distributionRouter);

// PDF endpoint
// GET /pdf/leaderboard => Download leaderboard PDF
router.get('/pdf/leaderboard', pdfController.getLeaderboardPDF);
