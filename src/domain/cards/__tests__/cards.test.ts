import { describe, it, expect } from 'vitest';
import { generateBingoCard } from '@domain/cards/generator';
import { validateBingoCard } from '@domain/cards/validator';
import { getCardFingerprint, getCardFingerprintSync } from '@domain/cards/fingerprint';
import { isCardAlreadyUsed } from '@domain/cards/unicity';
import { generateUniqueValidCard } from '@domain/cards/service';
import { COLUMN_RANGES } from '@domain/bingo/constants';
import type { CardMatrix } from '@bingo-types/index';

describe('TEST 1: Generación válida', () => {
  it('genera matriz 5x5 con FREE en el centro', () => {
    const card = generateBingoCard();
    expect(card).toHaveLength(5);
    for (const row of card) expect(row).toHaveLength(5);
    expect(card[2][2]).toBe('FREE');
  });
});
describe('TEST 2-6: Rangos correctos', () => {
  it('cada número está en su rango', () => {
    const card = generateBingoCard();
    const cols = ['B', 'I', 'N', 'G', 'O'] as const;
    cols.forEach((col, ci) => {
      const { min, max } = COLUMN_RANGES[col];
      for (let r = 0; r < 5; r++) {
        if (col === 'N' && r === 2) continue;
        const v = card[r][ci];
        expect(typeof v).toBe('number');
        expect(v as number).toBeGreaterThanOrEqual(min);
        expect(v as number).toBeLessThanOrEqual(max);
      }
    });
  });
});
describe('TEST 7: Sin duplicados', () => {
  it('no hay números repetidos en una columna', () => {
    const card = generateBingoCard();
    for (let c = 0; c < 5; c++) {
      const nums: number[] = [];
      for (let r = 0; r < 5; r++) { const v = card[r][c]; if (typeof v === 'number') nums.push(v); }
      expect(new Set(nums).size).toBe(nums.length);
    }
  });
});
describe('TEST 8: FREE ubicado', () => {
  it('solo la celda central es FREE', () => {
    const card = generateBingoCard();
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) expect(card[r][c]).toBe('FREE');
      else expect(card[r][c]).not.toBe('FREE');
    }
  });
});
describe('TEST 9 y 10: Validación', () => {
  it('acepta cartón válido', () => { expect(validateBingoCard(generateBingoCard()).valid).toBe(true); });
  it('rechaza cartón inválido', () => {
    const bad: CardMatrix = JSON.parse(JSON.stringify(generateBingoCard()));
    bad[0][0] = 99 as import("../../../types").CardCell;
    expect(validateBingoCard(bad).valid).toBe(false);
  });
});
describe('TEST 11: Fingerprint consistente', async () => {
  it('mismo cartón = mismo fingerprint', async () => {
    const card = generateBingoCard();
    expect(await getCardFingerprint(card)).toBe(await getCardFingerprint(card));
    expect(getCardFingerprintSync(card)).toBe(getCardFingerprintSync(card));
  });
});
describe('TEST 12: Fingerprints distintos', async () => {
  it('cartones diferentes = fingerprints diferentes', async () => {
    expect(await getCardFingerprint(generateBingoCard())).not.toBe(await getCardFingerprint(generateBingoCard()));
  });
});
describe('TEST 13: Detección de usado', () => {
  it('detecta fingerprint existente', () => {
    const card = generateBingoCard();
    const set = new Set<string>();
    expect(isCardAlreadyUsed(card, set)).toBe(false);
    set.add(getCardFingerprintSync(card));
    expect(isCardAlreadyUsed(card, set)).toBe(true);
  });
});
describe('TEST 14: Aislamiento entre partidas', () => {
  it('mismo cartón en partidas distintas no es duplicado', () => {
    const card = generateBingoCard();
    const setA = new Set<string>(), setB = new Set<string>();
    setA.add(getCardFingerprintSync(card));
    expect(isCardAlreadyUsed(card, setB)).toBe(false);
    expect(isCardAlreadyUsed(card, setA)).toBe(true);
  });
});
describe('TEST 15: Unicidad en lote', () => {
  it('genera 200 cartones sin repetir fingerprint', () => {
    const used = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const { fingerprint, matrix } = generateUniqueValidCard(used);
      expect(used.has(fingerprint)).toBe(false);
      used.add(fingerprint);
      expect(validateBingoCard(matrix).valid).toBe(true);
    }
    expect(used.size).toBe(200);
  });
});