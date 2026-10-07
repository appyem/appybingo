import type { CardRequest, RequestId, RequestStatus } from '@bingo-types/index';
import type { RequestRepository } from './RequestRepository';

export class MockRequestRepository implements RequestRepository {
  private requests: CardRequest[] = [];

  async getRequests(): Promise<CardRequest[]> {
    return this.requests;
  }

  async getRequestById(id: RequestId): Promise<CardRequest | null> {
    return this.requests.find(r => r.id === id) || null;
  }

  async createRequest(data: Omit<CardRequest, 'id' | 'createdAt'>): Promise<CardRequest> {
    const newRequest: CardRequest = {
      id: 'APPY-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      ...data,
      status: data.status || 'PENDIENTE',
      createdAt: Date.now()
    };
    this.requests.push(newRequest);
    return newRequest;
  }

  async updateRequestStatus(id: RequestId, status: RequestStatus, reason?: string, gameId?: string): Promise<void> {
    const index = this.requests.findIndex(r => r.id === id);
    if (index !== -1) {
      const updateData: Partial<CardRequest> = { status };
      if (reason) updateData.rejectionReason = reason;
      if (gameId) updateData.gameId = gameId;
      if (status === 'APROBADA') updateData.approvedAt = Date.now();
      if (status === 'RECHAZADA') updateData.rejectedAt = Date.now();
      
      this.requests[index] = {
        ...this.requests[index],
        ...updateData
      };
    }
  }
}

export const requestRepository = new MockRequestRepository();
