import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, orderBy, onSnapshot, runTransaction, deleteDoc } from 'firebase/firestore';
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

  async drawNextNumber(id: GameId): Promise<number | null> {
    const ref = doc(db, 'games', id);
    let drawnNumber: number | null = null;

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(ref);
      if (!docSnap.exists()) throw new Error('Juego no encontrado');
      
      const game = docSnap.data() as Game;
      if (game.state !== 'RUNNING') {
        throw new Error('El juego debe estar en estado RUNNING para sortear');
      }
      
      const drawn = game.drawnNumbers || [];
      if (drawn.length >= 75) {
        throw new Error('Ya se han sorteado los 75 números');
      }
      
      // Generar número aleatorio entre 1 y 75 que no esté en drawn
      let newNumber: number;
      do {
        newNumber = Math.floor(Math.random() * 75) + 1;
      } while (drawn.includes(newNumber));
      
      drawnNumber = newNumber;
      const newDrawn = [...drawn, newNumber];
      
      transaction.update(ref, {
        currentBall: newNumber,
        drawnNumbers: newDrawn,
        updatedAt: Date.now()
      });
    });

    return drawnNumber;
  }

  async deleteGame(id: GameId): Promise<void> {
    const ref = doc(db, 'games', id);
    await deleteDoc(ref);
  }

  subscribeToGames(callback: (games: Game[]) => void): () => void {
    const q = query(this.col, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const games = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Game));
      callback(games);
    }, (error) => {
      console.error('Error en suscripción a juegos:', error);
      callback([]);
    });
    return unsubscribe;
  }
}

export const gameRepository = new FirebaseGameRepository();
