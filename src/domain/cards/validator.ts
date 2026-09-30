import type { CardMatrix } from '@bingo-types/index';
import { CARD_ROWS, COLUMN_RANGES, FREE_POSITION } from '@domain/bingo/constants';
export interface ValidationResult { valid: boolean; errors: string[]; }
export function validateBingoCard(matrix: CardMatrix): ValidationResult {
  const errors: string[] = [];
  if (!Array.isArray(matrix) || matrix.length !== CARD_ROWS) return { valid: false, errors: ['Debe tener 5 filas'] };
  const columns = ['B', 'I', 'N', 'G', 'O'] as const;
  columns.forEach((col, colIndex) => {
    const { min, max } = COLUMN_RANGES[col];
    const seen = new Set<number>();
    for (let row = 0; row < CARD_ROWS; row++) {
      const cell = matrix[row][colIndex];
      if (col === 'N' && row === FREE_POSITION.row) {
        if (cell !== 'FREE') errors.push('Centro debe ser FREE');
        continue;
      }
      if (cell === 'FREE') { errors.push('FREE solo en centro'); continue; }
      if (typeof cell !== 'number' || !Number.isInteger(cell)) { errors.push('Celda no es entero'); continue; }
      if (cell < min || cell > max) errors.push(`Número ${cell} fuera de rango ${col}`);
      if (seen.has(cell)) errors.push(`Duplicado ${cell} en ${col}`);
      seen.add(cell);
    }
  });
  return { valid: errors.length === 0, errors };
}