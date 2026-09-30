import type { CardMatrix } from '@bingo-types/index';
import { sha256Hex, fnv1a64Hex } from '@utils/hash';
export function canonicalizeCard(matrix: CardMatrix): string {
  const parts: string[] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) parts.push(matrix[r][c] === 'FREE' || matrix[r][c] === null ? 'F' : String(matrix[r][c]));
  return parts.join('|');
}
export async function getCardFingerprint(matrix: CardMatrix): Promise<string> { return sha256Hex(canonicalizeCard(matrix)); }
export function getCardFingerprintSync(matrix: CardMatrix): string { return fnv1a64Hex(canonicalizeCard(matrix)); }