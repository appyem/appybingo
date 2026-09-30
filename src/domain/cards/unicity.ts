import type { CardMatrix } from '@bingo-types/index';
import { getCardFingerprintSync } from '@domain/cards/fingerprint';
export function isCardAlreadyUsed(matrix: CardMatrix, usedFingerprints: Set<string>): boolean {
  return usedFingerprints.has(getCardFingerprintSync(matrix));
}