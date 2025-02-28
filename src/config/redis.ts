import {createClient, createCluster} from 'redis';
import { ENV } from './env';

// Redis instance
export const redisClient = createClient({
  url: ENV.REDIS_URL
});

// Redis Cluster
export const redisCluster = createCluster({
  rootNodes: ENV.REDIS_CLUSTER_NODES.split(',').map(url => {
    return { url }
  })
});

// Kullanıma göre doğru olanı seçin
const redis = ENV.REDIS_CLUSTER_NODES ? redisCluster : redisClient;

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export async function connectRedis(): Promise<void>  {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Redis Client Connected');
  }
}
