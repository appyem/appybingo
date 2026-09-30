import type { Card, GameId, PlayerId, RequestId } from '@bingo-types/index';
import { generateUniqueValidCard } from '@domain/cards/service';
import { validateBingoCard } from '@domain/cards/validator';
import { createUUID } from '@utils/ids';
import type { CardRepository } from '@repositories/CardRepository';

export class CardService {
  constructor(private readonly repo: CardRepository) {}

  async createCardForGame(gameId: GameId, playerId: PlayerId, requestId: RequestId): Promise<Card> {
    const existing = await this.repo.getCardsByGameId(gameId);
    const usedFingerprints = new Set(existing.map(c => c.fingerprint));
    
    const { matrix, fingerprint } = generateUniqueValidCard(usedFingerprints);
    const validation = validateBingoCard(matrix);
    if (!validation.valid) {
      throw new Error('Cartón inválido: ' + validation.errors.join('; '));
    }

    let visibleNumber = '';
    let isUsed = true;
    let attempts = 0;
    const existingNumbers = new Set(existing.map(c => c.cardNumberFormatted));
    while (isUsed && attempts < 100) {
      visibleNumber = 'AB-' + (Math.floor(Math.random() * 900000) + 100000);
      isUsed = existingNumbers.has(visibleNumber);
      attempts++;
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://appybingo.com';
    const cardId = createUUID();
    const now = Date.now();

    const card: Card = {
      id: cardId,
      gameId,
      playerId,
      requestId,
      cardNumberFormatted: visibleNumber,
      fingerprint,
      matrix,
      status: 'ASSIGNED',
      createdAt: now,
      assignedAt: now,
      url: baseUrl + '/#/carton/' + cardId
    };

    await this.repo.createCards([card]);
    return card;
  }
}
