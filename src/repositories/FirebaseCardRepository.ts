import { collection, doc, getDoc, getDocs, writeBatch, query, where, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Card, CardId, GameId, RequestId, CardMatrix, CardCell } from '@bingo-types/index';
import type { CardRepository } from './CardRepository';

// Helper para aplanar la matriz 5x5 a un array de 25 elementos (Firestore no soporta arrays anidados)
const flattenMatrix = (matrix: CardMatrix): (number | 'FREE' | null)[] => {
  return matrix.flat() as (number | 'FREE' | null)[];
};

// Helper para reconstruir la matriz 5x5 desde un array de 25 elementos
const reconstructMatrix = (flat: (number | 'FREE' | null)[]): CardMatrix => {
  return [
    flat.slice(0, 5) as [CardCell, CardCell, CardCell, CardCell, CardCell],
    flat.slice(5, 10) as [CardCell, CardCell, CardCell, CardCell, CardCell],
    flat.slice(10, 15) as [CardCell, CardCell, CardCell, CardCell, CardCell],
    flat.slice(15, 20) as [CardCell, CardCell, CardCell, CardCell, CardCell],
    flat.slice(20, 25) as [CardCell, CardCell, CardCell, CardCell, CardCell],
  ];
};

export class FirebaseCardRepository implements CardRepository {
  private col = collection(db, 'cards');

  async getCards(): Promise<Card[]> {
    const snapshot = await getDocs(this.col);
    return snapshot.docs.map(d => {
      const data = d.data() as Record<string, unknown>;
      return { id: d.id, ...data, matrix: reconstructMatrix(data.matrix as (number | 'FREE' | null)[]) } as Card;
    });
  }

  async getCardById(cardId: CardId): Promise<Card | null> {
    console.log('📦 FirebaseCardRepository: Buscando documento en colección "cards" con ID:', cardId);
    const ref = doc(db, 'cards', cardId);
    const snap = await getDoc(ref);
    console.log('📦 FirebaseCardRepository: Documento existe?', snap.exists());
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    console.log('📦 FirebaseCardRepository: Datos crudos de Firestore:', data);
    return { id: snap.id, ...data, matrix: reconstructMatrix(data.matrix as (number | 'FREE' | null)[]) } as Card;
  }

  async getCardsByRequestId(requestId: RequestId): Promise<Card[]> {
    const q = query(this.col, where('requestId', '==', requestId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data() as Record<string, unknown>;
      return { id: d.id, ...data, matrix: reconstructMatrix(data.matrix as (number | 'FREE' | null)[]) } as Card;
    });
  }

  async getCardsByPlayerId(playerId: string): Promise<Card[]> {
    const q = query(this.col, where('playerId', '==', playerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data() as Record<string, unknown>;
      return { id: d.id, ...data, matrix: reconstructMatrix(data.matrix as (number | 'FREE' | null)[]) } as Card;
    });
  }

  async getCardsByGameId(gameId: GameId): Promise<Card[]> {
    const q = query(this.col, where('gameId', '==', gameId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data() as Record<string, unknown>;
      return { id: d.id, ...data, matrix: reconstructMatrix(data.matrix as (number | 'FREE' | null)[]) } as Card;
    });
  }

  async existsFingerprint(gameId: GameId, fingerprint: string): Promise<boolean> {
    const q = query(this.col, where('gameId', '==', gameId), where('fingerprint', '==', fingerprint));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async existsVisibleNumber(gameId: GameId, visibleNumber: string): Promise<boolean> {
    const q = query(this.col, where('gameId', '==', gameId), where('cardNumberFormatted', '==', visibleNumber));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async createCards(cards: Card[]): Promise<void> {
    console.log('📝 FirebaseCardRepository: Guardando', cards.length, 'cartones en Firestore');
    const batch = writeBatch(db);
    for (const card of cards) {
      if (await this.existsFingerprint(card.gameId, card.fingerprint)) {
        throw new Error('Fingerprint duplicado en el juego');
      }
      if (await this.existsVisibleNumber(card.gameId, card.cardNumberFormatted)) {
        throw new Error('Número visible duplicado en el juego');
      }
      // Usamos el card.id explícitamente para que el ID del documento en Firestore coincida con el UUID generado
      const ref = doc(this.col, card.id);
      console.log('📝 FirebaseCardRepository: Guardando cartón con ID:', card.id, 'en documento:', ref.id);
      // Aplanamos la matriz antes de guardar en Firestore
      const cardToSave = { ...card, matrix: flattenMatrix(card.matrix) };
      batch.set(ref, cardToSave);
    }
    await batch.commit();
    console.log('✅ FirebaseCardRepository: Cartones guardados exitosamente');
  }

  async updateCardOpenStatus(cardId: CardId, deviceId: string): Promise<void> {
    const ref = doc(db, 'cards', cardId);
    await updateDoc(ref, {
      openedDeviceId: deviceId,
      openedAt: Date.now()
    });
  }

  async deleteCard(cardId: CardId): Promise<void> {
    const ref = doc(db, 'cards', cardId);
    await deleteDoc(ref);
  }

  async markNumber(cardId: CardId, number: number): Promise<void> {
    const ref = doc(db, 'cards', cardId);
    await updateDoc(ref, {
      markedNumbers: arrayUnion(number)
    });
  }

  async claimBingo(cardId: CardId): Promise<void> {
    const ref = doc(db, 'cards', cardId);
    await updateDoc(ref, {
      bingoClaimedAt: Date.now(),
      bingoClaimedBy: 'device',
      status: 'WINNER'
    });
  }
}

export const cardRepository = new FirebaseCardRepository();
