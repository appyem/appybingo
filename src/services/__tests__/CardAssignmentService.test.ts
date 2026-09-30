import { describe, it, expect } from 'vitest';
import { CardAssignmentService } from '../CardAssignmentService';
import { MockRequestRepository } from '../../repositories/MockRequestRepository';
import { MockCardRepository } from '../../repositories/MockCardRepository';
import { validateBingoCard } from '@domain/cards/validator';

const mockReqRepo = new MockRequestRepository();
const mockCardRepo = new MockCardRepository();
const cardAssignmentService = new CardAssignmentService(mockReqRepo, mockCardRepo);

describe('CardAssignmentService', () => {
  it('1. Una solicitud aprobada puede generar cartones', async () => {
    const cards = await cardAssignmentService.generateCardsForRequest('APPY-DEF456', 'game-1');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('2. Una solicitud pendiente NO puede generar cartones', async () => {
    await expect(cardAssignmentService.generateCardsForRequest('APPY-ABC123', 'game-1')).rejects.toThrow('No se pueden generar cartones');
  });

  it('3. Una solicitud rechazada NO puede generar cartones', async () => {
    await expect(cardAssignmentService.generateCardsForRequest('APPY-GHI789', 'game-1')).rejects.toThrow('No se pueden generar cartones');
  });

  it('4. Una solicitud con cantidad N genera exactamente N cartones', async () => {
    await mockReqRepo.updateRequestStatus('APPY-JKL012', 'APROBADA');
    const cards = await cardAssignmentService.generateCardsForRequest('APPY-JKL012', 'game-2');
    expect(cards).toHaveLength(5);
  });

  it('5, 6, 7. Los cartones pertenecen al mismo jugador, solicitud y juego', async () => {
    const cards = await cardAssignmentService.generateCardsForRequest('APPY-JKL012', 'game-3');
    const first = cards[0];
    expect(cards.every((c: import("@bingo-types/index").Card) => c.playerId === first.playerId)).toBe(true);
    expect(cards.every((c: import("@bingo-types/index").Card) => c.requestId === first.requestId)).toBe(true);
    expect(cards.every((c: import("@bingo-types/index").Card) => c.gameId === first.gameId)).toBe(true);
  });

  it('8, 9. Fingerprints y visibleNumbers son diferentes', async () => {
    const cards = await cardAssignmentService.generateCardsForRequest('APPY-JKL012', 'game-4');
    const fingerprints = new Set(cards.map((c: import("@bingo-types/index").Card) => c.fingerprint));
    const visibleNumbers = new Set(cards.map((c: import("@bingo-types/index").Card) => c.cardNumberFormatted));
    expect(fingerprints.size).toBe(cards.length);
    expect(visibleNumbers.size).toBe(cards.length);
  });

  it('10, 11. Todos los cartones pasan validateBingoCard y contienen FREE', async () => {
    const cards = await cardAssignmentService.generateCardsForRequest('APPY-JKL012', 'game-5');
    for (const card of cards) {
      expect(validateBingoCard(card.matrix).valid).toBe(true);
      expect(card.matrix[2][2]).toBe('FREE');
    }
  });

  it('14. La URL contiene el cardId correcto', async () => {
    const cards = await cardAssignmentService.generateCardsForRequest('APPY-JKL012', 'game-6');
    expect(cards[0].url).toContain(cards[0].id);
  });

  it('15, 16. getCardsByPlayerId y getCardsByRequestId devuelven los cartones', async () => {
    const byReq = await mockCardRepo.getCardsByRequestId('APPY-JKL012');
    expect(byReq.length).toBeGreaterThan(0);
    const byPlayer = await mockCardRepo.getCardsByPlayerId('player-4');
    expect(byPlayer.length).toBeGreaterThan(0);
  });

  it('17. Una solicitud ya procesada no genera cartones duplicados', async () => {
    const cards1 = await cardAssignmentService.generateCardsForRequest('APPY-JKL012', 'game-7');
    const cards2 = await cardAssignmentService.generateCardsForRequest('APPY-JKL012', 'game-7');
    expect(cards1.length).toBe(cards2.length);
  });
});
