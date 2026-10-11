import { useEffect, useState, useRef } from 'react';
import { gameRepository, cardRepository, requestRepository } from '../repositories';
import { speakBingoNumber } from '../utils/bingo';
import type { Game } from '@bingo-types/index';

// Componente de Bola 3D Realista
const BingoBall3D = ({ number, size = 80, isGiant = false }: { number: number; size?: number; isGiant?: boolean }) => {
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
      boxShadow: isGiant 
        ? `0 0 60px ${color}80, inset -${size * 0.15}px -${size * 0.15}px ${size * 0.3}px rgba(0,0,0,0.6), inset ${size * 0.1}px ${size * 0.1}px ${size * 0.2}px rgba(255,255,255,0.3)`
        : `inset -${size * 0.15}px -${size * 0.15}px ${size * 0.3}px rgba(0,0,0,0.6), inset ${size * 0.1}px ${size * 0.1}px ${size * 0.2}px rgba(255,255,255,0.3), 0 ${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.4)`,
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewers, setViewers] = useState<number>(() => {
    const hour = new Date().getHours();
    let base = 300;
    if (hour >= 19 && hour <= 23) base = 1500;
    else if (hour >= 12 && hour <= 14) base = 1000;
    else if (hour >= 7 && hour <= 11) base = 500;
    else if (hour >= 0 && hour <= 5) base = 80;
    return base + Math.floor(Math.random() * 300);
  });
  
  const prevBallRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setViewers(prev => {
        const change = Math.floor(Math.random() * 36) - 15;
        const next = prev + change;
        return Math.max(50, Math.min(5000, next));
      });
    }, 3500);

    return () => clearInterval(viewerInterval);
  }, []);

  useEffect(() => {
    if (!initialGameId) return;
    const unsubscribe = gameRepository.subscribeToGame(initialGameId, (gameData) => {
      if (gameData) { setGame(gameData); setError(null); } 
      else { setGame(null); setError('Juego no encontrado'); }
      setLoading(false);
    });
    return () => { unsubscribe(); };
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

  useEffect(() => {
    if (game?.id && (game.state === 'RUNNING' || game.state === 'PAUSED' || game.state === 'FINISHED')) {
      const checkWinner = async () => {
        const cards = await cardRepository.getCards();
        const winningCard = cards.find(c => c.gameId === game.id && c.status === 'WINNER');
        if (winningCard) {
          const req = await requestRepository.getRequestById(winningCard.requestId);
          if (req) setWinner({ playerName: req.playerName, cardNumber: winningCard.cardNumberFormatted });
        } else { setWinner(null); }
      };
      checkWinner();
      const interval = setInterval(checkWinner, 2000);
      return () => clearInterval(interval);
    }
  }, [game?.id, game?.state]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Cargando sala...</div>;
  if (error || !game) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ color: '#E63946', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>{error || 'Juego no encontrado'}</div>
      <button onClick={() => window.location.hash = '#/'} style={{ padding: '0.75rem 1.5rem', background: '#FCBF49', color: '#0A1628', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Volver al Inicio</button>
    </div>
  );

  const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  const drawnCount = game.drawnNumbers?.length || 0;

  return (
    <>
      <style>{`
        @keyframes float-bg {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes popIn { 0% { transform: scale(0) rotate(-180deg); opacity: 0; } 60% { transform: scale(1.1) rotate(10deg); opacity: 1; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes pulse-live { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.7); } 50% { opacity: 0.8; box-shadow: 0 0 0 8px rgba(230, 57, 70, 0); } }
        @keyframes glow-sponsor {
          0%, 100% { box-shadow: 0 0 15px rgba(252, 191, 73, 0.2); border-color: rgba(252, 191, 73, 0.3); }
          50% { box-shadow: 0 0 25px rgba(252, 191, 73, 0.5); border-color: rgba(252, 191, 73, 0.8); }
        }

        .game-room-bg {
          position: fixed; inset: 0; z-index: 0;
          background: linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 40%, #0f172a 100%);
          overflow: hidden;
        }
        .bg-orb {
          position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4;
          animation: float-bg 10s ease-in-out infinite;
        }
        .orb-1 { width: 40vw; height: 40vw; background: #FCBF49; top: -10%; left: -10%; animation-delay: 0s; }
        .orb-2 { width: 30vw; height: 30vw; background: #F77F00; bottom: -5%; right: -5%; animation-delay: 2s; }
        .orb-3 { width: 25vw; height: 25vw; background: #9B5DE5; top: 40%; left: 40%; animation-delay: 4s; }

        .mobile-layout {
          display: flex; flex-direction: column; min-height: 100vh; position: relative; z-index: 2;
          overflow-y: auto; padding-bottom: 4rem;
        }
        .mobile-header {
          display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem;
          background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .mobile-main { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 1rem; gap: 1rem; }
        .mobile-board { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.25rem; width: 100%; max-width: 500px; }
        .mobile-cell {
          display: flex; align-items: center; justify-content: center; border-radius: 6px; font-weight: 700;
          aspect-ratio: 1; font-size: 0.65rem; transition: all 0.3s ease;
        }

        @media (min-width: 1024px) {
          .mobile-layout { display: none; }
          
          .desktop-layout {
            position: relative; z-index: 2;
            height: 100vh; width: 100vw; overflow: hidden;
            display: grid;
            grid-template-rows: 12vh 1fr 8vh;
            padding: 1.5vh 2vw;
            box-sizing: border-box;
          }

          .desktop-header {
            display: flex; justify-content: space-between; align-items: center;
            background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px;
            padding: 0 2vw;
          }

          .desktop-body {
            display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2vw;
            padding: 1.5vh 0; min-height: 0;
          }

          .desktop-board-section {
            background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px;
            padding: 1.5vh 1.5vw; display: flex; flex-direction: column;
            height: 100%;
          }

          .desktop-board {
            display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: auto repeat(15, 1fr);
            gap: 0.8vh; flex: 1; width: 100%;
          }

          .desktop-cell {
            display: flex; align-items: center; justify-content: center;
            border-radius: 8px; font-weight: 800;
            font-size: clamp(14px, 1.8vh, 24px);
            transition: all 0.3s ease;
          }

          .desktop-side-panel {
            display: flex; flex-direction: column; gap: 2vh; height: 100%;
          }

          .desktop-ball-section {
            background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px;
            padding: 2vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
            flex: 1;
          }

          .desktop-history { display: flex; justify-content: center; gap: 1vw; margin-top: 2vh; flex-wrap: wrap; }

          .desktop-prize-section {
            background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(12px);
            border: 1px solid rgba(252, 191, 73, 0.3); border-radius: 20px;
            padding: 2vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
            flex: 1; animation: glow-sponsor 3s ease-in-out infinite;
          }

          .desktop-sponsor-bar {
            display: flex; align-items: center; justify-content: center; gap: 1vw;
            background: rgba(252, 191, 73, 0.1); backdrop-filter: blur(15px);
            border: 1px solid rgba(252, 191, 73, 0.4); border-radius: 9999px;
            color: #FCBF49; font-weight: 800; font-size: clamp(16px, 2vh, 24px);
            text-transform: uppercase; letter-spacing: 0.1em;
            box-shadow: 0 0 30px rgba(252, 191, 73, 0.15);
          }
        }

        .desktop-layout { display: none; }
        @media (min-width: 1024px) { .desktop-layout { display: grid; } }

        .drawn-cell {
          color: white !important; transform: scale(1.05);
          box-shadow: 0 0 15px currentColor, inset 0 0 10px rgba(255,255,255,0.3) !important;
        }
      `}</style>

      <div className="game-room-bg">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
      </div>

      {/* ================= LAYOUT MÓVIL ================= */}
      <div className="mobile-layout">
        <div className="mobile-header">
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'white' }}>{game.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(230, 57, 70, 0.3)', color: '#E63946', borderRadius: '9999px', fontWeight: 600 }}>
                {game.state}
              </span>
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(230, 57, 70, 0.15)', color: 'white', borderRadius: '9999px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                👁️ {viewers.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
          {!soundEnabled && (game.state === 'RUNNING' || game.state === 'PAUSED') && (
            <button onClick={() => { setSoundEnabled(true); speakBingoNumber(game.currentBall || 1); }}
              style={{ background: 'rgba(252, 191, 73, 0.2)', border: '1px solid rgba(252, 191, 73, 0.5)', color: '#FCBF49', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>🔊</button>
          )}
        </div>
        <div className="mobile-main">
          {(game.state === 'RUNNING' || game.state === 'PAUSED') ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {game.currentBall ? <BingoBall3D number={game.currentBall} size={90} /> : <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'rgba(255,255,255,0.3)' }}>?</div>}
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', marginTop: '0.5rem' }}>{game.currentBall ? '¡Bola Actual!' : 'Esperando'}</div>
              </div>
              <div className="mobile-board">
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
                          <div key={num} className="mobile-cell" style={{
                            background: isDrawn ? colColor : 'rgba(255,255,255,0.05)',
                            color: isDrawn ? 'white' : 'rgba(255,255,255,0.3)',
                            border: isDrawn ? `1px solid rgba(255,255,255,0.3)` : '1px solid transparent',
                          }}>{num}</div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎲</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>Esperando el inicio</h3>
            </div>
          )}
        </div>
      </div>

      {/* ================= LAYOUT PC (Streaming Profesional) ================= */}
      <div className="desktop-layout">
        <div className="desktop-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(24px, 3vh, 40px)', fontWeight: 900, margin: 0, color: 'white', letterSpacing: '-0.02em' }}>{game.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5vw', marginTop: '0.5vh' }}>
                {game.state === 'RUNNING' && (
                  <>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#E63946', animation: 'pulse-live 2s infinite' }} />
                    <span style={{ fontSize: 'clamp(14px, 1.5vh, 20px)', fontWeight: 800, color: '#E63946', textTransform: 'uppercase' }}>EN VIVO</span>
                  </>
                )}
              </div>
            </div>

            {/* Botón de Sonido para PC */}
            {!soundEnabled && (game.state === 'RUNNING' || game.state === 'PAUSED') && (
              <button 
                onClick={() => { setSoundEnabled(true); speakBingoNumber(game.currentBall || 1); }}
                style={{ 
                  background: 'rgba(252, 191, 73, 0.15)', 
                  border: '1px solid rgba(252, 191, 73, 0.5)', 
                  color: '#FCBF49', 
                  borderRadius: '12px', 
                  padding: '0.8vh 1.2vw',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5vw',
                  cursor: 'pointer',
                  fontSize: 'clamp(14px, 1.5vh, 18px)',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(252, 191, 73, 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(252, 191, 73, 0.15)'; }}
              >
                🔊 Activar Sonido
              </button>
            )}
            {soundEnabled && (game.state === 'RUNNING' || game.state === 'PAUSED') && (
              <button 
                onClick={() => setSoundEnabled(false)}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  color: 'white', 
                  borderRadius: '12px', 
                  padding: '0.8vh 1.2vw',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5vw',
                  cursor: 'pointer',
                  fontSize: 'clamp(14px, 1.5vh, 18px)',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
              >
                🔇 Silenciar
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(32px, 4vh, 56px)', fontWeight: 900, color: '#FCBF49', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: 'clamp(12px, 1.2vh, 16px)', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Transmisión en Directo</div>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5vw',
            background: 'rgba(230, 57, 70, 0.15)',
            border: '1px solid rgba(230, 57, 70, 0.4)',
            borderRadius: '12px',
            padding: '0.75vh 1.5vw',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#E63946',
              animation: 'pulse-live 2s infinite',
              boxShadow: '0 0 10px #E63946'
            }} />
            <span style={{ fontSize: '1.5rem' }}>👁️</span>
            <div>
              <div style={{ 
                fontSize: 'clamp(20px, 2.5vh, 32px)', 
                fontWeight: 900, 
                color: 'white',
                fontFamily: 'monospace',
                lineHeight: 1
              }}>
                {viewers.toLocaleString('es-CO')}
              </div>
              <div style={{ 
                fontSize: 'clamp(10px, 1vh, 14px)', 
                color: 'rgba(255,255,255,0.7)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em'
              }}>
                Viendo ahora
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'clamp(28px, 3.5vh, 48px)', fontWeight: 800, color: 'white' }}>
              <span style={{ color: '#FCBF49' }}>{drawnCount}</span> <span style={{ color: 'rgba(255,255,255,0.4)' }}>/ 75</span>
            </div>
            <div style={{ fontSize: 'clamp(12px, 1.2vh, 16px)', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Balotas Sorteadas</div>
          </div>
        </div>

        <div className="desktop-body">
          <div className="desktop-board-section">
            <div className="desktop-board">
              {['B', 'I', 'N', 'G', 'O'].map(letter => {
                const startNum = letter === 'B' ? 1 : letter === 'I' ? 16 : letter === 'N' ? 31 : letter === 'G' ? 46 : 61;
                const colColor = letter === 'B' ? '#E63946' : letter === 'I' ? '#F77F00' : letter === 'N' ? '#2A9D8F' : letter === 'G' ? '#0077B6' : '#9B5DE5';
                return (
                  <div key={letter} style={{ display: 'flex', flexDirection: 'column', gap: '0.8vh' }}>
                    <div style={{ 
                      textAlign: 'center', fontWeight: 900, fontSize: 'clamp(20px, 2.5vh, 36px)', color: colColor, 
                      paddingBottom: '1vh', borderBottom: `3px solid ${colColor}`, textShadow: `0 0 15px ${colColor}80`
                    }}>{letter}</div>
                    {Array.from({ length: 15 }, (_, i) => {
                      const num = startNum + i;
                      const isDrawn = game.drawnNumbers?.includes(num);
                      return (
                        <div key={num} className={`desktop-cell ${isDrawn ? 'drawn-cell' : ''}`} style={{
                          background: isDrawn ? colColor : 'rgba(255,255,255,0.03)',
                          color: isDrawn ? 'white' : 'rgba(255,255,255,0.3)',
                          border: isDrawn ? `2px solid ${colColor}` : '1px solid rgba(255,255,255,0.05)',
                        }}>{num}</div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="desktop-side-panel">
            <div className="desktop-ball-section">
              <div style={{ fontSize: 'clamp(14px, 1.5vh, 20px)', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2vh' }}>
                {game.currentBall ? 'Última Balota' : 'Esperando...'}
              </div>
              <div style={{ animation: game.currentBall ? 'pulse-live 3s ease-in-out infinite' : 'none' }}>
                {game.currentBall ? (
                  <BingoBall3D number={game.currentBall} size={clamp(150, 22, 250)} isGiant={true} />
                ) : (
                  <div style={{ width: 'clamp(150px, 22vh, 250px)', height: 'clamp(150px, 22vh, 250px)', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '3px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: 'rgba(255,255,255,0.2)' }}>?</div>
                )}
              </div>
              {game.drawnNumbers && game.drawnNumbers.length > 1 && (
                <div className="desktop-history">
                  {game.drawnNumbers.slice(-5).reverse().map((num, idx) => (
                    <div key={num} style={{ transform: `scale(${1 - idx * 0.1})`, opacity: 1 - idx * 0.15 }}>
                      <BingoBall3D number={num} size={clamp(40, 6, 60)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="desktop-prize-section">
              <div style={{ fontSize: 'clamp(14px, 1.5vh, 20px)', fontWeight: 800, color: '#FCBF49', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2vh' }}>🏆 Premio en Juego</div>
              {game.prizeType === 'PRODUCT' && game.prizeImageUrl ? (
                <>
                  <img src={game.prizeImageUrl} alt={game.prizeName} style={{ width: '100%', maxHeight: '25vh', objectFit: 'contain', borderRadius: '12px', marginBottom: '2vh', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }} />
                  <div style={{ fontSize: 'clamp(18px, 2.5vh, 32px)', fontWeight: 900, color: 'white', textAlign: 'center', lineHeight: 1.2 }}>{game.prizeName}</div>
                  {game.prizeDescription && <div style={{ fontSize: 'clamp(12px, 1.2vh, 16px)', color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: '1vh' }}>{game.prizeDescription}</div>}
                </>
              ) : (
                <div style={{ fontSize: 'clamp(32px, 5vh, 64px)', fontWeight: 900, color: '#FCBF49', textAlign: 'center', textShadow: '0 0 30px rgba(252, 191, 73, 0.6)' }}>
                  {game.prizeValue ? formatCurrency(game.prizeValue) : (game.prizeName || 'Premio Sorpresa')}
                </div>
              )}
            </div>
          </div>
        </div>

        {game.sponsorName && game.sponsorName !== 'AppyBingo' && (
          <div className="desktop-sponsor-bar">
            <span style={{ opacity: 0.8 }}>✨ Partida presentada por</span>
            <span style={{ color: 'white', textShadow: '0 0 10px rgba(252, 191, 73, 0.8)' }}>{game.sponsorName}</span>
          </div>
        )}
      </div>

      {/* PANTALLA DE GANADOR */}
      {winner && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 50%, #E63946 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'popIn 0.5s ease-out', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '8rem', marginBottom: '1rem', animation: 'float-bg 2s ease-in-out infinite' }}>🏆</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vh, 64px)', fontWeight: 900, color: 'white', textShadow: '0 4px 8px rgba(0,0,0,0.3)', marginBottom: '1rem' }}>¡TENEMOS UN GANADOR!</h1>
          <p style={{ fontSize: 'clamp(20px, 3vh, 32px)', color: 'white', fontWeight: 600, marginBottom: '2rem' }}>
            ¡Felicidades <strong style={{ color: '#0A1628' }}>{winner.playerName}</strong>!
          </p>
          <div style={{ padding: '2rem 4rem', background: 'rgba(255,255,255,0.2)', borderRadius: '24px', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '1rem', color: 'white', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Cartón Ganador</div>
            <div style={{ fontSize: 'clamp(32px, 5vh, 56px)', fontWeight: 900, color: '#0A1628', fontFamily: 'monospace' }}>{winner.cardNumber}</div>
          </div>
        </div>
      )}
    </>
  );
}

function clamp(min: number, val: number, max: number) {
  return Math.max(min, Math.min(val, max));
}