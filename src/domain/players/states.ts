import type { PlayerStatus } from '@bingo-types/index';
export const PLAYER_TRANSITIONS: Record<PlayerStatus, PlayerStatus[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'], APPROVED: ['ASSIGNED', 'REJECTED'], REJECTED: [],
  ASSIGNED: ['CONNECTED', 'DISCONNECTED'], CONNECTED: ['PLAYING', 'DISCONNECTED'],
  PLAYING: ['FINISHED', 'DISCONNECTED'], FINISHED: ['DISCONNECTED'], DISCONNECTED: ['CONNECTED'],
};
export function canTransitionPlayer(from: PlayerStatus, to: PlayerStatus): boolean { return PLAYER_TRANSITIONS[from].includes(to); }