import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3000',
  JWT_SECRET: process.env.JWT_SECRET || 'changeme',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',

  DB_HOST: process.env.DB_HOST || 'postgres-db',
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASS: process.env.DB_PASS || 'postgres',
  DB_NAME: process.env.DB_NAME || 'leaderboard_db',
  DB_ROLE: process.env.DB_ROLE || 'admin',
  SOCKET_SERVER_URL: process.env.SOCKET_SERVER_URL || 'http://localhost:3000',

  // Redis bağlantı bilgileri - hem tek URL hem de cluster node'ları destekliyor
  REDIS_URL: process.env.REDIS_URL || 'redis://redis-service:6379',
  REDIS_CLUSTER_NODES: process.env.REDIS_CLUSTER_NODES || 'redis://redis-cluster-0.redis-service:6379,redis://redis-cluster-1.redis-service:6379,redis://redis-cluster-2.redis-service:6379',

  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672',
  CRON_DISTRIBUTION_TIME: process.env.CRON_DISTRIBUTION_TIME || '0 23 * * 0'
};
