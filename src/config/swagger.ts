import { Express } from "express";
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  version: '1.0',
  info: {
    version: '1.0.0',
    title: 'Leaderboard API'
  },
  paths: {
    '/api/v1/leaderboard': {
      get: {
        summary: 'Get leaderboard',
        responses: {
          '200': { description: 'OK' }
        }
      }
    }
    // Diğer endpointlerin tanımları vb.
  }
};

export function setupSwaggerUi(app: Express) {
  app.use('/api-docs' , swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
