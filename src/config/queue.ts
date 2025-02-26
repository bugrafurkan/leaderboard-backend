import amqplib from 'amqplib';

let channel: amqplib.Channel;

export async function initQueue(): Promise<void> {
  console.log("Initializing queue...");
  console.log('Connecting to RabbitMQ...');
  const conn = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://leaderboard-rabbitmq:5672');
  channel = await conn.createChannel();
  await channel.assertQueue('earn-queue');
  console.log('RabbitMQ channel ready.');
}

export function sendEarnMessage(playerId: number, amount: number) {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  const payload = { playerId, amount };
  channel.sendToQueue('earn-queue', Buffer.from(JSON.stringify(payload)));
}

export function sendCreateMessage(name: string, country: string) {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  const payload = { name, country };
  channel.sendToQueue('earn-queue', Buffer.from(JSON.stringify(payload)));
}
