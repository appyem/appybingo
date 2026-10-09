import { useEffect, useState, useRef, useCallback } from 'react';
import { cardRepository, gameRepository, requestRepository } from '../repositories';
import { speakBingoNumber } from '../utils/bingo';
import type { Card, Game } from '@bingo-types/index';

// Componente de Bola 3D Realista
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
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, ${color} 0%, ${color}dd 40%, ${color}88 70%, #000000 100%)`,
      boxShadow: `inset -${size * 0.15}px -${size * 0.15}px ${size * 0.3}px rgba(0,0,0,0.6), inset ${size * 0.1}px ${size * 0.1}px ${size * 0.2}px rgba(255,255,255,0.3), 0 ${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.4)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', animation: 'bounce3d 2s ease-in-out infinite'
    }}>
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: '40%', height: '25%', borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%)', transform: 'rotate(-30deg)', filter: 'blur(2px)' }} />
      <div style={{ width: '65%', height: '55%', borderRadius: '50%', background: 'radial-gradient(circle at 50% 40%, #ffffff 0%, #f0f0f0 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: `${size * 0.18}px`, fontWeight: 900, color: color, lineHeight: 1, fontFamily: 'Arial Black, sans-serif' }}>{letter}</span>
        <span style={{ fontSize: `${size * 0.35}px`, fontWeight: 900, color: '#1a1a2e', lineHeight: 1, marginTop: '2px', fontFamily: 'Arial Black, sans-serif' }}>{number}</span>
      </div>
    </div>
  );
};

export function MyCardsPage() {
  const hash = window.location.hash;
  const requestId = hash.startsWith('#/mis-cartones/') ? hash.replace('#/mis-cartones/', '').trim() : null;
  
  const [cards, setCards] = useState<Card[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const [markedStates, setMarkedStates] = useState<Record<string, Set<number>>>({});
  const [invalidMark, setInvalidMark] = useState<string | null>(null);
  const [pendingAutoMarks, setPendingAutoMarks] = useState<Set<string>>(new Set());
  
  // Estados para la lógica de Bingo y desempate
  const [gameHasWinner, setGameHasWinner] = useState(false);
  const [winnerName, setWinnerName] = useState<string>('');
  const [showTooLateMessage, setShowTooLateMessage] = useState(false);
  
  const prevBallRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const autoMarkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Carga de datos
  useEffect(() => {
    let fetchPromise: Promise<Card[]>;
    let unsubscribeGame: (() => void) | undefined;

    if (requestId) {
      fetchPromise = cardRepository.getCardsByRequestId(requestId);
    } else {
      const currentPlayerId = sessionStorage.getItem('currentDemoPlayerId') || 'player-2';
      fetchPromise = cardRepository.getCardsByPlayerId(currentPlayerId);
    }

    fetchPromise.then(c => { 
      setCards(c);
      const initialMarks: Record<string, Set<number>> = {};
      c.forEach(card => {
        initialMarks[card.id] = new Set(card.markedNumbers || []);
      });
      setMarkedStates(initialMarks);
      
      if (c.length > 0 && c[0].gameId) {
        const gameId = c[0].gameId;
        unsubscribeGame = gameRepository.subscribeToGame(gameId, (gameData) => {
          if (gameData) setGame(gameData);
        });
      }
      setLoading(false); 
    }).catch(err => {
      console.error('Error cargando cartones:', err);
      setLoading(false);
    });

    return () => { 
      if (unsubscribeGame) unsubscribeGame();
      if (autoMarkTimerRef.current) clearTimeout(autoMarkTimerRef.current);
    };
  }, [requestId]);

  // 2. Sincronización de sonido
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // 3. Función de marcado manual
  const handleMarkNumber = useCallback(async (cardId: string, number: number) => {
    const currentMarks = markedStates[cardId] || new Set<number>();
    if (currentMarks.has(number)) return;
    
    const hasBeenDrawn = game?.drawnNumbers?.includes(number);
    if (!hasBeenDrawn) {
      setInvalidMark(`${cardId}-${number}`);
      if (navigator.vibrate) navigator.vibrate(50);
      setTimeout(() => setInvalidMark(null), 500);
      return;
    }

    // Si el usuario marca manualmente, quitar de pendientes y cancelar timer
    setPendingAutoMarks(prev => {
      const pendingKey = `${cardId}-${number}`;
      if (prev.has(pendingKey)) {
        const next = new Set(prev);
        next.delete(pendingKey);
        if (next.size === 0 && autoMarkTimerRef.current) {
          clearTimeout(autoMarkTimerRef.current);
          autoMarkTimerRef.current = null;
        }
        return next;
      }
      return prev;
    });

    const newMarks = new Set(currentMarks);
    newMarks.add(number);
    setMarkedStates(prev => ({ ...prev, [cardId]: newMarks }));

    try {
      await cardRepository.markNumber(cardId, number);
    } catch (err) {
      console.error('Error al marcar número:', err);
    }
  }, [game?.drawnNumbers, markedStates]);

  // 4. Efecto para sonido y AUTO-MARCADO MÚLTIPLE
  useEffect(() => {
    if (game?.currentBall && game.currentBall !== prevBallRef.current) {
      const ball = game.currentBall;
      
      if (soundEnabledRef.current) {
        speakBingoNumber(ball);
        if (navigator.vibrate) navigator.vibrate(200);
      }
      prevBallRef.current = ball;

      const cardsNeedingMark = cards.filter(card => {
        const isInMatrix = card.matrix.some(row => row.includes(ball));
        const currentMarks = markedStates[card.id] || new Set<number>();
        return isInMatrix && !currentMarks.has(ball);
      });

      if (cardsNeedingMark.length > 0) {
        if (autoMarkTimerRef.current) {
          clearTimeout(autoMarkTimerRef.current);
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPendingAutoMarks(prev => {
          const next = new Set(prev);
          cardsNeedingMark.forEach(card => next.add(`${card.id}-${ball}`));
          return next;
        });

        autoMarkTimerRef.current = setTimeout(() => {
          cardsNeedingMark.forEach(card => {
            handleMarkNumber(card.id, ball);
          });
          setPendingAutoMarks(new Set());
          autoMarkTimerRef.current = null;
        }, 6000);
      }
    }
  }, [game?.currentBall, cards, markedStates, handleMarkNumber]);

  // 5. Polling para detectar si YA HAY UN GANADOR en el juego (Desempate)
  useEffect(() => {
    if (game?.id && (game.state === 'RUNNING' || game.state === 'PAUSED' || game.state === 'FINISHED')) {
      const checkWinner = async () => {
        const allCards = await cardRepository.getCards();
        const winningCard = allCards.find(c => c.gameId === game.id && c.status === 'WINNER');
        if (winningCard) {
          setGameHasWinner(true);
          const req = await requestRepository.getRequestById(winningCard.requestId);
          if (req) setWinnerName(req.playerName);
        }
      };
      checkWinner();
      const interval = setInterval(checkWinner, 2000);
      return () => clearInterval(interval);
    }
  }, [game?.id, game?.state]);

  // 6. Función para CANTAR BINGO (con defensa de desempate)
  const handleClaimBingo = useCallback(async (cardId: string) => {
    if (gameHasWinner || showTooLateMessage) return;
    
    try {
      const result = await cardRepository.claimBingo(cardId);
      
      if (result.alreadyWon) {
        setShowTooLateMessage(true);
      } else if (result.success) {
        setGameHasWinner(true);
        const req = await requestRepository.getRequestById((cards.find(c => c.id === cardId)?.requestId || ''));
        if (req) setWinnerName(req.playerName);
        
        if (soundEnabledRef.current) {
          const utterance = new SpeechSynthesisUtterance('¡Bingo! ¡Felicidades, tenemos un ganador!');
          utterance.lang = 'es-CO';
          utterance.volume = 1;
          window.speechSynthesis.speak(utterance);
        }
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
      }
    } catch (err) {
      console.error('Error al reclamar Bingo:', err);
    }
  }, [gameHasWinner, showTooLateMessage, cards]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando tus cartones...</div>;
  }

  if (cards.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>No tienes cartones activos para esta solicitud.</h2>
        <button onClick={() => window.location.hash = '#solicitar'} style={{ padding: '1rem 2rem', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-lg)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          Solicitar Nuevos Cartones
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', paddingBottom: '4rem' }}>
      <style>{`
        @keyframes bounce3d { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-15px) scale(1.05); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes pulse-border {
          0%, 100% { border-color: var(--color-warning); box-shadow: 0 0 0 0 rgba(252, 191, 73, 0.4); }
          50% { border-color: #FCBF49; box-shadow: 0 0 0 4px rgba(252, 191, 73, 0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bingo-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      `}</style>

      {/* CABECERA FIJA CON LA BALOTA EN VIVO */}
      {game && (game.state === 'RUNNING' || game.state === 'PAUSED') && (
        <div style={{ 
          position: 'sticky', top: 0, zIndex: 50, 
          background: 'linear-gradient(135deg, rgba(26, 26, 36, 0.95) 0%, rgba(48, 43, 99, 0.95) 100%)',
          borderBottom: '2px solid rgba(252, 191, 73, 0.3)',
          padding: '1rem', textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          {!soundEnabled && (
            <button onClick={() => { setSoundEnabled(true); speakBingoNumber(game.currentBall || 1); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--color-warning)', color: 'black', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', cursor: 'pointer' }}>
              🔊
            </button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            {game.currentBall ? (
              <BingoBall3D number={game.currentBall} size={90} />
            ) : (
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'rgba(255,255,255,0.3)' }}>?</div>
            )}
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
                {game.currentBall ? '¡Bola Actual!' : 'Esperando primera bola'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#FCBF49', fontWeight: 600 }}>
                Sorteados: {game.drawnNumbers?.length || 0} / 75
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTA VERTICAL DE CARTONES INTERACTIVOS */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '500px', margin: '0 auto' }}>
        {cards.map((card, index) => {
          const currentMarks = markedStates[card.id] || new Set<number>();
          
          return (
            <div key={card.id} style={{ 
              background: 'var(--color-bg-surface)', 
              border: '2px solid var(--color-border)', 
              borderRadius: 'var(--radius-xl)', 
              padding: '1rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }}>
              <div style={{ 
                fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary)', 
                marginBottom: '1rem', fontFamily: 'monospace', textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}>
                <span>🎟️</span> CARTÓN {index + 1}: {card.cardNumberFormatted}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {['B', 'I', 'N', 'G', 'O'].map(letter => (
                  <div key={letter} style={{ textAlign: 'center', fontWeight: 900, fontSize: '1.25rem', color: letter === 'B' ? '#E63946' : letter === 'I' ? '#F77F00' : letter === 'N' ? '#2A9D8F' : letter === 'G' ? '#0077B6' : '#9B5DE5', paddingBottom: '0.5rem', borderBottom: `3px solid ${letter === 'B' ? '#E63946' : letter === 'I' ? '#F77F00' : letter === 'N' ? '#2A9D8F' : letter === 'G' ? '#0077B6' : '#9B5DE5'}` }}>
                    {letter}
                  </div>
                ))}
                
                {card.matrix.map((row, rowIndex) => 
                  row.map((cell, colIndex) => {
                    const isFree = cell === 'FREE';
                    const num = isFree ? null : (cell as number);
                    const isMarked = isFree || (num !== null && currentMarks.has(num));
                    const isInvalid = invalidMark === `${card.id}-${num}`;
                    const isPendingAuto = pendingAutoMarks.has(`${card.id}-${num}`);

                    return (
                      <div 
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => {
                          if (!isFree && num !== null && !isMarked) {
                            handleMarkNumber(card.id, num);
                          }
                        }}
                        style={{
                          aspectRatio: '1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isMarked ? 'var(--color-success)' : (isPendingAuto ? 'rgba(252, 191, 73, 0.2)' : 'var(--color-bg-elevated)'),
                          color: isMarked ? 'white' : (isFree ? '#0A1628' : 'white'),
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: isFree ? '0.7rem' : '1.1rem',
                          border: isInvalid ? '2px solid var(--color-error)' : (isPendingAuto ? '2px solid var(--color-warning)' : (isFree ? 'none' : '1px solid var(--color-border)')),
                          cursor: isFree || isMarked ? 'default' : 'pointer',
                          transition: 'all 0.2s',
                          userSelect: 'none',
                          animation: isInvalid ? 'shake 0.5s' : (isPendingAuto ? 'pulse-border 1s infinite' : 'none'),
                          position: 'relative'
                        }}
                      >
                        {isFree ? 'FREE' : cell}
                        {isMarked && !isFree && (
                          <div style={{ position: 'absolute', fontSize: '1.5rem', opacity: 0.8 }}>✓</div>
                        )}
                        {isPendingAuto && (
                          <div style={{ position: 'absolute', bottom: '2px', fontSize: '0.5rem', color: 'var(--color-warning)', fontWeight: 700 }}>¡TOCA!</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* BOTÓN DE CANTAR BINGO (Solo si aún no hay ganador) */}
              {!gameHasWinner && (
                <button
                  onClick={() => handleClaimBingo(card.id)}
                  style={{
                    marginTop: '1.5rem',
                    width: '100%',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 100%)',
                    color: '#0A1628',
                    fontWeight: 900,
                    fontSize: '1.25rem',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(252,191,73,0.4)',
                    animation: 'pulse-border 1.5s infinite',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  🎉 ¡Cantar Bingo con este cartón! 🎉
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* PANTALLA: TE FALTÓ RAPIDEZ */}
      {showTooLateMessage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 400, animation: 'fadeIn 0.5s ease-out', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'shake 0.5s' }}>⏱️</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#E63946', marginBottom: '1rem', textShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
            ¡Te faltó rapidez!
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'white', marginBottom: '2rem', fontWeight: 600, maxWidth: '400px' }}>
            Otro jugador presionó el botón de BINGO unos milisegundos antes que tú.
          </p>
          <p style={{ fontSize: '1.5rem', color: '#FCBF49', fontWeight: 700, marginBottom: '2rem' }}>
            ¡Suerte para la próxima! 🍀
          </p>
          <button 
            onClick={() => window.location.hash = '#/'}
            style={{
              padding: '1rem 2.5rem', background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 100%)',
              color: '#0A1628', border: 'none', borderRadius: '9999px', fontSize: '1.125rem',
              fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 30px rgba(252,191,73,0.4)'
            }}
          >
            Volver al Inicio
          </button>
        </div>
      )}

      {/* PANTALLA: CELEBRACIÓN DE GANADOR */}
      {gameHasWinner && !showTooLateMessage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 50%, #E63946 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, animation: 'fadeIn 0.5s ease-out', overflow: 'hidden', padding: '2rem', textAlign: 'center'
        }}>
          <img src="/logo.png" alt="AppyBingo" style={{ position: 'absolute', width: '80%', maxWidth: '500px', opacity: 0.15, transform: 'rotate(-15deg)', pointerEvents: 'none' }} />
          <div style={{ fontSize: '6rem', marginBottom: '1rem', animation: 'bingo-bounce 0.6s infinite', zIndex: 1 }}>🏆</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', textShadow: '0 4px 8px rgba(0,0,0,0.3)', marginBottom: '0.5rem', zIndex: 1 }}>
            ¡TENEMOS UN GANADOR!
          </h1>
          <p style={{ fontSize: '1.5rem', color: 'white', zIndex: 1, fontWeight: 600, marginBottom: '1rem' }}>
            ¡Felicidades <strong style={{ fontSize: '1.75rem', color: '#0A1628' }}>{winnerName || 'Jugador'}</strong>!
          </p>
          <p style={{ fontSize: '1.125rem', color: 'white', zIndex: 1, opacity: 0.9, maxWidth: '400px' }}>
            El administrador validará la victoria y se pondrá en contacto para la entrega del premio.
          </p>
        </div>
      )}
    </div>
  );
}