import { useEffect, useState, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { BingoCardDisplay } from '../components/bingo/BingoCardDisplay';
import { cardRepository, gameRepository } from '../repositories';
import { getBingoLetter, speakBingoNumber } from '../utils/bingo';
import type { Card, Game } from '@bingo-types/index';

export function MyCardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const prevBallRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    const hash = window.location.hash;
    let fetchPromise: Promise<Card[]>;

    // Si hay un requestId en la URL (ej: #/mis-cartones/REQ-123), buscamos por ese ID directamente
    if (hash.startsWith('#/mis-cartones/')) {
      const requestId = hash.replace('#/mis-cartones/', '').trim();
      fetchPromise = cardRepository.getCardsByRequestId(requestId);
    } else {
      // Fallback: comportamiento anterior por playerId en sesión local
      const currentPlayerId = sessionStorage.getItem('currentDemoPlayerId') || 'player-2';
      fetchPromise = cardRepository.getCardsByPlayerId(currentPlayerId);
    }

    let unsubscribeGame: (() => void) | undefined;

    fetchPromise.then(c => { 
      setCards(c); 
      
      // Suscribirse al juego del primer cartón
      if (c.length > 0 && c[0].gameId) {
        const gameId = c[0].gameId;
        unsubscribeGame = gameRepository.subscribeToGame(gameId, (gameData) => {
          if (gameData) {
            setGame(gameData);
          }
        });
      }
      setLoading(false); 
    }).catch(err => {
      console.error('Error cargando cartones:', err);
      setLoading(false);
    });

    return () => {
      if (unsubscribeGame) unsubscribeGame();
    };
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (game?.currentBall && game.currentBall !== prevBallRef.current) {
      if (soundEnabledRef.current) {
        speakBingoNumber(game.currentBall);
        if (navigator.vibrate) navigator.vibrate(200);
      }
      prevBallRef.current = game.currentBall;
    }
  }, [game?.currentBall]);

  if (loading) return <div style={{padding:'2rem',textAlign:'center', color:'var(--color-text-secondary)'}}>Cargando tus cartones...</div>;

  return (
    <div style={{padding: '2rem 1rem 4rem', maxWidth: '64rem', margin: '0 auto'}}>
      <div style={{textAlign:'center', marginBottom:'2rem'}}>
        <h1 style={{fontSize:'1.875rem', fontWeight:700, color:'white', marginBottom:'0.5rem'}}>Mis Cartones</h1>
        <p style={{color:'var(--color-text-secondary)'}}>Tus cartones activos y el sorteo en tiempo real</p>
      </div>

      {/* ÁREA DE SORTEO INMERSIVA (Solo si hay juego y está en curso/pausado/finalizado) */}
      {game && (game.state === 'RUNNING' || game.state === 'PAUSED' || game.state === 'FINISHED') && (
        <div style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          {!soundEnabled && (game.state === 'RUNNING' || game.state === 'PAUSED') && (
            <button
              onClick={() => {
                setSoundEnabled(true);
                speakBingoNumber(game.currentBall || 1);
              }}
              style={{
                width: '100%',
                padding: '1rem',
                marginBottom: '1.5rem',
                background: 'var(--color-warning)',
                color: 'black',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              🔊 Activar Sonido de la Sala (Necesario para escuchar las bolas)
            </button>
          )}

          {(game.state === 'RUNNING' || game.state === 'PAUSED') ? (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  fontSize: '6rem', 
                  fontWeight: 900, 
                  color: 'var(--color-primary)', 
                  lineHeight: 1,
                  textShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {game.currentBall ? `${getBingoLetter(game.currentBall)} ${game.currentBall}` : '--'}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginTop: '0.5rem' }}>
                  Bola Actual
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Números sorteados: {game.drawnNumbers?.length || 0} / 75
                </p>
                {game.state === 'PAUSED' && (
                  <p style={{ color: 'var(--color-warning)', fontSize: '0.875rem', marginTop: '1rem', fontWeight: 600 }}>
                    ⏸️ El sorteo está pausado
                  </p>
                )}
              </div>

              {game.drawnNumbers && game.drawnNumbers.length > 1 && (
                <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Últimas bolas</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {game.drawnNumbers.slice(-5).reverse().map((num, idx) => (
                      <div key={num} style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--color-bg-surface)' : 'var(--color-primary)',
                        color: idx === 0 ? 'var(--color-text-secondary)' : 'white',
                        border: `1px solid ${idx === 0 ? 'var(--color-border)' : 'var(--color-primary)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 700
                      }}>
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Tablero de control</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  {['B', 'I', 'N', 'G', 'O'].map(letter => {
                    const startNum = letter === 'B' ? 1 : letter === 'I' ? 16 : letter === 'N' ? 31 : letter === 'G' ? 46 : 61;
                    return (
                      <div key={letter}>
                        <div style={{ 
                          textAlign: 'center', 
                          fontWeight: 900, 
                          fontSize: '1.25rem', 
                          color: 'var(--color-primary)', 
                          marginBottom: '0.5rem',
                          paddingBottom: '0.25rem',
                          borderBottom: '2px solid var(--color-primary)'
                        }}>
                          {letter}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {Array.from({ length: 15 }, (_, i) => {
                            const num = startNum + i;
                            const isDrawn = game.drawnNumbers?.includes(num);
                            return (
                              <div key={num} style={{
                                textAlign: 'center',
                                padding: '0.25rem',
                                fontSize: '0.75rem',
                                background: isDrawn ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
                                color: isDrawn ? 'white' : 'var(--color-text-secondary)',
                                borderRadius: '4px',
                                fontWeight: isDrawn ? 700 : 400,
                                transition: 'all 0.3s ease'
                              }}>
                                {num}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : game.state === 'FINISHED' ? (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>Sorteo Finalizado</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                Se han sorteado los {game.drawnNumbers?.length || 0} números.
              </p>
            </>
          ) : null}
        </div>
      )}

      {cards.length === 0 ? (
        <div style={{textAlign:'center', padding:'3rem', color:'var(--color-text-secondary)'}}>
          <p>No tienes cartones asignados aún.</p>
          <Button variant="primary" style={{marginTop:'1rem'}} onClick={() => window.location.hash = '#solicitar'}>Solicitar Cartones</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '400px', margin: '0 auto' }}>
          {cards.map((card, index) => (
            <div 
              key={card.id} 
              style={{
                background: 'var(--color-bg-surface)', 
                border: '2px solid var(--color-border)', 
                borderRadius: 'var(--radius-xl)', 
                padding: '1.5rem', 
                textAlign: 'center', 
                transition: 'all 0.2s',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{ 
                fontSize: '1.125rem', 
                fontWeight: 800, 
                color: 'var(--color-primary)', 
                marginBottom: '1rem', 
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <span>🎟️</span> CARTÓN {index + 1}: {card.cardNumberFormatted}
              </div>
              
              <div style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
                <BingoCardDisplay matrix={card.matrix} cardNumber={card.cardNumberFormatted} />
              </div>
              
              <Button 
                variant="primary" 
                size="md" 
                onClick={() => window.location.hash = '#/carton/' + card.id}
                style={{ width: '100%', fontWeight: 700 }}
              >
                Abrir en Pantalla Completa
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
