import { useEffect, useState, useRef } from 'react';
import { gameRepository, cardRepository, requestRepository } from '../repositories';
import { speakBingoNumber } from '../utils/bingo';
import type { Game } from '@bingo-types/index';

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

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bingo-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes bounce3d { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-15px) scale(1.05); } }
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        
        .game-room-container {
          height: 100dvh;
          width: 100vw;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          color: white;
        }
        .game-room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }
        .game-room-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          overflow: hidden;
          gap: 0.5rem;
        }
        .bingo-board {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.25rem;
          width: 100%;
          max-width: 500px;
          flex: 1;
          max-height: 55vh;
        }
        .bingo-board-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          font-weight: 700;
          transition: all 0.3s ease;
        }
        @media (min-width: 768px) {
          .bingo-board { gap: 0.5rem; max-width: 600px; }
          .bingo-board-cell { font-size: 0.9rem; padding: 0.5rem; }
        }
        @media (max-width: 767px) {
          .bingo-board-cell { font-size: 0.65rem; padding: 0.25rem; }
        }
      `}</style>

      <div className="game-room-container">
        {/* Header Compacto */}
        <div className="game-room-header">
          <div>
            {game.prizeType === 'PRODUCT' && game.prizeImageUrl && (
            <div style={{ 
              marginBottom: '1rem', 
              borderRadius: 'var(--radius-lg)', 
              overflow: 'hidden', 
              border: '2px solid rgba(252, 191, 73, 0.3)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              maxWidth: '400px',
              margin: '0 auto 1rem auto'
            }}>
              <img 
                src={game.prizeImageUrl} 
                alt={game.prizeName || 'Premio'} 
                style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} 
              />
              <div style={{ padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)' }}>
                <div style={{ fontSize: '0.75rem', color: '#FCBF49', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>🎁 Premio en Juego</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>{game.prizeName}</div>
              </div>
            </div>
          )}
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'white' }}>{game.name}</h1>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.15rem 0.5rem',
              background: `${getStateColor(game.state)}30`,
              color: getStateColor(game.state),
              borderRadius: '9999px',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              {game.state}
            </span>
          </div>
          {!soundEnabled && (game.state === 'RUNNING' || game.state === 'PAUSED') && (
            <button
              onClick={() => { setSoundEnabled(true); speakBingoNumber(game.currentBall || 1); }}
              style={{
                background: 'rgba(252, 191, 73, 0.2)',
                border: '1px solid rgba(252, 191, 73, 0.5)',
                color: '#FCBF49',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.25rem'
              }}
            >
              🔊
            </button>
          )}
        </div>

        {/* Contenido Principal */}
        <div className="game-room-main">
          {(game.state === 'RUNNING' || game.state === 'PAUSED') ? (
            <>
              {/* Bola Actual */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ animation: game.currentBall ? 'bounce3d 2s ease-in-out infinite' : 'none' }}>
                  {game.currentBall ? (
                    <BingoBall3D number={game.currentBall} size={100} />
                  ) : (
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'rgba(255,255,255,0.3)' }}>?</div>
                  )}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', marginTop: '0.5rem', textTransform: 'uppercase' }}>
                  {game.currentBall ? '¡Bola Actual!' : 'Esperando'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#FCBF49', fontWeight: 600 }}>
                  Sorteados: {game.drawnNumbers?.length || 0} / 75
                </div>
              </div>

              {/* Historial compacto */}
              {game.drawnNumbers && game.drawnNumbers.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {game.drawnNumbers.slice(-5).reverse().map((num, idx) => (
                    <div key={num} style={{ transform: `scale(${1 - idx * 0.1})`, opacity: 1 - idx * 0.15 }}>
                      <BingoBall3D number={num} size={40} />
                    </div>
                  ))}
                </div>
              )}

              {/* Tablero Compacto */}
              <div className="bingo-board">
                {['B', 'I', 'N', 'G', 'O'].map(letter => {
                  const startNum = letter === 'B' ? 1 : letter === 'I' ? 16 : letter === 'N' ? 31 : letter === 'G' ? 46 : 61;
                  const colColor = letter === 'B' ? '#E63946' : letter === 'I' ? '#F77F00' : letter === 'N' ? '#2A9D8F' : letter === 'G' ? '#0077B6' : '#9B5DE5';
                  return (
                    <div key={letter} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '1rem', color: colColor, paddingBottom: '0.25rem', borderBottom: `2px solid ${colColor}` }}>{letter}</div>
                      {Array.from({ length: 15 }, (_, i) => {
                        const num = startNum + i;
                        const isDrawn = game.drawnNumbers?.includes(num);
                        return (
                          <div key={num} className="bingo-board-cell" style={{
                            background: isDrawn ? colColor : 'rgba(255,255,255,0.05)',
                            color: isDrawn ? 'white' : 'rgba(255,255,255,0.3)',
                            border: isDrawn ? `1px solid rgba(255,255,255,0.3)` : '1px solid transparent',
                            boxShadow: isDrawn ? `0 2px 6px ${colColor}60` : 'none',
                            transform: isDrawn ? 'scale(1.05)' : 'scale(1)'
                          }}>
                            {num}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          ) : game.state === 'FINISHED' ? (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bingo-bounce 0.6s infinite' }}>🏆</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FCBF49', marginBottom: '0.5rem' }}>¡Sorteo Finalizado!</h3>
              <p style={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}>Se sortearon {game.drawnNumbers?.length || 0} números.</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bingo-bounce 2s ease-in-out infinite' }}>🎲</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem' }}>Esperando el inicio</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>El administrador aún no ha iniciado el sorteo.</p>
            </>
          )}
        </div>

        {/* PANTALLA DE GANADOR EN LA SALA DE JUEGO (Intacta) */}
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
      </div>
    </>
  );
}