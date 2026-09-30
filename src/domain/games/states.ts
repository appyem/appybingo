import type { GameState } from '@bingo-types/index';
export const GAME_TRANSITIONS: Record<GameState, GameState[]> = {
  DRAFT: ['OPEN', 'CANCELLED'], OPEN: ['READY', 'CANCELLED'], READY: ['RUNNING', 'CANCELLED'],
  RUNNING: ['PAUSED', 'FINISHED', 'CANCELLED'], PAUSED: ['RUNNING', 'FINISHED', 'CANCELLED'], FINISHED: [], CANCELLED: [],
};
export function canTransition(from: GameState, to: GameState): boolean { return GAME_TRANSITIONS[from].includes(to); }
export function assertTransition(from: GameState, to: GameState): void {
  if (!canTransition(from, to)) throw new Error(`Transición inválida: ${from} → ${to}`);
}