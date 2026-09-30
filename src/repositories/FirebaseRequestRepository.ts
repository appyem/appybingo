import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CardRequest, RequestId, RequestStatus, GameId } from '@bingo-types/index';
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

  async createRequest(data: Omit<CardRequest, 'id' | 'createdAt' | 'status'>): Promise<CardRequest> {
    const newDoc = await addDoc(this.col, {
      ...data,
      status: 'PENDIENTE',
      createdAt: Date.now()
    });
    return { id: newDoc.id, ...data, status: 'PENDIENTE', createdAt: Date.now() };
  }

  async updateRequestStatus(id: RequestId, status: RequestStatus, reason?: string, gameId?: GameId): Promise<void> {
    const ref = doc(db, 'requests', id);
    const updateData: Record<string, unknown> = { status, updatedAt: Date.now() };
    if (status === 'APROBADA') {
      updateData.approvedAt = Date.now();
      if (gameId) updateData.gameId = gameId;
    }
    if (status === 'RECHAZADA') {
      updateData.rejectedAt = Date.now();
      if (reason) updateData.rejectionReason = reason;
    }
    await updateDoc(ref, updateData);
  }
}

export const requestRepository = new FirebaseRequestRepository();