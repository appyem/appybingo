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

  async drawNextNumber(id: GameId): Promise<number | null> {
    const index = this.games.findIndex(g => g.id === id);
    if (index === -1) throw new Error('Juego no encontrado');
    
    const game = this.games[index];
    if (game.state !== 'RUNNING') throw new Error('El juego debe estar en estado RUNNING');
    
    const drawn = game.drawnNumbers || [];
    if (drawn.length >= 75) throw new Error('Ya se han sorteado los 75 números');
    
    let newNumber: number;
    do {
      newNumber = Math.floor(Math.random() * 75) + 1;
    } while (drawn.includes(newNumber));
    
    const newDrawn = [...drawn, newNumber];
    this.games[index] = {
      ...game,
      currentBall: newNumber,
      drawnNumbers: newDrawn,
      updatedAt: Date.now()
    };
    
    return newNumber;
  }

  async deleteGame(id: GameId): Promise<void> {
    const index = this.games.findIndex(g => g.id === id);
    if (index !== -1) this.games.splice(index, 1);
  }

  subscribeToGames(callback: (games: Game[]) => void): () => void {
    callback([...this.games]);
    return () => {};
  }
}

export const mockGameRepository = new MockGameRepository();
