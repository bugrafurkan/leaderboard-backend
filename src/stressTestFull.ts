// src/stressTestFull.ts

import { workerService } from './services/workerService';
import { leaderboardService } from './services/leaderboardService';
import { sendEarnMessage, initQueue } from './config/queue';

// List of 10 countries
const COUNTRIES = ['US', 'UK', 'DE', 'FR', 'TR', 'IT', 'ES', 'JP', 'CN', 'BR'];

/**
 * Helper function that selects a random country from the list.
 */
function getRandomCountry(): string {
  const randomIndex = Math.floor(Math.random() * COUNTRIES.length);
  return COUNTRIES[randomIndex];
}

/**
 * This function performs a stress test by:
 * 1. Creating 1,000,000 players with the name "DoeJohn", each assigned a random country.
 * 2. For each player, it sends an "earn" message with a random score between 0 and 10,000 to the message queue.
 * 3. Waits for a period (e.g., 60 seconds) to allow workers to process all messages.
 * 4. Retrieves and logs the final Top 100 leaderboard data.
 */
async function stressTestFull(): Promise<void> {
  console.log('=== Stress Test: Creating 1,000,000 players and processing earn operations ===');

  // Initialize the message queue (RabbitMQ)
  await initQueue();

  const numPlayers = 1_000_000;
  const chunkSize = 1000; // Process players in chunks to avoid memory/time issues
  let createdPlayers: { playerId: number; country: string }[] = [];

  // 1) Create players in chunks
  for (let i = 0; i < numPlayers; i += chunkSize) {
    console.log(`Creating players ${i + 1} to ${Math.min(i + chunkSize, numPlayers)}...`);
    const chunkPromises = [];
    for (let j = 0; j < chunkSize && i + j < numPlayers; j++) {
      chunkPromises.push(workerService.createPlayer('DoeJohn', getRandomCountry()));
    }
    const chunkPlayers = await Promise.all(chunkPromises);
    createdPlayers = createdPlayers.concat(chunkPlayers);
  }

  console.log(`${createdPlayers.length} players created.`);

  // 2) For each player, queue an "earn" message with a random score between 0 and 10,000
  const earnChunkSize = 1000; // Process earn messages in chunks as well
  for (let i = 0; i < createdPlayers.length; i += earnChunkSize) {
    console.log(`Queuing earn messages for players ${i + 1} to ${Math.min(i + earnChunkSize, createdPlayers.length)}...`);
    const earnPromises = [];
    for (let j = 0; j < earnChunkSize && i + j < createdPlayers.length; j++) {
      const player = createdPlayers[i + j];
      const randomScore = Math.floor(Math.random() * 10001); // Random score between 0 and 10,000
      // Send an "earn" message to the queue; the worker will process this message asynchronously.
      earnPromises.push(sendEarnMessage(player.playerId, randomScore));
    }
    await Promise.all(earnPromises);
  }

  console.log(`${createdPlayers.length} earn messages queued.`);

  // 3) Wait for the workers to process all messages (e.g., 60 seconds)
  console.log('Waiting 60 seconds for workers to process messages...');
  await new Promise((resolve) => setTimeout(resolve, 60000));

  // 4) Retrieve the leaderboard data and log it
  const leaderboardData = await leaderboardService.getLeaderboard();
  console.log('=== Final Top 100 Leaderboard ===');
  console.dir(leaderboardData, { depth: null });
}

stressTestFull().catch((err) => {
  console.error('Error in stress test:', err);
});
