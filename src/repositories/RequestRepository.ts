import type { CardRequest, RequestId, RequestStatus } from '@bingo-types/index';

export interface RequestRepository {
  getRequests(): Promise<CardRequest[]>;
  getRequestById(id: RequestId): Promise<CardRequest | null>;
  createRequest(data: Omit<CardRequest, 'id' | 'createdAt'>): Promise<CardRequest>;
  updateRequestStatus(id: RequestId, status: RequestStatus, reason?: string, gameId?: string): Promise<void>;
}
