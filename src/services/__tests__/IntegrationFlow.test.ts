import { describe, it, expect } from 'vitest';
import { MockRequestRepository } from '../../repositories/MockRequestRepository';
import { MockCardRepository } from '../../repositories/MockCardRepository';
import { CardAssignmentService } from '../../services/CardAssignmentService';
import { createUUID } from '@utils/ids';

const mockReqRepo = new MockRequestRepository();
const mockCardRepo = new MockCardRepository();
const cardAssignmentService = new CardAssignmentService(mockReqRepo, mockCardRepo);

describe('Flujo de Integración: Crear -> Aprobar -> Generar -> Ver', () => {
  it('debe permitir crear, aprobar y generar cartones que sean visibles en todos los repositorios', async () => {
    const playerId = createUUID();
    const newRequest = await mockReqRepo.createRequest({
      playerId,
      playerName: 'Juan Integracion',
      whatsapp: '3001112222',
      requestedCards: 3
    });

    expect(newRequest.status).toBe('PENDIENTE');
    expect(newRequest.playerId).toBe(playerId);

    await mockReqRepo.updateRequestStatus(newRequest.id, 'APROBADA');
    const updatedReq = await mockReqRepo.getRequestById(newRequest.id);
    expect(updatedReq?.status).toBe('APROBADA');

    const cards = await cardAssignmentService.generateCardsForRequest(newRequest.id, 'game-integration-1');
    expect(cards).toHaveLength(3);

    const cardsByReq = await mockCardRepo.getCardsByRequestId(newRequest.id);
    expect(cardsByReq).toHaveLength(3);

    const cardsByPlayer = await mockCardRepo.getCardsByPlayerId(playerId);
    expect(cardsByPlayer).toHaveLength(3);

    expect(cards.every((c: import("@bingo-types/index").Card) => c.requestId === newRequest.id)).toBe(true);
    expect(cards.every((c: import("@bingo-types/index").Card) => c.playerId === playerId)).toBe(true);

    const cardsAgain = await cardAssignmentService.generateCardsForRequest(newRequest.id, 'game-integration-1');
    expect(cardsAgain).toHaveLength(3);
    
    const totalCardsInRepo = await mockCardRepo.getCards();
    const cardsForThisReq = totalCardsInRepo.filter((c: import("@bingo-types/index").Card) => c.requestId === newRequest.id);
    expect(cardsForThisReq).toHaveLength(3);
  });
});
