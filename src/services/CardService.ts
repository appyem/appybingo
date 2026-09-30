import type { Card, CardId, GameId, PlayerId } from '@bingo-types/index';
import { generateUniqueValidCard } from '@domain/cards/service';
import { validateBingoCard } from '@domain/cards/validator';
import { formatCardNumber, createUUID } from '@utils/ids';
import type { CardRepository } from '@repositories/CardRepository';
export class CardService {
  constructor(private readonly repo: CardRepository) {}
  async createCardForGame(gameId: GameId): Promise<Card> {
    const used = await this.repo.getReservedFingerprints(gameId);
    const { matrix, fingerprint } = generateUniqueValidCard(used);
    if (!validateBingoCard(matrix).valid) throw new Error('Cartón inválido');
    const cardNumber = await this.repo.getNextCardNumber(gameId);
    const card: Card = { id: createUUID() as CardId, gameId, playerId: null, cardNumber, cardNumberFormatted: formatCardNumber(cardNumber), fingerprint, matrix, status: 'AVAILABLE', createdAt: Date.now(), assignedAt: null };
    await this.repo.create(card);
    return card;
  }
  async assignToPlayer(cardId: CardId, playerId: PlayerId): Promise<void> { await this.repo.assign(cardId, playerId); }
}