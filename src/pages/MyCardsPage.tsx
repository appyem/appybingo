import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { BingoCardDisplay } from '../components/bingo/BingoCardDisplay';
import { cardRepository } from '../repositories';
import type { Card } from '@bingo-types/index';

export function MyCardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Usar el playerId de la sesión actual, o un fallback para desarrollo
    const currentPlayerId = sessionStorage.getItem('currentDemoPlayerId') || 'player-2';
    cardRepository.getCardsByPlayerId(currentPlayerId).then(c => { setCards(c); setLoading(false); });
  }, []);

  if (loading) return <div style={{padding:'2rem',textAlign:'center', color:'var(--color-text-secondary)'}}>Cargando tus cartones...</div>;

  return (
    <div style={{padding: '2rem 1rem 4rem', maxWidth: '48rem', margin: '0 auto'}}>
      <div style={{textAlign:'center', marginBottom:'2rem'}}>
        <h1 style={{fontSize:'1.875rem', fontWeight:700, color:'white', marginBottom:'0.5rem'}}>Mis Cartones</h1>
        <p style={{color:'var(--color-text-secondary)'}}>Tus cartones activos para las próximas partidas</p>
      </div>

      {cards.length === 0 ? (
        <div style={{textAlign:'center', padding:'3rem', color:'var(--color-text-secondary)'}}>
          <p>No tienes cartones asignados aún.</p>
          <Button variant="primary" style={{marginTop:'1rem'}} onClick={() => window.location.hash = '#solicitar'}>Solicitar Cartones</Button>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'1.5rem'}}>
          {cards.map(card => (
            <div key={card.id} style={{background:'var(--color-bg-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-xl)', padding:'1.5rem', textAlign:'center', transition:'all 0.2s'}}>
              <div style={{fontSize:'1.25rem', fontWeight:700, color:'var(--color-primary)', marginBottom:'1rem', fontFamily:'monospace'}}>{card.cardNumberFormatted}</div>
              <div style={{marginBottom:'1.5rem', opacity:0.8}}>
                <BingoCardDisplay matrix={card.matrix} cardNumber={card.cardNumberFormatted} />
              </div>
              <Button variant="outline" size="sm" onClick={() => window.location.hash = '#/carton/' + card.id}>Ver Cartón Completo</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}