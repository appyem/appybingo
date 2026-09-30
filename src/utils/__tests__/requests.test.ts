import { describe, it, expect } from 'vitest';
import { 
  generateRequestId, 
  normalizeWhatsApp, 
  isValidWhatsApp, 
  formatWhatsAppDisplay,
  buildWhatsAppRequestMessage,
  buildWhatsAppDeepLink
} from '../requests';

describe('Generacion de Request ID', () => {
  it('genera un ID con formato APPY-XXXXXX', () => {
    const id = generateRequestId();
    expect(id).toMatch(/^APPY-[A-Z0-9]{6}$/);
  });
  it('genera IDs unicos', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateRequestId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('Normalizacion y validacion de WhatsApp', () => {
  it('normaliza numeros eliminando caracteres no numericos', () => {
    expect(normalizeWhatsApp('+57 321 517 7902')).toBe('573215177902');
    expect(normalizeWhatsApp('321-517-7902')).toBe('3215177902');
  });

  it('valida numeros colombianos validos', () => {
    expect(isValidWhatsApp('3215177902')).toBe(true);
    expect(isValidWhatsApp('573215177902')).toBe(true);
    expect(isValidWhatsApp('+57 321 517 7902')).toBe(true);
  });

  it('rechaza numeros invalidos', () => {
    expect(isValidWhatsApp('300123456')).toBe(false);
    expect(isValidWhatsApp('571234567890')).toBe(false);
    expect(isValidWhatsApp('abc')).toBe(false);
  });

  it('formatea para visualizacion', () => {
    expect(formatWhatsAppDisplay('3215177902')).toBe('321 517 7902');
    expect(formatWhatsAppDisplay('573215177902')).toBe('+57 321 517 7902');
  });
});

describe('Construccion de mensaje y Deep Link', () => {
  it('construye el mensaje correctamente', () => {
    const msg = buildWhatsAppRequestMessage('Cristian', '321 517 7902', 3, 'APPY-8F42K7');
    expect(msg).toContain('Cristian');
    expect(msg).toContain('321 517 7902');
    expect(msg).toContain('3');
    expect(msg).toContain('APPY-8F42K7');
    expect(msg).toContain('metodos de pago');
  });

  it('construye el deep link nativo de WhatsApp correctamente', () => {
    const link = buildWhatsAppDeepLink('Hola Mundo');
    expect(link).toBe('whatsapp://send?phone=573215177902&text=Hola%20Mundo');
    expect(link).not.toContain('wa.me');
    expect(link).not.toContain('api.whatsapp.com');
  });
});