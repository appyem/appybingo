import type { CardRequest, RequestId, RequestStatus, GameId } from '@bingo-types/index';

export interface RequestRepository {
  getRequests(): Promise<CardRequest[]>;
  getRequestById(id: RequestId): Promise<CardRequest | null>;
  createRequest(data: Omit<CardRequest, 'id' | 'createdAt' | 'status'>): Promise<CardRequest>;
  updateRequestStatus(id: RequestId, status: RequestStatus, reason?: string, gameId?: GameId): Promise<void>;
}
