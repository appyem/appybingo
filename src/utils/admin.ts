import type { CardRequest, RequestStatus } from '@bingo-types/index';

export type RequestFilter = 'TODAS' | RequestStatus;

export interface RequestFilters {
  status: RequestFilter;
  search: string;
}

export function filterRequests(requests: CardRequest[], filters: RequestFilters): CardRequest[] {
  let filtered = requests;

  if (filters.status !== 'TODAS') {
    filtered = filtered.filter(r => r.status === filters.status);
  }

  if (filters.search.trim()) {
    const search = filters.search.toLowerCase().trim();
    filtered = filtered.filter(r => 
      r.id.toLowerCase().includes(search) ||
      r.playerName.toLowerCase().includes(search) ||
      r.whatsapp.includes(search)
    );
  }

  return filtered;
}

export function countRequestsByStatus(requests: CardRequest[]): Record<RequestStatus, number> {
  const counts: Record<RequestStatus, number> = {
    PENDIENTE: 0,
    EN_REVISION: 0,
    APROBADA: 0,
    RECHAZADA: 0,
    CANCELADA: 0
  };

  requests.forEach(r => {
    counts[r.status]++;
  });

  return counts;
}

export function countTotalRequestedCards(requests: CardRequest[]): number {
  return requests.reduce((sum, r) => sum + r.requestedCards, 0);
}

export function buildAdminWhatsAppLink(whatsapp: string, message: string): string {
  const normalizedPhone = whatsapp.replace(/\D/g, '');
  const phone = normalizedPhone.startsWith('57') ? normalizedPhone : '57' + normalizedPhone;
  return "whatsapp://send?phone=" + phone + "&text=" + encodeURIComponent(message);
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}