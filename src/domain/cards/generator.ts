import type { CardMatrix } from '@bingo-types/index';
import { COLUMN_RANGES, FREE_POSITION } from '@domain/bingo/constants';
import { secureRandomInt, secureShuffle } from '@utils/random';
export function generateBingoCard(): CardMatrix {
  const matrix: CardMatrix = [[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null]];
  const columns = ['B', 'I', 'N', 'G', 'O'] as const;
  columns.forEach((col, colIndex) => {
    const { min, max } = COLUMN_RANGES[col];
    const pool: number[] = [];
    for (let n = min; n <= max; n++) pool.push(n);
    const picks = secureShuffle(pool, secureRandomInt).slice(0, 5);
    for (let row = 0; row < 5; row++) {
      matrix[row][colIndex] = (col === 'N' && row === FREE_POSITION.row) ? 'FREE' : picks[row];
    }
  });
  return matrix;
}