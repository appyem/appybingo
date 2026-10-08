import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CardRequest, RequestId, RequestStatus } from '@bingo-types/index';
import type { RequestRepository } from './RequestRepository';

export class FirebaseRequestRepository implements RequestRepository {
  private col = collection(db, 'requests');

  async getRequests(): Promise<CardRequest[]> {
    const q = query(this.col, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CardRequest));
  }

  async getRequestById(id: RequestId): Promise<CardRequest | null> {
    const ref = doc(db, 'requests', id);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as CardRequest) : null;
  }

  async createRequest(data: Omit<CardRequest, 'id' | 'createdAt'>): Promise<CardRequest> {
    // Verificar si ya existe una solicitud pendiente para este WhatsApp y juego
    if (data.whatsapp && data.gameId) {
      const q = query(
        this.col, 
        where('whatsapp', '==', data.whatsapp), 
        where('gameId', '==', data.gameId),
        where('status', '==', 'PENDIENTE')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        throw new Error('Ya tienes una solicitud pendiente para este juego. Por favor espera a que sea procesada.');
      }
    }

    const now = Date.now();
    const newDoc = await addDoc(this.col, {
      ...data,
      status: data.status || 'PENDIENTE',
      createdAt: now
    });
    return { id: newDoc.id, ...data, status: data.status || 'PENDIENTE', createdAt: now };
  }

  async updateRequestStatus(id: RequestId, status: RequestStatus, reason?: string, gameId?: string): Promise<void> {
    const ref = doc(db, 'requests', id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status };
    if (reason) updateData.rejectionReason = reason;
    if (gameId) updateData.gameId = gameId;
    if (status === 'APROBADA') updateData.approvedAt = Date.now();
    if (status === 'RECHAZADA') updateData.rejectedAt = Date.now();
    
    await updateDoc(ref, updateData);
  }
}

export const requestRepository = new FirebaseRequestRepository();
