import { playerRepository} from "../repositories/playerRepository";

export const playerService = {
  async registerPlayer(name: string, country: string) {
    // Basit validasyon
    if (!name || !country) throw new Error('Name and country are required');
    const newPlayer = await playerRepository.createPlayer(name, country);
    return newPlayer;
  },

  async getPlayer(playerId: number) {
    return playerRepository.findById(playerId);
  },

  async deletePlayer(playerId: number) {
    return playerRepository.deletePlayer(playerId);
  },

  async getPlayers(playerId: number) {
    return playerRepository.findById(playerId);
  }
};
