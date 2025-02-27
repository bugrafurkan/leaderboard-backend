import { createClient } from 'redis';
import { ENV } from './env';
import { trackRedisOperation } from '../middlewares/metricsMiddleware';

export const redisClient = createClient({
  url: ENV.REDIS_URL || 'redis://redis-standalone:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export async function connectRedis(): Promise<void>  {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Redis Client Connected');
  }
}
