import amqplib from 'amqplib';
import { connectRedis} from "./config/redis";
import { testDBConnection } from './config/database';
import { workerService } from './services/workerService';
import { socketIO} from "./index";

async function startWorker(){
  console.log('Worker starting...');
  await connectRedis();
  await testDBConnection();

  const conn = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672');
  const channel = await conn.createChannel();
  await channel.assertQueue('earn-queue');
  await channel.assertQueue('create-player-queue');

  // earn-queue consumer
  await channel.consume('earn-queue', async (msg) => {
    if (!msg) return;
    try {
      const {playerId, amount} = JSON.parse(msg.content.toString());
      console.log(`Worker received: playerId=${playerId}, amount=${amount}`);

      const newRank = await workerService.earn(playerId, amount);
      if (newRank !== null && newRank < 100) {
        console.log(`Player ${playerId} is in top 100, rank=${newRank}`);
        if (socketIO) {
          socketIO.emit('leaderboard-update', {
            playerId,
            newRank
          });
        }
      }
      channel.ack(msg);
    } catch (err) {
      console.log('Error processing earn msg:', err);
      channel.ack(msg);
    }
  });

  // create-player-queue consumer
  await channel.consume('create-player-queue', async (msg) => {
    if (!msg) return;
    try {
      const {name, country} = JSON.parse(msg.content.toString());
      const newPlayer = await workerService.createPlayer(name, country);
      console.log('Created new player:', newPlayer);
      channel.ack(msg);
    } catch (err) {
      console.error('Error create-player msg:', err);
      channel.ack(msg);
    }
  });

  console.log('Worker is consuming earn-queue...');
}

startWorker().catch((err) => console.error('Worker init error:', err));
