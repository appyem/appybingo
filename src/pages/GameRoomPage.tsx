import { useEffect, useState, useRef } from 'react';
import { gameRepository, cardRepository, requestRepository } from '../repositories';
import { speakBingoNumber } from '../utils/bingo';
import type { Game, Card } from '@bingo-types/index';

// Componente de Bola 3D Realista para la Sala
const BingoBall3D = ({ number, size = 80 }: { number: number; size?: number }) => {
  const getBallColor = (letter: string) => {
    switch (letter) {
      case 'B': return '#E63946';
      case 'I': return '#F77F00';
      case 'N': return '#2A9D8F';
      case 'G': return '#0077B6';
      case 'O': return '#9B5DE5';
      default: return '#8b5cf6';
    }
  };
  
  const getLetter = (num: number) => {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
  };

  const letter = getLetter(number);
  const color = getBallColor(letter);
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, ${color} 0%, ${color}dd 40%, ${color}88 70%, #000000 100%)`,
      boxShadow: `inset -${size * 0.15}px -${size * 0.15}px ${size * 0.3}px rgba(0,0,0,0.6), inset ${size * 0.1}px ${size * 0.1}px ${size * 0.2}px rgba(255,255,255,0.3), 0 ${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.4)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
    }}>
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: '40%', height: '25%', borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%)', transform: 'rotate(-30deg)', filter: 'blur(2px)' }} />
      <div style={{ width: '65%', height: '55%', borderRadius: '50%', background: 'radial-gradient(circle at 50% 40%, #ffffff 0%, #f0f0f0 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: `${size * 0.18}px`, fontWeight: 900, color: color, lineHeight: 1, fontFamily: 'Arial Black, sans-serif' }}>{letter}</span>
        <span style={{ fontSize: `${size * 0.35}px`, fontWeight: 900, color: '#1a1a2e', lineHeight: 1, marginTop: '2px', fontFamily: 'Arial Black, sans-serif' }}>{number}</span>
      </div>
    </div>
  );
};

export function GameRoomPage() {
  const initialGameId = window.location.hash.replace('#/game/', '').trim();
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(!!initialGameId);
  const [error, setError] = useState<string | null>(initialGameId ? null : 'ID de juego no válido');
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [winner, setWinner] = useState<{ playerName: string; cardNumber: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const prevBallRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    if (!initialGameId) {
      return;
    }

    const unsubscribe = gameRepository.subscribeToGame(initialGameId, (gameData) => {
      if (gameData) {
        setGame(gameData);
        setError(null);
      } else {
        setGame(null);
        setError('Juego no encontrado');
      }
      setLoading(false);
    });

    const playerId = sessionStorage.getItem('currentDemoPlayerId');
    if (playerId) {
      cardRepository.getCardsByPlayerId(playerId).then((cards) => {
        const filtered = cards.filter((c) => c.gameId === initialGameId);
        setPlayerCards(filtered);
      });
    }

    return () => {
      unsubscribe();
    };
  }, [initialGameId]);

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

  // Detectar si hay un ganador en este juego para mostrarlo en la sala (con polling cada 2s)
  useEffect(() => {
    if (game?.id && (game.state === 'RUNNING' || game.state === 'PAUSED' || game.state === 'FINISHED')) {
      const checkWinner = async () => {
        const cards = await cardRepository.getCards();
        const winningCard = cards.find(c => c.gameId === game.id && c.status === 'WINNER');
        if (winningCard) {
          const req = await requestRepository.getRequestById(winningCard.requestId);
          if (req) {
            setWinner({ playerName: req.playerName, cardNumber: winningCard.cardNumberFormatted });
          }
        } else {
          setWinner(null);
        }
      };
      checkWinner();
      const interval = setInterval(checkWinner, 2000);
      return () => clearInterval(interval);
    }
  }, [game?.id, game?.state]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Cargando sala...
      </div>
    );
  }

  if (error || !game) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>
          {error || 'Juego no encontrado'}
        </div>
        <button
          onClick={() => window.location.hash = '#/'}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  const getStateMessage = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'Este juego aún no ha sido abierto por el administrador.';
      case 'OPEN': return 'El juego está abierto y esperando el inicio.';
      case 'READY': return 'El juego está preparado para comenzar.';
      case 'RUNNING': return 'El juego está en curso.';
      case 'PAUSED': return 'El juego está pausado.';
      case 'FINISHED': return 'El juego ha finalizado.';
      case 'CANCELLED': return 'Este juego fue cancelado.';
      default: return 'Estado desconocido.';
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'var(--color-text-muted)';
      case 'OPEN': return 'var(--color-success)';
      case 'READY': return 'var(--color-info)';
      case 'RUNNING': return 'var(--color-primary)';
      case 'PAUSED': return 'var(--color-warning)';
      case 'FINISHED': return 'var(--color-text-secondary)';
      case 'CANCELLED': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const playerId = sessionStorage.getItem('currentDemoPlayerId');

  return (
    <div style={{ padding: '2rem', maxWidth: '64rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'white', margin: 0 }}>
            {game.name}
          </h1>
          <span style={{
            padding: '0.5rem 1rem',
            background: `${getStateColor(game.state)}20`,
            color: getStateColor(game.state),
            border: `1px solid ${getStateColor(game.state)}`,
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            {game.state}
          </span>
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontFamily: 'monospace' }}>
          ID: {game.id}
        </div>
      </div>

      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: '1rem' }}>
          Información del Juego
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Variante</div>
            <div style={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}>{game.variant}</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Estado</div>
            <div style={{ color: getStateColor(game.state), fontSize: '1rem', fontWeight: 600 }}>{game.state}</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Creado por</div>
            <div style={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}>{game.createdBy}</div>
          </div>
        </div>
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {getStateMessage(game.state)}
          </div>
        </div>
      </div>

      {/* ÁREA DE SORTEO INMERSIVA Y COLORIDA */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 36, 0.9) 0%, rgba(48, 43, 99, 0.9) 100%)',
        border: '2px solid rgba(252, 191, 73, 0.3)',
        borderRadius: 'var(--radius-2xl)',
        padding: '2.5rem 2rem',
        marginBottom: '2rem',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
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
              marginBottom: '2rem',
              background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 100%)',
              color: '#0A1628',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1.125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 20px rgba(252,191,73,0.3)'
            }}
          >
            🔊 Activar Sonido de la Sala (Necesario para escuchar las bolas)
          </button>
        )}

        {(game.state === 'RUNNING' || game.state === 'PAUSED') ? (
          <>
            {/* Bola Actual Gigante en 3D */}
            <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '1rem', animation: game.currentBall ? 'bounce3d 2s ease-in-out infinite' : 'none' }}>
                {game.currentBall ? (
                  <BingoBall3D number={game.currentBall} size={160} />
                ) : (
                  <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '3px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'rgba(255,255,255,0.3)' }}>?</div>
                )}
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {game.currentBall ? '¡Bola Actual!' : 'Esperando primera bola'}
              </h3>
              <p style={{ color: '#FCBF49', fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem' }}>
                Números sorteados: <strong>{game.drawnNumbers?.length || 0}</strong> / 75
              </p>
              {game.state === 'PAUSED' && (
                <p style={{ color: 'var(--color-warning)', fontSize: '1rem', marginTop: '1rem', fontWeight: 700, background: 'rgba(247, 127, 0, 0.1)', padding: '0.5rem 1rem', borderRadius: '9999px' }}>
                  ⏸️ El sorteo está pausado
                </p>
              )}
            </div>

            {/* Historial de últimas 5 bolas en 3D */}
            {game.drawnNumbers && game.drawnNumbers.length > 1 && (
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>Últimas bolas cantadas</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {game.drawnNumbers.slice(-5).reverse().map((num, idx) => (
                    <div key={num} style={{ transform: `scale(${1 - idx * 0.1})`, opacity: 1 - idx * 0.15 }}>
                      <BingoBall3D number={num} size={60} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tablero Visual de 75 Números COLORIDO */}
            <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', textAlign: 'center' }}>Tablero de Control</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                {['B', 'I', 'N', 'G', 'O'].map(letter => {
                  const startNum = letter === 'B' ? 1 : letter === 'I' ? 16 : letter === 'N' ? 31 : letter === 'G' ? 46 : 61;
                  const colColor = letter === 'B' ? '#E63946' : letter === 'I' ? '#F77F00' : letter === 'N' ? '#2A9D8F' : letter === 'G' ? '#0077B6' : '#9B5DE5';
                  
                  return (
                    <div key={letter}>
                      <div style={{ 
                        textAlign: 'center', 
                        fontWeight: 900, 
                        fontSize: '1.75rem', 
                        color: colColor, 
                        marginBottom: '0.75rem',
                        paddingBottom: '0.5rem',
                        borderBottom: `3px solid ${colColor}`,
                        textShadow: `0 0 15px ${colColor}40`
                      }}>
                        {letter}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {Array.from({ length: 15 }, (_, i) => {
                          const num = startNum + i;
                          const isDrawn = game.drawnNumbers?.includes(num);
                          return (
                            <div key={num} style={{
                              textAlign: 'center',
                              padding: '0.375rem',
                              fontSize: '0.875rem',
                              background: isDrawn ? colColor : 'rgba(255,255,255,0.05)',
                              color: isDrawn ? 'white' : 'rgba(255,255,255,0.4)',
                              borderRadius: '6px',
                              fontWeight: isDrawn ? 900 : 500,
                              border: isDrawn ? `2px solid rgba(255,255,255,0.3)` : '1px solid transparent',
                              boxShadow: isDrawn ? `0 4px 12px ${colColor}60` : 'none',
                              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                              transform: isDrawn ? 'scale(1.05)' : 'scale(1)'
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
            <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'bingo-bounce 0.6s infinite' }}>🏆</div>
            <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#FCBF49', marginBottom: '0.5rem' }}>¡Sorteo Finalizado!</h3>
            <p style={{ color: 'white', fontSize: '1.125rem', fontWeight: 600 }}>
              Se han sorteado los <strong>{game.drawnNumbers?.length || 0}</strong> números.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'bingo-bounce 2s ease-in-out infinite' }}>🎲</div>
            <h3 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem' }}>Esperando el inicio</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.125rem' }}>
              El administrador aún no ha iniciado el sorteo. ¡Mantente atento!
            </p>
          </>
        )}
      </div>

      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: '1rem' }}>Mis Cartones</h2>
        {!playerId ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <p style={{ marginBottom: '1rem' }}>No has iniciado sesión como jugador.</p>
            <p style={{ fontSize: '0.875rem' }}>Para ver tus cartones, solicita cartones desde el flujo principal.</p>
            <button
              onClick={() => window.location.hash = '#solicitar'}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Solicitar Cartones
            </button>
          </div>
        ) : playerCards.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No tienes cartones asignados a este juego.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {playerCards.map((card) => (
              <div
                key={card.id}
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                  {card.cardNumberFormatted}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {card.id.substring(0, 8)}...
                </div>
                <button
                  onClick={() => window.location.hash = '#/carton/' + card.id}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  Ver Cartón
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PANTALLA DE GANADOR EN LA SALA DE JUEGO */}
      {winner && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 50%, #E63946 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          animation: 'fadeIn 0.5s ease-out',
          overflow: 'hidden',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <img 
            src="/logo.png" 
            alt="AppyBingo" 
            style={{ 
              position: 'absolute',
              width: '80%',
              maxWidth: '500px',
              opacity: 0.15,
              transform: 'rotate(-15deg)',
              pointerEvents: 'none'
            }} 
          />
          <div style={{ fontSize: '6rem', marginBottom: '1rem', animation: 'bingo-bounce 0.6s infinite', zIndex: 1 }}>🏆</div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: 'white',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            marginBottom: '0.5rem',
            zIndex: 1
          }}>
            ¡TENEMOS UN GANADOR!
          </h1>
          <p style={{ fontSize: '1.5rem', color: 'white', zIndex: 1, fontWeight: 600, marginBottom: '1rem' }}>
            ¡Felicidades <strong style={{ fontSize: '1.75rem', color: '#0A1628' }}>{winner.playerName}</strong>!
          </p>
          <div style={{
            padding: '1rem 2rem',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 'var(--radius-xl)',
            backdropFilter: 'blur(4px)',
            zIndex: 1,
            textAlign: 'center',
            marginBottom: '2rem',
            border: '2px solid rgba(255,255,255,0.3)'
          }}>
            <div style={{ fontSize: '0.875rem', color: 'white', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Cartón Ganador</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0A1628', fontFamily: 'monospace' }}>
              {winner.cardNumber}
            </div>
          </div>
          <p style={{ fontSize: '1.125rem', color: 'white', zIndex: 1, opacity: 0.9, maxWidth: '400px' }}>
            El administrador validará la victoria y se pondrá en contacto para la entrega del premio.
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bingo-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes bounce3d { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-15px) scale(1.05); } }
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}