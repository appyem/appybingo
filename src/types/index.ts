export type UUID = string;
export type GameId = UUID; export type PlayerId = UUID; export type CardId = UUID; export type DrawId = UUID;
export type BingoVariant = 'BINGO_75';
export type CardCell = number | 'FREE' | null;
export type CardMatrix = [[CardCell,CardCell,CardCell,CardCell,CardCell],[CardCell,CardCell,CardCell,CardCell,CardCell],[CardCell,CardCell,CardCell,CardCell,CardCell],[CardCell,CardCell,CardCell,CardCell,CardCell],[CardCell,CardCell,CardCell,CardCell,CardCell]];
export type GameState = 'DRAFT' | 'OPEN' | 'READY' | 'RUNNING' | 'PAUSED' | 'FINISHED' | 'CANCELLED';
export type CardStatus = 'AVAILABLE' | 'ASSIGNED' | 'ACTIVE' | 'WINNER' | 'INVALID' | 'CANCELLED';
export type PlayerStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'ASSIGNED' | 'CONNECTED' | 'PLAYING' | 'FINISHED' | 'DISCONNECTED';
export interface Game { id: GameId; name: string; variant: BingoVariant; state: GameState; createdAt: number; updatedAt: number; createdBy: string; }
export interface Player { id: PlayerId; gameId: GameId; displayName: string; status: PlayerStatus; createdAt: number; updatedAt: number; }
export interface Card { id: CardId; gameId: GameId; playerId: PlayerId | null; cardNumber: number; cardNumberFormatted: string; fingerprint: string; matrix: CardMatrix; status: CardStatus; createdAt: number; assignedAt: number | null; }
export interface Draw { id: DrawId; gameId: GameId; sequence: number[]; currentBall: number | null; startedAt: number | null; finishedAt: number | null; }
export interface Winner { id: UUID; gameId: GameId; cardId: CardId; playerId: PlayerId; playerName: string; cardNumberFormatted: string; pattern: string; winningBall: number; createdAt: number; }
export interface Administrator { id: UUID; email: string; displayName: string; role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR'; createdAt: number; }