import {redisClient} from '../config/redis';
import { leaderboardRepository } from '../repositories/leaderboardRepository';
import { playerRepository } from '../repositories/playerRepository';
import { incrementDistributedMoney } from '../middlewares/metricsMiddleware';



export const workerService = {
  // async "create player" (DB + scoreboard=0)
  async createPlayer(name: string, country: string) {
    const newPlayer = await playerRepository.createPlayer(name, country);
    await leaderboardRepository.setZeroScore(newPlayer.playerId);
    return newPlayer;
  },

  // async "earn" => "amount" = new score
  async earn(playerId: number, newScore: number) {
    const oldScore = await leaderboardRepository.getScore(playerId) || 0;

    const difference = newScore - oldScore;
    if (difference <= 0) {

      const rank = await leaderboardRepository.getRank(playerId);
      return rank ?? 999999;
    }
    incrementDistributedMoney(difference);
    // score => newScore
    await leaderboardRepository.incrementScore(playerId, newScore);

    // add difference to weekly earnings
    await leaderboardRepository.incrementWeeklyEarnings(difference);

    // find rank
    const newRank = await leaderboardRepository.getRank(playerId);
    return newRank ?? 999999;
  },

  async incrementScore(playerId: number, amount: number) {
    await redisClient.zIncrBy('leaderboard:currentWeek', amount, playerId.toString());
  },

  async getRank(playerId: number): Promise<number | null> {
    return await redisClient.zRevRank('leaderboard:currentWeek', playerId.toString());
  }
};
