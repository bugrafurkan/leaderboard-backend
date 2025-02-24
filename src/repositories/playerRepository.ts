import { dbPool } from "../config/database";
import { Player} from "../models/Player";
import { leaderboardRepository} from "./leaderboardRepository";
import {leaderboardService} from "../services/leaderboardService";

//Random countries
const COUNTRIES = [
  'US', 'UK', 'DE', 'FR', 'TR',
  'IT', 'ES', 'JP', 'CN', 'BR'
];

export const playerRepository = {
  async createPlayer(name: string, country: string): Promise<Player> {
    const query = `
      INSERT INTO players ("name", "country", "money")
      VALUES ($1, $2, 0)
      RETURNING "playerId", "name", "country", "joinDate", "money"
    `;
    const values = [name, country];
    const { rows } = await dbPool.query(query, values);
    return rows[0];
  },

  async deletePlayer(playerId: number): Promise<void> {
    const query = 'DELETE FROM players WHERE id = ${playerId}';
    const values = [playerId];
    const { rows } = await dbPool.query(query, values);
    return rows[0];
  },

  async updatePlayer(playerId: number, name: string, country: string): Promise<void> {
    const query = ` 
    UPDATE players
    SET name = $1 WHERE playerId = ${playerId}
    `;
    const values = [name, country];
    const { rows } = await dbPool.query(query, values);
    return rows[0];
  },
  async findById(playerId: number): Promise<Player | null> {
    const query = `
      SELECT "playerId", "name", "country", "joinDate", "money"
      FROM players
      WHERE "playerId" = $1
    `;
    const { rows } = await dbPool.query(query, [playerId]);
    if (rows.length === 0) return null;
    return rows[0];
  },

  async updateMoney(playerId: number, newAmount: number): Promise<void> {
    await dbPool.query(`UPDATE players SET "money"=$1 WHERE "playerId"=$2`, [newAmount, playerId]);
  },

  async listPlayer(playerId: number): Promise<Player | null> {
    const query = `
    SELECT playerId, name, country, money, created_at AS "createdAt"
    FROM players WHERE playerId=$1`;
    const { rows } = await dbPool.query(query, [playerId]);
    return rows[0];
  },

  async createTestDb(): Promise<void> {
    // 1) Rastgele ülke seç
    const randomIndex = Math.floor(Math.random() * COUNTRIES.length);
    const randomCountry = COUNTRIES[randomIndex];

    console.log(`Creating "JohnyyDoe" with random country=${randomCountry}`);

    // 2) DB'de yeni player oluştur (örn. "JohnDoe" adında, country = randomCountry)
    //    Varsayım: playerRepository.createPlayer(name, country) => { playerId, name, country, ... }


    // 3) 100 kez rastgele skor (0-1000) üretip "earn" / scoreboard'a ekleyelim
    for (let i = 0; i < 100; i++) {
      // 0-1000 arası
      const randomAmount = Math.floor(Math.random() * 1001);
      const newPlayer = await playerRepository.createPlayer('FFFJohnDoe', randomCountry);
      await leaderboardService.earn(newPlayer.playerId,randomAmount);
      // Earn mantığı: scoreboard'a "JohnDoe" playerId'ye randomAmount ekliyoruz
      // Bu, "incrementScore" veya "zIncrBy" gibi bir şey olabilir.
      console.log(`Iteration ${i + 1}: Earn = ${randomAmount}`);
    }

    console.log('Test DB setup complete. "JohnDoe" now has 100 random earn calls.');
  }

}
