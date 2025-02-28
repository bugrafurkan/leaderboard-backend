import express from 'express';
import cors from 'cors';
import { router as mainRouter } from './routes';
import { setupSwaggerUi } from './config/swagger';

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://leaderboard-frontend-eight.vercel.app',
    'https://leaderboard-frontend-dgyr60wr2-bugrafurkans-projects.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Swagger
setupSwaggerUi(app);

// Routes
app.use('/api/v1', mainRouter);

// Global error handler
//app.use(errorHandler);

export default app;
