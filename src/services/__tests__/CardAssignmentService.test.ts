import { describe, it, expect, beforeEach } from 'vitest';
import { CardAssignmentService } from '../CardAssignmentService';
import { MockRequestRepository } from '../../repositories/MockRequestRepository';
import { MockCardRepository } from '../../repositories/MockCardRepository';
import { validateBingoCard } from '@domain/cards/validator';

const mockReqRepo = new MockRequestRepository();
const mockCardRepo = new MockCardRepository();
const cardAssignmentService = new CardAssignmentService(mockReqRepo, mockCardRepo);

describe('CardAssignmentService', () => {
  beforeEach(() => {
    // Limpiar el estado interno de los mocks para que cada test sea independiente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockReqRepo as any).requests = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockCardRepo as any).cards = [];

    const now = Date.now();

    // 1. Solicitud APROBADA (para test 1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockReqRepo as any).requests.push({
      id: 'APPY-DEF456',
      playerId: 'player-1',
      playerName: 'Usuario Aprobado',
      whatsapp: '3001111111',
      requestedCards: 1,
      status: 'APROBADA',
      createdAt: now
    });

    // 2. Solicitud PENDIENTE (para test 2)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockReqRepo as any).requests.push({
      id: 'APPY-ABC123',
      playerId: 'player-2',
      playerName: 'Usuario Pendiente',
      whatsapp: '3002222222',
      requestedCards: 1,
      status: 'PENDIENTE',
      createdAt: now
    });

    // 3. Solicitud RECHAZADA (para test 3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockReqRepo as any).requests.push({
      id: 'APPY-GHI789',
      playerId: 'player-3',
      playerName: 'Usuario Rechazado',
      whatsapp: '3003333333',
      requestedCards: 1,
      status: 'RECHAZADA',
      createdAt: now
    });

    // 4. Solicitud APROBADA con 5 cartones (para tests 4 a 17)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockReqRepo as any).requests.push({
      id: 'APPY-JKL012',
      playerId: 'player-4',
      playerName: 'Usuario 5 Cartones',
      whatsapp: '3004444444',
      requestedCards: 5,
      status: 'APROBADA',
      createdAt: now
    });
  });

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
    await cardAssignmentService.generateCardsForRequest('APPY-JKL012', 'game-7');
    const byReq = await mockCardRepo.getCardsByRequestId('APPY-JKL012');
    expect(byReq.length).toBeGreaterThan(0);
    const byPlayer = await mockCardRepo.getCardsByPlayerId('player-4');
    expect(byPlayer.length).toBeGreaterThan(0);
  });

  it('17. Una solicitud ya procesada no genera cartones duplicados', async () => {
    const cards1 = await cardAssignmentService.generateCardsForRequest('APPY-JKL012', 'game-8');
    const cards2 = await cardAssignmentService.generateCardsForRequest('APPY-JKL012', 'game-8');
    expect(cards1.length).toBe(cards2.length);
  });
});
