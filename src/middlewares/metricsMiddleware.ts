import express from 'express';
import client from 'prom-client';

// Metrics Registry
const register = new client.Registry();


client.collectDefaultMetrics({ register });

// HTTP requests metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request time histogram',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

// RabbitMQ queue metrics
const rabbitMQQueueSize = new client.Gauge({
  name: 'rabbitmq_queue_size',
  help: 'RabbitMQ queue messages ',
  labelNames: ['queue_name']
});

// Redis requests metrics
const redisOperations = new client.Counter({
  name: 'redis_operations_total',
  help: 'Redis req counter',
  labelNames: ['operation', 'status']
});

// Leaderboard special metrics
const registeredPlayersTotal = new client.Counter({
  name: 'leaderboard_registered_players_total',
  help: 'total player'
});

const distributedMoneyTotal = new client.Counter({
  name: 'leaderboard_distributed_money_total',
  help: 'Dağıtılan total para prizes'
});


register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(rabbitMQQueueSize);
register.registerMetric(redisOperations);
register.registerMetric(registeredPlayersTotal);
register.registerMetric(distributedMoneyTotal);


export const incrementPlayerCount = () => {
  registeredPlayersTotal.inc();
};

export const incrementDistributedMoney = (amount: number) => {
  distributedMoneyTotal.inc(amount);
};

export const updateQueueSize = (queueName: string, size: number) => {
  rabbitMQQueueSize.set({ queue_name: queueName }, size);
};

export const trackRedisOperation = (operation: string, status: 'success' | 'error') => {
  redisOperations.inc({ operation, status });
};

// HTTP metrics middleware
export const metricsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = process.hrtime();


  res.on('finish', () => {
    const end = process.hrtime(start);
    const duration = Math.round(end[0] * 1000 + end[1] / 1000000) / 1000;


    const route = req.route ? req.baseUrl + req.route.path : req.path;

    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode
      },
      duration
    );
  });

  next();
};

// Metrics endpoint
export const metricsEndpoint = async (req: express.Request, res: express.Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export default {
  metricsMiddleware,
  metricsEndpoint,
  incrementPlayerCount,
  incrementDistributedMoney,
  updateQueueSize,
  trackRedisOperation
};
