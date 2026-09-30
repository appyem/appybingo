import { describe, it, expect } from 'vitest';
import { canTransition, assertTransition } from '@domain/games/states';
describe('Transiciones de partida', () => {
  it('permite DRAFT → OPEN', () => { expect(canTransition('DRAFT', 'OPEN')).toBe(true); });
  it('rechaza DRAFT → RUNNING', () => { expect(canTransition('DRAFT', 'RUNNING')).toBe(false); });
  it('rechaza FINISHED → cualquier cosa', () => { expect(canTransition('FINISHED', 'RUNNING')).toBe(false); });
  it('assertTransition lanza error en inválida', () => { expect(() => assertTransition('DRAFT', 'RUNNING')).toThrow(); });
});