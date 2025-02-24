import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { ENV } from './config/env';
import { connectRedis } from './config/redis';
import { initQueue } from './config/queue';
import { testDBConnection, initializeDatabase } from './config/database';
import cron from 'node-cron';
import { leaderboardService } from './services/leaderboardService';
import { playerRepository} from "./repositories/playerRepository";

const PORT = ENV.PORT || 3000;

export let socketIO: SocketIOServer;

async function startServer() {
  await initializeDatabase();
  await testDBConnection();
  await connectRedis();
  await initQueue();
  //await playerRepository.createTestDb();

  const httpServer = createServer(app);

  socketIO = new SocketIOServer(httpServer, {
    cors: {
      origin: '*'
    }
  });

  socketIO.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} - Env: ${ENV.NODE_ENV}`);
  });

  // Trigger the reward distribution every Sunday at 23:59.
  cron.schedule('59 23 * * 0', async () => {
    console.log('Cron: Starting weekly prize distribution...');
    try {
      const result = await leaderboardService.distributePrizes();
      console.log('Weekly distribution result:', result);
    } catch (error) {
      console.error('Error in weekly distribution cron:', error);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
