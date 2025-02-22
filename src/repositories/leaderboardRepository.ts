import {redisClient} from '../config/redis';

const CURRENT_WEEK_KEY = 'leaderboard:currentWeek';
const WEEKLY_EARNINGS_KEY = 'weekly_earnings_total';

export const leaderboardRepository = {
  // GET top 100 => for highest score / amount
  async getTop100() {
    // ZREVRANGE <key> start stop WITHSCORES
    const result = await redisClient.zRangeWithScores(CURRENT_WEEK_KEY, 0, 99, { REV: true });

    return result.map((item) => ({
      playerId:parseInt(item.value, 10),
      score: item.score
    }));
  },

  //Searching player rank
  async getRank(playerId: number): Promise<number | null> {
    // ZREVRANK <key> <member>
    if (await redisClient.zRevRank(CURRENT_WEEK_KEY, playerId.toString()) === null) return null;
    return await redisClient.zRevRank(CURRENT_WEEK_KEY, playerId.toString());
  },

  //Searching player rank range
  async getPlayerRange(playerId: number, aboveCount=3, belowCount=2) {
    const rank = await this.getRank(playerId);
    if (rank === null) return null;

    const start = rank - aboveCount >= 0 ? rank - aboveCount : 0;
    const end = rank + belowCount;
    const result = await redisClient.zRangeWithScores(CURRENT_WEEK_KEY, start, end, { REV: true });
    return result.map((item) => ({
      playerId: parseInt(item.value, 10),
      score: item.score
    }));
  },

  // increment score
  async incrementScore(playerId: number, amount: number) {
    // ZINCRBY <key> <increment> <member>
    //await redisClient.zIncrBy(CURRENT_WEEK_KEY,amount, playerId.toString());

    await redisClient.zAdd(CURRENT_WEEK_KEY,{
      value: playerId.toString(),
      score:amount
    });
  },
  async getScore(playerId: number): Promise<number | null>{
    return await redisClient.zScore(CURRENT_WEEK_KEY, playerId.toString());
  },

  //Global earnings increase
  async incrementWeeklyEarnings(amount: number) {
    await redisClient.incrByFloat(WEEKLY_EARNINGS_KEY,amount);
  },

  //get weekly earning
  async getWeeklyEarnings(): Promise<number> {
    const val = await redisClient.get(WEEKLY_EARNINGS_KEY);
    if (!val) {
      return 0;
    }
    return parseFloat(val);
  },

  async resetWeeklyEarnings(): Promise<void> {
    await redisClient.set(WEEKLY_EARNINGS_KEY, '0');
  },

  async resetLeaderboard() {
  await redisClient.del(CURRENT_WEEK_KEY);
  },

  // createPlayer
  async setZeroScore(playerId: number) {
    // ZADD <score=0>
    await redisClient.zAdd(CURRENT_WEEK_KEY, {
      score: 0,
      value: playerId.toString()
    });
  }
};
