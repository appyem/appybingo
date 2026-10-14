import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { gameRepository, requestRepository, cardRepository } from '../repositories';
import type { Game, CardRequest, Card } from '@bingo-types/index';
import { Trophy, Users, Ticket, DollarSign, Share2, ArrowLeft } from 'lucide-react';

export function OrganizerReportPage() {
  const hash = window.location.hash;
  const gameId = hash.startsWith('#/organizador/') 
    ? hash.replace('#/organizador/', '').replace('/reporte', '').trim() 
    : null;
  
  const [game, setGame] = useState<Game | null>(null);
  const [requests, setRequests] = useState<CardRequest[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(!!gameId);

  useEffect(() => {
    if (!gameId) return;
    
    const loadData = async () => {
      try {
        const gameData = await gameRepository.getGameById(gameId);
        if (!gameData) { setLoading(false); return; }
        setGame(gameData);

        const allRequests = await requestRepository.getRequests();
        const gameRequests = allRequests.filter(req => req.gameId === gameId && req.status === 'APROBADA');
        setRequests(gameRequests);

        const allCards = await cardRepository.getCards();
        const gameCards = allCards.filter(c => c.gameId === gameId);
        setCards(gameCards);
      } catch (err) {
        console.error('Error cargando reporte:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [gameId]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Cargando resumen...</div>;
  }

  if (!game) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>Juego no encontrado.</div>
        <Button variant="primary" onClick={() => { window.location.hash = '#/'; }}>Volver al Inicio</Button>
      </div>
    );
  }

  const totalCards = cards.length;
  const totalRevenue = totalCards * game.pricePerCard;
  const uniquePlayers = requests.length;
  
  const winningCard = cards.find(c => c.status === 'WINNER');
  const winningRequest = winningCard ? requests.find(r => r.id === winningCard.requestId) : null;
  const winnerName = winningRequest?.playerName || 'Por definir';
  const winningBall = game.currentBall || (game.drawnNumbers?.length ? game.drawnNumbers[game.drawnNumbers.length - 1] : 'N/A');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  const handleShare = () => {
    const text = `📊 *RESUMEN FINAL - ${game.name}* 📊\n\n` +
      `🎟️ Cartones vendidos: ${totalCards}\n` +
      `💰 Total Recaudado: ${formatCurrency(totalRevenue)}\n` +
      `👥 Jugadores únicos: ${uniquePlayers}\n\n` +
      `🏆 *GANADOR*: ${winnerName}\n` +
      `🎫 Cartón: ${winningCard?.cardNumberFormatted || 'N/A'}\n` +
      `🎱 Balota ganadora: ${winningBall}\n\n` +
      `¡Gracias por jugar con AppyBingo! 🍀`;
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Button variant="ghost" size="sm" onClick={() => { window.location.hash = `#/organizador/${gameId}`; }} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Volver al Panel
        </Button>

        <div style={{ 
          background: 'linear-gradient(135deg, #1a1a24 0%, #2d1b4e 100%)',
          border: '2px solid rgba(252, 191, 73, 0.3)',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Marca de agua de fondo */}
          <img src="/logo.png" alt="AppyBingo" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', width: '80%', opacity: 0.05, pointerEvents: 'none' }} />

          <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: '#FCBF49', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: '0.5rem' }}>
              ✅ Partida Finalizada
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.2 }}>{game.name}</h1>
            {game.sponsorName && game.sponsorName !== 'AppyBingo' && (
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                Patrocinado por: <strong style={{ color: '#FCBF49' }}>{game.sponsorName}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Ticket size={24} color="#FCBF49" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Cartones</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{totalCards}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <DollarSign size={24} color="#2A9D8F" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Recaudado</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2A9D8F' }}>{game.pricePerCard === 0 ? 'Gratis' : formatCurrency(totalRevenue)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', gridColumn: 'span 2' }}>
              <Users size={24} color="#9B5DE5" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Jugadores Únicos Aprobados</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{uniquePlayers}</div>
            </div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, rgba(252, 191, 73, 0.15) 0%, rgba(247, 127, 0, 0.15) 100%)',
            border: '2px solid rgba(252, 191, 73, 0.4)',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center',
            marginBottom: '2rem',
            position: 'relative',
            zIndex: 1
          }}>
            <Trophy size={32} color="#FCBF49" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '0.875rem', color: '#FCBF49', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>🏆 Ganador de la Partida</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem' }}>{winnerName}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
              <span>🎫 Cartón: <strong style={{ color: 'white', fontFamily: 'monospace' }}>{winningCard?.cardNumberFormatted || 'N/A'}</strong></span>
              <span>🎱 Balota: <strong style={{ color: 'white' }}>{winningBall}</strong></span>
            </div>
          </div>

          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleShare}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              border: 'none',
              boxShadow: '0 8px 20px rgba(37, 211, 102, 0.3)'
            }}
          >
            <Share2 size={20} />
            Compartir Resumen por WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
