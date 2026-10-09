export type UUID = string;
export type GameId = UUID;
export type PlayerId = UUID;
export type CardId = UUID;
export type DrawId = UUID;
export type RequestId = string;

export type BingoVariant = 'BINGO_75';
export type CardCell = number | 'FREE' | null;
export type CardMatrix = [
  [CardCell, CardCell, CardCell, CardCell, CardCell],
  [CardCell, CardCell, CardCell, CardCell, CardCell],
  [CardCell, CardCell, CardCell, CardCell, CardCell],
  [CardCell, CardCell, CardCell, CardCell, CardCell],
  [CardCell, CardCell, CardCell, CardCell, CardCell],
];

export type GameState = 'DRAFT' | 'OPEN' | 'READY' | 'RUNNING' | 'PAUSED' | 'FINISHED' | 'CANCELLED';
export type CardStatus = 'AVAILABLE' | 'ASSIGNED' | 'ACTIVE' | 'WINNER' | 'INVALID' | 'CANCELLED';
export type PlayerStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'ASSIGNED' | 'CONNECTED' | 'PLAYING' | 'FINISHED' | 'DISCONNECTED';
export type RequestStatus = 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
export type PrizeType = 'CASH' | 'PRODUCT';

export interface Game {
  id: GameId; name: string; variant: BingoVariant; state: GameState;
  createdAt: number; updatedAt: number; createdBy: string;
  pricePerCard: number;
  prizeType?: PrizeType;
  prizeValue?: number;
  prizeName?: string;
  prizeDescription?: string;
  prizeImageUrl?: string;
  scheduledAt?: number;
  currentBall?: number | null;
  drawnNumbers?: number[];
}

export interface Player {
  id: PlayerId; name: string; whatsapp: string; status: PlayerStatus;
  createdAt: number; updatedAt: number;
}

export interface CardRequest {
  id: RequestId; playerId: PlayerId; playerName: string; whatsapp: string;
  requestedCards: number; status?: RequestStatus; gameId?: GameId;
  rejectionReason?: string; createdAt: number; approvedAt?: number; rejectedAt?: number;
}

export interface Card {
  id: CardId; gameId: GameId; playerId: PlayerId; requestId: RequestId;
  cardNumberFormatted: string; fingerprint: string; matrix: CardMatrix;
  status: CardStatus; createdAt: number; assignedAt: number; url: string;
  openedDeviceId?: string;
  openedAt?: number;
  markedNumbers?: number[];
  bingoClaimedAt?: number;
  bingoClaimedBy?: string;
}

export interface Draw {
  id: DrawId; gameId: GameId; sequence: number[]; currentBall: number | null;
  startedAt: number | null; finishedAt: number | null;
}

export interface Winner {
  id: UUID; gameId: GameId; cardId: CardId; playerId: PlayerId;
  playerName: string; cardNumberFormatted: string; pattern: string;
  winningBall: number; createdAt: number;
}

export interface Administrator {
  id: UUID; email: string; displayName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR'; createdAt: number;
}