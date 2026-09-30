// NOTA ARQUITECTONICA: 
// generateRequestId es temporal para Fase 3. 
// En fases posteriores, este ID debe ser generado y controlado por el Backend/Firebase 
// para garantizar unicidad global y seguridad.

export function generateRequestId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'APPY-';
  const array = new Uint8Array(6);
  globalThis.crypto.getRandomValues(array);
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(array[i] % chars.length);
  }
  return result;
}

export function normalizeWhatsApp(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isValidWhatsApp(phone: string): boolean {
  const normalized = normalizeWhatsApp(phone);
  return /^3\d{9}$/.test(normalized) || /^573\d{9}$/.test(normalized);
}

export function formatWhatsAppDisplay(phone: string): string {
  const normalized = normalizeWhatsApp(phone);
  if (normalized.startsWith('57')) {
    return '+57 ' + normalized.slice(2, 5) + ' ' + normalized.slice(5, 8) + ' ' + normalized.slice(8);
  }
  return normalized.slice(0, 3) + ' ' + normalized.slice(3, 6) + ' ' + normalized.slice(6);
}

export function buildWhatsAppRequestMessage(name: string, phone: string, quantity: number, requestId: string): string {
  return "Hola, quiero solicitar cartones de AppyBingo.\n\nNombre:\n" + name + "\n\nWhatsApp:\n" + phone + "\n\nCantidad de cartones:\n" + quantity + "\n\nID de solicitud:\n" + requestId + "\n\nQuedo atento a los metodos de pago y al proceso de aprobacion.";
}

export function buildWhatsAppDeepLink(message: string): string {
  const officialPhone = '573215177902';
  return "whatsapp://send?phone=" + officialPhone + "&text=" + encodeURIComponent(message);
}