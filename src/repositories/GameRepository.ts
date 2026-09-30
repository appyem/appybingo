import type { Game, GameId, GameState } from '@bingo-types/index';

export interface GameRepository {
  getGames(): Promise<Game[]>;
  getGameById(id: GameId): Promise<Game | null>;
  createGame(data: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<Game>;
  updateGameState(id: GameId, state: GameState): Promise<void>;
  subscribeToGame(id: GameId, callback: (game: Game | null) => void): () => void;
}
