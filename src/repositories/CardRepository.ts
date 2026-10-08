import type { Card, CardId, GameId, RequestId } from '@bingo-types/index';

export interface CardRepository {
  getCards(): Promise<Card[]>;
  getCardById(cardId: CardId): Promise<Card | null>;
  getCardsByRequestId(requestId: RequestId): Promise<Card[]>;
  getCardsByPlayerId(playerId: string): Promise<Card[]>;
  getCardsByGameId(gameId: GameId): Promise<Card[]>;
  createCards(cards: Card[]): Promise<void>;
  existsFingerprint(gameId: GameId, fingerprint: string): Promise<boolean>;
  existsVisibleNumber(gameId: GameId, visibleNumber: string): Promise<boolean>;
  updateCardOpenStatus(cardId: CardId, deviceId: string): Promise<void>;
  deleteCard(cardId: CardId): Promise<void>;
  markNumber(cardId: CardId, number: number): Promise<void>;
  claimBingo(cardId: CardId): Promise<{ success: boolean; alreadyWon?: boolean }>;
}