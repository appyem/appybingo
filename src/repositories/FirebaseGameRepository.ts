import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Game, GameId, GameState } from '@bingo-types/index';
import type { GameRepository } from './GameRepository';

export class FirebaseGameRepository implements GameRepository {
  private col = collection(db, 'games');

  async getGames(): Promise<Game[]> {
    const q = query(this.col, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Game));
  }

  async getGameById(id: GameId): Promise<Game | null> {
    const ref = doc(db, 'games', id);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Game) : null;
  }

  async createGame(data: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<Game> {
    const now = Date.now();
    const newDoc = await addDoc(this.col, {
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return { id: newDoc.id, ...data, createdAt: now, updatedAt: now };
  }

  async updateGameState(id: GameId, state: GameState): Promise<void> {
    const ref = doc(db, 'games', id);
    await updateDoc(ref, { state, updatedAt: Date.now() });
  }
  subscribeToGame(id: GameId, callback: (game: Game | null) => void): () => void {
    const ref = doc(db, 'games', id);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        const game = { id: snapshot.id, ...snapshot.data() } as Game;
        callback(game);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error en suscripción al juego:', error);
      callback(null);
    });
    return unsubscribe;
  }
}

export const gameRepository = new FirebaseGameRepository();
