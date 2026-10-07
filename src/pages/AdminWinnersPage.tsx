import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { cardRepository, requestRepository } from '../repositories';
import { MessageCircle } from 'lucide-react';
import type { Card, CardRequest } from '@bingo-types/index';

interface WinnerData {
  card: Card;
  request: CardRequest | null;
}

export function AdminWinnersPage() {
  const [winners, setWinners] = useState<WinnerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWinners = async () => {
      try {
        const allCards = await cardRepository.getCards();
        const winningCards = allCards.filter(c => c.status === 'WINNER');
        
        const enrichedWinners = await Promise.all(winningCards.map(async (card) => {
          const request = await requestRepository.getRequestById(card.requestId);
          return { card, request };
        }));
        
        // Ordenar por fecha de reclamo (el primero en gritar bingo va primero)
        enrichedWinners.sort((a, b) => (a.card.bingoClaimedAt || 0) - (b.card.bingoClaimedAt || 0));
        setWinners(enrichedWinners);
      } catch (err) {
        console.error('Error cargando ganadores:', err);
      } finally {
        setLoading(false);
      }
    };
    loadWinners();
  }, []);

  const sendWhatsApp = (whatsapp: string, playerName: string) => {
    const normalizedPhone = whatsapp.replace(/\D/g, '');
    const message = `¡Felicidades ${playerName}! 🎉 Has ganado el Premio Mayor en AppyBingo. Por favor, indícanos por qué medio deseas recibir tu premio: Nequi, Daviplata o Cuenta Bancaria. ¡Quedamos atentos para coordinar el pago!`;
    const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('es-CO');
  };

  return (
    <>
      
      <style>{`
        @media (max-width: 768px) {
          .admin-table-container {
            overflow-x: hidden !important;
            overflow-y: auto !important;
            max-height: 65vh;
            -webkit-overflow-scrolling: touch;
          }
          .admin-table, .admin-table tbody, .admin-table tr, .admin-table td {
            display: block;
            width: 100%;
            box-sizing: border-box;
          }
          .admin-table thead {
            display: none;
          }
          .admin-table tr {
            margin-bottom: 0.75rem;
            background: var(--color-bg-elevated);
            border-radius: var(--radius-md);
            padding: 0.75rem;
            border: 1px solid var(--color-border);
          }
          .admin-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--color-border);
            font-size: 0.875rem;
          }
          .admin-table td:last-child {
            border-bottom: none;
            justify-content: flex-end;
            margin-top: 0.25rem;
          }
          .admin-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: var(--color-text-muted);
            flex-shrink: 0;
            margin-right: 1rem;
            text-align: left;
          }
        }
      `}</style>

      <AdminLayout currentPath="/admin/winners">
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', marginBottom: '2rem' }}>🏆 Ganadores Registrados</h1>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando ganadores...</div>
        ) : winners.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>Aún no hay ganadores registrados. ¡El próximo puede ser ahora!</p>
          </div>
        ) : (
          <div className="admin-table-container" style={{ overflowX: 'auto', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-elevated)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Jugador</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>WhatsApp</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Cartón</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Fecha/Hora de Reclamo</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((winner, idx) => (
                  <tr key={winner.card.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td data-label="Jugador" style={{ padding: '1rem', color: 'white', fontWeight: 600 }}>
                      {winner.request?.playerName || 'Desconocido'}
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Solicitud: {winner.card.requestId}</div>
                    </td>
                    <td data-label="WhatsApp" style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                      {winner.request?.whatsapp || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--color-primary)', fontWeight: 700, fontFamily: 'monospace' }}>
                      {winner.card.cardNumberFormatted}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      {formatDate(winner.card.bingoClaimedAt)}
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, marginTop: '0.25rem' }}>
                        #{idx + 1} en reclamar
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {winner.request?.whatsapp && (
                        <button
                          onClick={() => sendWhatsApp(winner.request!.whatsapp, winner.request!.playerName)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#25D366',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <MessageCircle size={16} />
                          Contactar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
    </>
  );
}
