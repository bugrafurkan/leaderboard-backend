import { Player} from "./Player";
import { LeaderboardEntry} from "./LeaderboardEntry";

// LeaderboardEntry ve Player'ı birleştiren interface
export interface LeaderboardPlayerInfo extends LeaderboardEntry {
  player: Player | null;
}

// API response için interface
export interface LeaderboardResponse {
  top100: LeaderboardPlayerInfo[];
  searchedPlayerRange: LeaderboardPlayerInfo[] | null;
}
