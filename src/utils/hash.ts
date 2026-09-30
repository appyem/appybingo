export async function sha256Hex(input: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const buf = new TextEncoder().encode(input);
    const hash = await globalThis.crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return fnv1a64Hex(input);
}
export function fnv1a64Hex(input: string): string {
  let h = 0xcbf29ce484222325n; const prime = 0x100000001b3n;
  for (let i = 0; i < input.length; i++) { h ^= BigInt(input.charCodeAt(i)); h = (h * prime) & 0xffffffffffffffffn; }
  return h.toString(16).padStart(16, '0');
}