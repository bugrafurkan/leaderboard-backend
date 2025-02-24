import { leaderboardRepository } from '../repositories/leaderboardRepository';
import { playerRepository } from '../repositories/playerRepository';
import { LeaderboardPlayerInfo } from '../models/leaderboard.types';

/**
 * Prize Rates:
 * 1. player: %20
 * 2. player: %15
 * 3. player: %10
 * 4-100: %55
 */

export const leaderboardService = {
  // Top 100 + searching player range
  async getLeaderboard(searchPlayerId?: number) {
    console.log('leaderboardService1');
    const top100 = await leaderboardRepository.getTop100();
    console.log('leaderboardService11', top100.length);
    const top100Entries: LeaderboardPlayerInfo[] = await Promise.all(
      top100.map(async (entry) => {
        const player = await playerRepository.findById(entry.playerId);
        return {
          ...entry,
          player
        };
      })
    );

    let searchedPlayerRange: LeaderboardPlayerInfo[] | null = null;

    if (searchPlayerId) {
      const rangeEntries = await leaderboardRepository.getPlayerRange(searchPlayerId);
      if (rangeEntries) {
        searchedPlayerRange = await Promise.all(
          rangeEntries.map(async (entry) => {
            const player = await playerRepository.findById(entry.playerId);
            return {
              ...entry,
              player
            };
          })
        );
      }    }

    return {
      top100Entries,
      searchedPlayerRange
    };
  },

  // player earning
  async earn(playerId: number, amount: number) {
    const oldScore = await leaderboardRepository.getScore(playerId) || 0;
    const difference = amount - oldScore;
    const rank = await leaderboardRepository.getRank(playerId);
    if (difference > 0) {
      // 1) increase Leaderboard score
      await leaderboardRepository.incrementScore(playerId, amount);
      // 2) increase weekly earnings
      await leaderboardRepository.incrementWeeklyEarnings(difference);

      const newRank = await leaderboardRepository.getRank(playerId);
      if(newRank === null) {
        return 999999;
      }
      return newRank;
    }
    if(rank === null) {
      return 999999;
    }
    return rank;
  },

  // Weekly prize sharing
  async distributePrizes() {
    // 1) totalEarnings (weekly_earnings_total)
    const totalEarnings = await leaderboardRepository.getWeeklyEarnings();
    // 2) Prize pool = totalEarnings * 0.02
    const prizePool = totalEarnings * 0.02;

    // 3) Top 100 çek
    const top100 = await leaderboardRepository.getTop100();
    if (top100.length === 0) {
      return { message: 'No players to distribute prizes.' };
    }

    // 4) Sharing calculating
    let firstPrize = 0;
    let secondPrize = 0;
    let thirdPrize = 0;
    let remaining = 0;

    if (top100.length >= 1) {
      firstPrize = prizePool * 0.20; // 1. %20
    }
    if (top100.length >= 2) {
      secondPrize = prizePool * 0.15; // 2. %15
    }
    if (top100.length >= 3) {
      thirdPrize = prizePool * 0.10; // 3. %10
    }
    // 4-100 => %55
    remaining = prizePool * 0.55;

    // Rest for after fourth player
    const restPlayers = top100.slice(3); // rest of the players
    let eachShare = 0;
    if (restPlayers.length > 0) {
      eachShare = remaining / restPlayers.length;
    }

    // 5) update DB for players
    // 1. player firstPrize
    if (top100[0]) {
      await addMoneyToPlayer(top100[0].playerId, firstPrize);
    }
    // 2. player secondPrize
    if (top100[1]) {
      await addMoneyToPlayer(top100[1].playerId, secondPrize);
    }
    // 3. player thirdPrize
    if (top100[2]) {
      await addMoneyToPlayer(top100[2].playerId, thirdPrize);
    }
    // 4-100 => eachShare
    for (const entry of restPlayers) {
      await addMoneyToPlayer(entry.playerId, eachShare);
    }

    // 6) Leaderboard reset
    await leaderboardRepository.resetLeaderboard();
    await leaderboardRepository.resetWeeklyEarnings();

    return {
      distributedCount: top100.length,
      totalPrizePool: prizePool,
      firstPrize,
      secondPrize,
      thirdPrize,
      sharePerRest: eachShare
    };
  }
};

// Helper function: raise money on DB
async function addMoneyToPlayer(playerId: number, amount: number) {
  if (amount <= 0) return;
  const player = await playerRepository.findById(playerId);
  if (player) {
    const newAmount = player.money + amount;
    await playerRepository.updateMoney(playerId, newAmount);
  }
}
