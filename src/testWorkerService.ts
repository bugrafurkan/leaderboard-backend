import { connectRedis } from './config/redis';
import { workerService } from './services/workerService';

async function testWorkerServices(): Promise<void> {
  try {
    // Redis start
    await connectRedis();
    for( let i=1; i<=150; i++){
      console.log("Creating player 'DoeJohn'...");
      const newPlayer = await workerService.createPlayer('DoeJohn', getRandomCountry());
      console.log('New player created:', newPlayer);

      const randomNewScore = Math.floor(Math.random() * 10001);
      console.log(`Updating score for playerId=${newPlayer.playerId} to newScore=${randomNewScore}`);

      const newRank = await workerService.earn(newPlayer.playerId, randomNewScore);
      console.log(`Earn operation completed. New Rank for player ${newPlayer.playerId}: ${newRank + 1}`);
    }
    console.log(`Creating players 'DoeJohn'... completed`);
    process.exit(0);
  } catch (error) {
    console.error('Error testing worker services:', error);
    process.exit(1);
  }
}

function getRandomCountry(): string {
  const countries = ['US', 'UK', 'DE', 'FR', 'TR', 'IT', 'ES', 'JP', 'CN', 'BR'];
  const randomIndex = Math.floor(Math.random() * countries.length);
  return countries[randomIndex];
}

testWorkerServices();
