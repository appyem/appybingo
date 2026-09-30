import { generateUniqueValidCard } from '@domain/cards/service';
import { validateBingoCard } from '@domain/cards/validator';
import { createUUID } from '@utils/ids';
import type { Card, RequestId, GameId } from '@bingo-types/index';
import type { RequestRepository } from '../repositories/RequestRepository';
import type { CardRepository } from '../repositories/CardRepository';

export class CardAssignmentService {
  constructor(
    private requestRepo: RequestRepository,
    private cardRepo: CardRepository
  ) {}

  async generateCardsForRequest(requestId: RequestId, gameId: GameId): Promise<Card[]> {
    const request = await this.requestRepo.getRequestById(requestId);
    if (!request) throw new Error('Solicitud no encontrada');
    if (request.status !== 'APROBADA') {
      throw new Error('No se pueden generar cartones para una solicitud con estado: ' + request.status);
    }
    
    const existing = await this.cardRepo.getCardsByRequestId(requestId);
    if (existing.length > 0) return existing;

    const cardsToCreate: Card[] = [];
    const usedFingerprints = new Set<string>();

    for (let i = 0; i < request.requestedCards; i++) {
      let attempts = 0;
      let created = false;
      
      while (attempts < 100 && !created) {
        const { matrix, fingerprint } = generateUniqueValidCard(usedFingerprints);
        if (!validateBingoCard(matrix).valid) { attempts++; continue; }
        try {
          if (await this.cardRepo.existsFingerprint(gameId, fingerprint)) { attempts++; continue; }
        } catch (e: unknown) {
          throw new Error('Error de índice en Firestore (fingerprint). Verifica que exista el índice compuesto para gameId + fingerprint.', { cause: e });
        }

        let visibleNumber = '';
        let isUsed = true;
        let numAtt = 0;
        while (isUsed && numAtt < 100) {
          visibleNumber = 'AB-' + (Math.floor(Math.random() * 900000) + 100000);
          try {
            isUsed = await this.cardRepo.existsVisibleNumber(gameId, visibleNumber);
          } catch (e: unknown) {
            throw new Error('Error de índice en Firestore (número visible). Verifica que exista el índice compuesto para gameId + cardNumberFormatted.', { cause: e });
          }
          numAtt++;
        }
        if (isUsed) throw new Error('No se pudo generar un número visible único');

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://appybingo.com';
        const cardId = createUUID();
        
        cardsToCreate.push({
          id: cardId,
          gameId,
          playerId: request.playerId,
          requestId,
          cardNumberFormatted: visibleNumber,
          fingerprint,
          matrix,
          status: 'ASSIGNED',
          createdAt: Date.now(),
          assignedAt: Date.now(),
          url: baseUrl + '/#/carton/' + cardId
        });
        
        usedFingerprints.add(fingerprint);
        created = true;
      }
      
      if (!created) throw new Error('Fallo al generar el cartón ' + (i + 1) + ' tras 100 intentos.');
    }

    await this.cardRepo.createCards(cardsToCreate);
    return cardsToCreate;
  }
}