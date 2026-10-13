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
    // Verificar duplicados: si ya existe una solicitud activa para este whatsapp y gameId
    if (data.whatsapp && data.gameId) {
      try {
        // Consulta de un solo campo para evitar errores de índices compuestos en Firestore
        const q = query(this.col, where('whatsapp', '==', data.whatsapp));
        const snapshot = await getDocs(q);
        
        const isDuplicate = snapshot.docs.some(d => {
          const reqData = d.data() as Record<string, unknown>;
          return reqData.gameId === data.gameId && 
                 (reqData.status === 'PENDIENTE' || reqData.status === 'EN_REVISION' || reqData.status === 'APROBADA');
        });
        
        if (isDuplicate) {
          throw new Error('DUPLICATE_WHATSAPP');
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        if (error.message === 'DUPLICATE_WHATSAPP') {
          throw err; // Relanzamos el error específico para que la UI lo maneje
        }
        // Si es otro error de Firestore, lo logueamos pero no bloqueamos para no detener el flujo
        console.warn('⚠️ Error verificando duplicados en Firestore:', err);
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
