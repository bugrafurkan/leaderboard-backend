import express from 'express';
import cors from 'cors';
import { router as mainRouter } from './routes';
import { setupSwaggerUi } from './config/swagger';
import { metricsMiddleware, metricsEndpoint } from './middlewares/metricsMiddleware';


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger
setupSwaggerUi(app);

// Routes
app.use('/api/v1', mainRouter);
app.use(metricsMiddleware);
app.get('/metrics', metricsEndpoint);

// Global error handler
//app.use(errorHandler);

export default app;
