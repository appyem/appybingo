import type { CardMatrix } from '@bingo-types/index';
import { generateBingoCard } from '@domain/cards/generator';
import { validateBingoCard } from '@domain/cards/validator';
import { getCardFingerprintSync } from '@domain/cards/fingerprint';
import { isCardAlreadyUsed } from '@domain/cards/unicity';
export interface CardGenerationResult { matrix: CardMatrix; fingerprint: string; }
export function generateUniqueValidCard(usedFingerprints: Set<string>, maxAttempts = 100): CardGenerationResult {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateBingoCard();
    if (!validateBingoCard(candidate).valid) continue;
    if (isCardAlreadyUsed(candidate, usedFingerprints)) continue;
    return { matrix: candidate, fingerprint: getCardFingerprintSync(candidate) };
  }
  throw new Error('No se pudo generar un cartón único.');
}