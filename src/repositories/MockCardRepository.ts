import type { Card, CardId, GameId, RequestId } from '@bingo-types/index';
import type { CardRepository } from './CardRepository';

export class MockCardRepository implements CardRepository {
  private cards: Card[] = [];

  async getCards() { return [...this.cards]; }
  
  async getCardById(cardId: CardId) {
    const c = this.cards.find(x => x.id === cardId);
    return c ? { ...c } : null;
  }
  
  async getCardsByRequestId(requestId: RequestId) {
    return this.cards.filter(c => c.requestId === requestId);
  }
  
  async getCardsByPlayerId(playerId: string) {
    return this.cards.filter(c => c.playerId === playerId);
  }
  
  async getCardsByGameId(gameId: GameId) {
    return this.cards.filter(c => c.gameId === gameId);
  }
  
  async existsFingerprint(gameId: GameId, fingerprint: string) {
    return this.cards.some(c => c.gameId === gameId && c.fingerprint === fingerprint);
  }
  
  async existsVisibleNumber(gameId: GameId, visibleNumber: string) {
    return this.cards.some(c => c.gameId === gameId && c.cardNumberFormatted === visibleNumber);
  }
  
  async createCards(cards: Card[]) {
    for (const card of cards) {
      if (await this.existsFingerprint(card.gameId, card.fingerprint)) {
        throw new Error('Fingerprint duplicado en el juego');
      }
      if (await this.existsVisibleNumber(card.gameId, card.cardNumberFormatted)) {
        throw new Error('Número visible duplicado en el juego');
      }
    }
    this.cards.push(...cards);
  }

  async updateCardOpenStatus(cardId: CardId, deviceId: string): Promise<void> {
    const index = this.cards.findIndex(c => c.id === cardId);
    if (index === -1) throw new Error('Cartón no encontrado');
    this.cards[index] = {
      ...this.cards[index],
      openedDeviceId: deviceId,
      openedAt: Date.now()
    };
  }
}

export const cardRepository = new MockCardRepository();