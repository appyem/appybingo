export function secureRandomInt(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error('secureRandomInt requiere enteros');
  }
  if (min > max) throw new Error('secureRandomInt: min > max');
  if (min === max) return min;

  const range = max - min + 1;
  const limit = Math.floor(0xffffffff / range) * range;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    globalThis.crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return min + (value % range);
}

export function secureShuffle<T>(arr: T[], rng: (min: number, max: number) => number = secureRandomInt): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
