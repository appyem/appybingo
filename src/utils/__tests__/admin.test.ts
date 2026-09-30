import { describe, it, expect } from 'vitest';
import { 
  filterRequests, 
  countRequestsByStatus, 
  countTotalRequestedCards,
  buildAdminWhatsAppLink,
  formatDate
} from '../admin';
import type { CardRequest } from '@bingo-types/index';

const mockRequests: CardRequest[] = [
  {
    id: 'APPY-ABC123',
    playerId: 'player-1',
    playerName: 'Cristian',
    whatsapp: '3215177902',
    requestedCards: 3,
    status: 'PENDIENTE',
    createdAt: Date.now()
  },
  {
    id: 'APPY-DEF456',
    playerId: 'player-2',
    playerName: 'Maria',
    whatsapp: '3001234567',
    requestedCards: 1,
    status: 'APROBADA',
    createdAt: Date.now()
  },
  {
    id: 'APPY-GHI789',
    playerId: 'player-3',
    playerName: 'Juan',
    whatsapp: '3109876543',
    requestedCards: 2,
    status: 'RECHAZADA',
    createdAt: Date.now()
  }
];

describe('Filtrado de solicitudes', () => {
  it('filtra por estado PENDIENTE', () => {
    const filtered = filterRequests(mockRequests, { status: 'PENDIENTE', search: '' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('APPY-ABC123');
  });

  it('filtra por estado APROBADA', () => {
    const filtered = filterRequests(mockRequests, { status: 'APROBADA', search: '' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('APPY-DEF456');
  });

  it('retorna todas cuando el filtro es TODAS', () => {
    const filtered = filterRequests(mockRequests, { status: 'TODAS', search: '' });
    expect(filtered).toHaveLength(3);
  });

  it('busca por ID', () => {
    const filtered = filterRequests(mockRequests, { status: 'TODAS', search: 'ABC123' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].playerName).toBe('Cristian');
  });

  it('busca por nombre', () => {
    const filtered = filterRequests(mockRequests, { status: 'TODAS', search: 'Maria' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('APPY-DEF456');
  });

  it('busca por WhatsApp', () => {
    const filtered = filterRequests(mockRequests, { status: 'TODAS', search: '3001234567' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].playerName).toBe('Maria');
  });
});

describe('Conteo de solicitudes por estado', () => {
  it('cuenta correctamente las solicitudes por estado', () => {
    const counts = countRequestsByStatus(mockRequests);
    expect(counts.PENDIENTE).toBe(1);
    expect(counts.APROBADA).toBe(1);
    expect(counts.RECHAZADA).toBe(1);
    expect(counts.EN_REVISION).toBe(0);
    expect(counts.CANCELADA).toBe(0);
  });
});

describe('Conteo total de cartones solicitados', () => {
  it('suma correctamente los cartones solicitados', () => {
    const total = countTotalRequestedCards(mockRequests);
    expect(total).toBe(6);
  });
});

describe('Construcción de enlace WhatsApp admin', () => {
  it('construye el enlace correctamente con número colombiano', () => {
    const link = buildAdminWhatsAppLink('3215177902', 'Hola');
    expect(link).toBe('whatsapp://send?phone=573215177902&text=Hola');
  });

  it('construye el enlace con número que ya tiene código de país', () => {
    const link = buildAdminWhatsAppLink('573215177902', 'Hola');
    expect(link).toBe('whatsapp://send?phone=573215177902&text=Hola');
  });
});

describe('Formateo de fecha', () => {
  it('formatea la fecha en formato colombiano', () => {
    const date = new Date(2026, 8, 30).getTime(); // 2026, Septiembre (8), 30
    const formatted = formatDate(date);
    expect(formatted).toBe('30/09/2026');
  });
});