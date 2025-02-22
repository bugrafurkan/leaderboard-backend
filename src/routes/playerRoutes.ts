import { Router } from 'express';
import { playerController } from '../controllers/playerController';
import { authMiddleware } from '../middlewares/authMiddleware';

export const playerRouter = Router();

// Kayıt (public)
playerRouter.post('/', playerController.register);

// Profil bilgisi (korumalı örnek: JWT gerekir)
playerRouter.get('/:id', authMiddleware, playerController.getPlayer);
