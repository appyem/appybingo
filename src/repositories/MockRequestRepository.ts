import type { CardRequest, RequestId, RequestStatus, GameId } from '@bingo-types/index';
import type { RequestRepository } from './RequestRepository';

const initialMockRequests: CardRequest[] = [
  {
    id: 'APPY-ABC123', playerId: 'player-1', playerName: 'Cristian Rodriguez', whatsapp: '3215177902',
    requestedCards: 3, status: 'PENDIENTE', createdAt: Date.now() - 86400000
  },
  {
    id: 'APPY-DEF456', playerId: 'player-2', playerName: 'Maria Garcia', whatsapp: '3001234567',
    requestedCards: 1, status: 'APROBADA', createdAt: Date.now() - 172800000, approvedAt: Date.now() - 86400000
  },
  {
    id: 'APPY-GHI789', playerId: 'player-3', playerName: 'Juan Perez', whatsapp: '3109876543',
    requestedCards: 2, status: 'RECHAZADA', createdAt: Date.now() - 259200000,
    rejectedAt: Date.now() - 172800000, rejectionReason: 'Pago no confirmado'
  },
  {
    id: 'APPY-JKL012', playerId: 'player-4', playerName: 'Ana Martinez', whatsapp: '3207654321',
    requestedCards: 5, status: 'PENDIENTE', createdAt: Date.now() - 43200000
  },
  {
    id: 'APPY-MNO345', playerId: 'player-5', playerName: 'Carlos Lopez', whatsapp: '3154321098',
    requestedCards: 2, status: 'EN_REVISION', createdAt: Date.now() - 21600000
  }
];

export class MockRequestRepository implements RequestRepository {
  private requests: CardRequest[] = [...initialMockRequests];

  async getRequests() { return [...this.requests]; }
  
  async getRequestById(id: RequestId) {
    const req = this.requests.find(r => r.id === id);
    return req ? { ...req } : null;
  }

  async createRequest(data: Omit<CardRequest, 'id' | 'createdAt' | 'status'>) {
    const newRequest: CardRequest = {
      ...data,
      id: 'APPY-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'PENDIENTE',
      createdAt: Date.now()
    };
    this.requests.push(newRequest);
    return newRequest;
  }

  async updateRequestStatus(id: RequestId, status: RequestStatus, reason?: string, gameId?: GameId) {
    const index = this.requests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Solicitud no encontrada');
    
    const current = this.requests[index];
    this.requests[index] = {
      ...current,
      status,
      rejectionReason: reason,
      approvedAt: status === 'APROBADA' ? Date.now() : current.approvedAt,
      rejectedAt: status === 'RECHAZADA' ? Date.now() : current.rejectedAt,
      ...(status === 'APROBADA' && gameId ? { gameId } : {})
    };
  }
}

export const requestRepository = new MockRequestRepository();