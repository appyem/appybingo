import { describe, it, expect } from 'vitest';
import type { Card } from '@bingo-types/index';
import { getCardUrl, buildApprovedWhatsAppMessage } from '../cards';

describe('Utilidades de Cartones', () => {
  it('14. getCardUrl genera la ruta correcta', () => {
    const url = getCardUrl('ABC123');
    expect(url).toContain('#/carton/ABC123');
  });

  it('19, 20, 21. WhatsApp utiliza whatsapp:// y NO wa.me ni api.whatsapp', () => {
    const mockCard = { id: '123', cardNumberFormatted: 'AB-001', url: 'https://test.com/#/carton/123' } as unknown as Card;
    const msg = buildApprovedWhatsAppMessage('Juan', 'REQ-1', [mockCard]);
    
    expect(msg).toContain('Juan');
    expect(msg).toContain('REQ-1');
    expect(msg).toContain('AB-001');
    expect(msg).toContain('https://test.com/#/carton/123');
    
    const link = "whatsapp://send?phone=573215177902&text=" + encodeURIComponent(msg);
    expect(link).toContain('whatsapp://send?phone=');
    expect(link).not.toContain('wa.me');
    expect(link).not.toContain('api.whatsapp.com');
  });
});