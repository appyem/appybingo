import type { BingoVariant } from '@bingo-types/index';
export const BINGO_VARIANT: BingoVariant = 'BINGO_75';
export const TOTAL_BALLS = 75;
export const COLUMN_RANGES = { B: { min: 1, max: 15 }, I: { min: 16, max: 30 }, N: { min: 31, max: 45 }, G: { min: 46, max: 60 }, O: { min: 61, max: 75 } } as const;
export const COLUMNS = ['B', 'I', 'N', 'G', 'O'] as const;
export type ColumnLetter = (typeof COLUMNS)[number];
export const CARD_ROWS = 5; export const CARD_COLS = 5;
export const FREE_POSITION = { row: 2, col: 2 } as const;
export function columnForBall(ball: number): ColumnLetter | null {
  if (ball >= 1 && ball <= 15) return 'B';
  if (ball >= 16 && ball <= 30) return 'I';
  if (ball >= 31 && ball <= 45) return 'N';
  if (ball >= 46 && ball <= 60) return 'G';
  if (ball >= 61 && ball <= 75) return 'O';
  return null;
}