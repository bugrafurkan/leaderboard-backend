import { dbPool } from "../config/database";
import { Player} from "../models/Player";

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
    await dbPool.query(`UPDATE players SET money=$1 WHERE playerId=$2`, [newAmount, playerId]);
  },

  async listPlayer(playerId: number): Promise<Player | null> {
    const query = `
    SELECT playerId, name, country, money, created_at AS "createdAt"
    FROM players WHERE playerId=$1`;
    const { rows } = await dbPool.query(query, [playerId]);
    return rows[0];
  }

}
