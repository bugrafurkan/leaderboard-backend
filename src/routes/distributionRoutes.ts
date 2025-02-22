import { Router } from 'express';
import { distributionController } from '../controllers/distributionController';

export const distributionRouter = Router();

// POST /distribution/weekly
distributionRouter.post('/weekly', distributionController.distribute);
