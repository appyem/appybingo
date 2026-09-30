import type { GameId, GameState } from '@bingo-types/index';
import { assertTransition } from '@domain/games/states';
import type { GameRepository } from '@repositories/GameRepository';
export class GameService {
  constructor(private readonly repo: GameRepository) {}
  async transition(gameId: GameId, to: GameState): Promise<void> {
    const game = await this.repo.findById(gameId);
    if (!game) throw new Error('Partida no encontrada');
    assertTransition(game.state, to);
    await this.repo.updateState(gameId, to);
  }
}