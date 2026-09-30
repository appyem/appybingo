export function createUUID(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & 0x0f);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
export function formatCardNumber(n: number): string {
  if (!Number.isInteger(n) || n < 1) throw new Error('Requiere entero >= 1');
  return String(n).padStart(6, '0');
}