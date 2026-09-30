import type { Game, GameId, GameState } from '@bingo-types/index';
import type { GameRepository } from './GameRepository';
import { createUUID } from '@utils/ids';

export class MockGameRepository implements GameRepository {
  private games: Game[] = [];

  async getGames(): Promise<Game[]> {
    return [...this.games];
  }

  async getGameById(id: GameId): Promise<Game | null> {
    const g = this.games.find(x => x.id === id);
    return g ? { ...g } : null;
  }

  async createGame(data: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<Game> {
    const now = Date.now();
    const newGame: Game = { id: createUUID(), ...data, createdAt: now, updatedAt: now };
    this.games.push(newGame);
    return newGame;
  }

  async updateGameState(id: GameId, state: GameState): Promise<void> {
    const index = this.games.findIndex(g => g.id === id);
    if (index === -1) throw new Error('Juego no encontrado');
    this.games[index] = { ...this.games[index], state, updatedAt: Date.now() };
  }
  subscribeToGame(id: GameId, callback: (game: Game | null) => void): () => void {
    const game = this.games.find(g => g.id === id);
    callback(game ? { ...game } : null);
    return () => {};
  }
}

export const mockGameRepository = new MockGameRepository();
