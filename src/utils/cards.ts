import type { Card } from '@bingo-types/index';

export function getCardUrl(cardId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://appybingo.com';
  return baseUrl + '/#/carton/' + cardId;
}

export function buildApprovedWhatsAppMessage(playerName: string, requestId: string, cards: Card[]): string {
  const list = cards.map(c => 'Cartón ' + c.cardNumberFormatted + ':\n' + c.url).join('\n\n');
  return 'Hola ' + playerName + '.\n\nTu solicitud de AppyBingo (' + requestId + ') fue aprobada.\n\nTus cartones ya están disponibles:\n\n' + list + '\n\n¡Buena suerte!';
}