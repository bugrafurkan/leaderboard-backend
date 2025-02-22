import express from 'express';
import cors from 'cors';
import { router as mainRouter } from './routes';
import { setupSwaggerUi } from './config/swagger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger
setupSwaggerUi(app);

// Routes
app.use('/api/v1', mainRouter);

// Global error handler
//app.use(errorHandler);

export default app;
