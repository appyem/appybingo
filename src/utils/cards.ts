import type { Card } from '@bingo-types/index';

export function getCardUrl(cardId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://appybingo.com';
  return baseUrl + '/#/carton/' + cardId;
}

export function buildApprovedWhatsAppMessage(playerName: string, requestId: string, cards: Card[]): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://appybingo.com';
  const myCardsUrl = baseUrl + '/#/mis-cartones';
  
  let message = 'Hola ' + playerName + '.\n\n';
  message += 'Tu solicitud de AppyBingo (' + requestId + ') fue aprobada. 🎉\n\n';
  message += 'Tienes ' + cards.length + ' cartón(es) disponible(s) para jugar.\n\n';
  message += '👉 Haz clic aquí para ver y jugar todos tus cartones juntos en una sola pantalla:\n';
  message += myCardsUrl + '\n\n';
  message += '¡Mucha suerte! 🍀';
  
  return message;
}