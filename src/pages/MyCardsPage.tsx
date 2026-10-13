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

const bgMusicTracks = ['/fondobingo.mp3', '/fondobingo2.mp3', '/fondobingo3.mp3', '/fondobingo4.mp3'] as const;

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
  
  const [gameHasWinner, setGameHasWinner] = useState(false);
  const [winnerName, setWinnerName] = useState<string>('');
  const [showTooLateMessage, setShowTooLateMessage] = useState(false);
  const [winningCardNumber, setWinningCardNumber] = useState<string>('');
  
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  const prevBallRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const autoMarkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoClaimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // 1. Helper para verificar Bingo localmente (Sin dependencias, seguro al inicio)
  const checkHasBingo = useCallback((card: Card, currentMarks: Set<number>) => {
    if (!card || !card.matrix || !(currentMarks instanceof Set)) return false;
    
    const matrix = card.matrix;
    
    // REGLA DE CARTÓN LLENO: TODOS los números del cartón (excepto FREE) deben estar marcados.
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const val = matrix[r][c];
        // Si la celda no es FREE y el número NO está en las marcas, NO es cartón lleno.
        if (val !== 'FREE' && !(typeof val === 'number' && currentMarks.has(val))) {
          return false;
        }
      }
    }
    
    // Si el bucle termina sin retornar false, significa que TODOS los números están marcados.
    return true;
  }, []);

  // 2. Función para CANTAR BINGO (Declarada antes de ser usada en handleMarkNumber)
  const handleClaimBingo = useCallback(async (cardId: string) => {
    if (gameHasWinner || showTooLateMessage) return;
    
    if (autoClaimTimerRef.current) {
      clearTimeout(autoClaimTimerRef.current);
      autoClaimTimerRef.current = null;
    }
    
    try {
      const result = await cardRepository.claimBingo(cardId);
      if (result.alreadyWon) {
        setShowTooLateMessage(true);
      } else if (result.success) {
        setGameHasWinner(true);
        const req = await requestRepository.getRequestById((cards.find(c => c.id === cardId)?.requestId || ''));
        if (req) setWinnerName(req.playerName);
        const winCard = cards.find(c => c.id === cardId);
        if (winCard) setWinningCardNumber(winCard.cardNumberFormatted);
        
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

  // 3. Función de marcado manual y auto-cantado
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
      
      const targetCard = cards.find(c => c.id === cardId);
      if (targetCard && checkHasBingo(targetCard, newMarks)) {
        if (autoClaimTimerRef.current) clearTimeout(autoClaimTimerRef.current);
        autoClaimTimerRef.current = setTimeout(() => {
          handleClaimBingo(cardId);
        }, 7000);
      }
    } catch (err) {
      console.error('Error al marcar número:', err);
    }
  }, [game?.drawnNumbers, markedStates, cards, checkHasBingo, handleClaimBingo]);

  // 4. Carga de datos
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
      if (autoClaimTimerRef.current) clearTimeout(autoClaimTimerRef.current);
    };
  }, [requestId]);

  // 5. Sincronización de sonido
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // 5.1 Música de fondo (volumen bajo, loop, controlada por soundEnabled, selección aleatoria)
  useEffect(() => {
    if (soundEnabled) {
      if (!bgMusicRef.current) {
        const randomTrack = bgMusicTracks[Math.floor(Math.random() * bgMusicTracks.length)];
        const audio = new Audio(randomTrack);
        audio.loop = true;
        audio.volume = 0.12;
        bgMusicRef.current = audio;
      } else {
        // Elegir una canción diferente a la actual para variar la experiencia
        const currentSrc = bgMusicRef.current.src;
        const availableTracks = bgMusicTracks.filter(t => !currentSrc.endsWith(t) && !currentSrc.includes(t));
        const randomTrack = availableTracks.length > 0 
          ? availableTracks[Math.floor(Math.random() * availableTracks.length)]
          : bgMusicTracks[Math.floor(Math.random() * bgMusicTracks.length)];
        
        bgMusicRef.current.src = randomTrack;
      }
      
      bgMusicRef.current.play().catch((err) => {
        console.log('ℹ️ [Audio] Música de fondo bloqueada por política de autoplay:', err.message);
      });
    } else {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    }

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
      }
    };
  }, [soundEnabled]);

  // 6. Efecto para sonido y AUTO-MARCADO MÚLTIPLE
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
        const currentMarks = (markedStates[card.id] instanceof Set) ? markedStates[card.id] : new Set<number>();
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

  // 7. Polling para detectar si YA HAY UN GANADOR en el juego (Desempate)
  useEffect(() => {
    if (game?.id && (game.state === 'RUNNING' || game.state === 'PAUSED' || game.state === 'FINISHED')) {
      const checkWinner = async () => {
        const allCards = await cardRepository.getCards();
        const winningCard = allCards.find(c => c.gameId === game.id && c.status === 'WINNER');
        if (winningCard) {
          setGameHasWinner(true);
          const req = await requestRepository.getRequestById(winningCard.requestId);
          if (req) setWinnerName(req.playerName);
          setWinningCardNumber(winningCard.cardNumberFormatted);
        }
      };
      checkWinner();
      const interval = setInterval(checkWinner, 2000);
      return () => clearInterval(interval);
    }
  }, [game?.id, game?.state]);

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
    <div className="cards-page-wrapper">
      <style>{`
        @keyframes bounce3d { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-15px) scale(1.05); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes pulse-border {
          0%, 100% { border-color: var(--color-warning); box-shadow: 0 0 0 0 rgba(252, 191, 73, 0.4); }
          50% { border-color: #FCBF49; box-shadow: 0 0 0 4px rgba(252, 191, 73, 0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bingo-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes confetti-fall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes confetti-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-50px); }
          75% { transform: translateX(50px); }
        }
        @keyframes trophy-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }


        .cards-page-wrapper {
          min-height: 100vh;
          background: var(--color-bg-base);
          padding-bottom: 4rem;
        }
        @media (max-width: 767px) {
          .cards-page-wrapper {
            padding-bottom: 2rem; /* Padding normal al final de la página */
          }
        }
        .mobile-drawn-board {
          display: none;
        }
        @media (max-width: 767px) {
          .mobile-drawn-board {
            display: block;
            
            background: rgba(10, 22, 40, 0.95);
            backdrop-filter: blur(12px);
            border-top: 2px solid rgba(252, 191, 73, 0.4);
            border-radius: 24px 24px 0 0;
            padding: 1.5rem 0.5rem 3rem 0.5rem; /* Padding extra inferior para zona segura de iOS */
            margin-top: 2rem;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
          }
          .drawn-board-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 3px;
          }
        }

      `}</style>

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

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '500px', margin: '0 auto' }}>
        {cards.map((card, index) => {
          const currentMarks = (markedStates[card.id] instanceof Set) ? markedStates[card.id] : new Set<number>();
          
          return (
            <div key={card.id} style={{ 
              background: 'var(--color-bg-surface)', 
              border: '2px solid var(--color-border)', 
              borderRadius: 'var(--radius-xl)', 
              padding: '1rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
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
                    const isCenter = rowIndex === 2 && colIndex === 2; // Casilla central
                    const centerText = isCenter ? (game?.sponsorName || 'AppyBingo') : 'FREE';
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
                          fontSize: isCenter ? '0.65rem' : (isFree ? '0.7rem' : '1.1rem'),
                          lineHeight: 1.1,
                          textAlign: 'center',
                          padding: isCenter ? '0.25rem' : '0',
                          wordWrap: 'break-word',
                          minWidth: '0',
                          overflow: 'hidden',
                          boxSizing: 'border-box',
                          border: isInvalid ? '2px solid var(--color-error)' : (isPendingAuto ? '2px solid var(--color-warning)' : (isFree ? 'none' : '1px solid var(--color-border)')),
                          cursor: isFree || isMarked ? 'default' : 'pointer',
                          transition: 'all 0.2s',
                          userSelect: 'none',
                          animation: isInvalid ? 'shake 0.5s' : (isPendingAuto ? 'pulse-border 1s infinite' : 'none'),
                          position: 'relative'
                        }}
                      >
                        {isCenter ? centerText : (isFree ? 'FREE' : cell)}
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

              {!gameHasWinner && (() => {
    const hasBingo = checkHasBingo(card, currentMarks);
    if (hasBingo) {
      console.group('⚠️ [DEBUG FORENSE] Bingo detectado en cartón: ' + card.id);
      console.log('1. Marcas actuales en el Set:', Array.from(currentMarks));
      console.log('2. Matriz completa del cartón:', card.matrix);
      
      // Verificar filas
      for (let r = 0; r < 5; r++) {
        let full = true;
        for (let c = 0; c < 5; c++) {
          const val = card.matrix[r][c];
          const isM = val === 'FREE' || (typeof val === 'number' && currentMarks.has(val));
          if (!isM) { full = false; break; }
        }
        if (full) console.log('🏆 FILA GANADORA ENCONTRADA: Fila', r, card.matrix[r]);
      }
      
      // Verificar columnas
      for (let c = 0; c < 5; c++) {
        let full = true;
        for (let r = 0; r < 5; r++) {
          const val = card.matrix[r][c];
          const isM = val === 'FREE' || (typeof val === 'number' && currentMarks.has(val));
          if (!isM) { full = false; break; }
        }
        if (full) console.log('🏆 COLUMNA GANADORA ENCONTRADA: Columna', c);
      }
      
      // Verificar diagonales
      let d1 = true, d2 = true;
      const diag1 = [], diag2 = [];
      for (let i = 0; i < 5; i++) {
        const v1 = card.matrix[i][i];
        diag1.push(v1);
        if (!(v1 === 'FREE' || (typeof v1 === 'number' && currentMarks.has(v1)))) d1 = false;
        
        const v2 = card.matrix[i][4 - i];
        diag2.push(v2);
        if (!(v2 === 'FREE' || (typeof v2 === 'number' && currentMarks.has(v2)))) d2 = false;
      }
      if (d1) console.log('🏆 DIAGONAL 1 GANADORA:', diag1);
      if (d2) console.log('🏆 DIAGONAL 2 GANADORA:', diag2);
      
      console.groupEnd();
    }
    return hasBingo;
  })() && (
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


      {/* TABLERO DE NÚMEROS SORTEADOS (Solo Móvil) */}
      {game && (game.state === 'RUNNING' || game.state === 'PAUSED' || game.state === 'FINISHED') && (
        <div className="mobile-drawn-board">
          <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#FCBF49', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tablero de Sorteo ({game.drawnNumbers?.length || 0}/75)
          </div>
          <div className="drawn-board-grid">
            {['B', 'I', 'N', 'G', 'O'].map((letter, colIndex) => {
              const startNum = colIndex * 15 + 1;
              const colColor = letter === 'B' ? '#E63946' : letter === 'I' ? '#F77F00' : letter === 'N' ? '#2A9D8F' : letter === 'G' ? '#0077B6' : '#9B5DE5';
              return (
                <div key={letter} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '0.65rem', color: colColor, paddingBottom: '2px', borderBottom: `2px solid ${colColor}` }}>{letter}</div>
                  {Array.from({ length: 15 }, (_, i) => {
                    const num = startNum + i;
                    const isDrawn = game?.drawnNumbers?.includes(num);
                    return (
                      <div key={num} style={{
                        textAlign: 'center',
                        fontSize: '0.55rem',
                        fontWeight: 700,
                        color: isDrawn ? 'white' : 'rgba(255,255,255,0.25)',
                        background: isDrawn ? colColor : 'rgba(255,255,255,0.03)',
                        borderRadius: '3px',
                        padding: '3px 0',
                        transition: 'all 0.3s',
                        border: isDrawn ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent'
                      }}>
                        {num}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showTooLateMessage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 22, 40, 0.98)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 400, animation: 'fadeIn 0.5s ease-out', padding: '2rem', textAlign: 'center', overflowY: 'auto'
        }}>
          <div style={{ fontSize: 'clamp(4rem, 10vw, 5rem)', marginBottom: '1.5rem', animation: 'shake 0.5s', filter: 'grayscale(0.3)' }}>⏱️</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 900, color: '#E63946', marginBottom: '1rem', textShadow: '0 4px 12px rgba(230,57,70,0.5)' }}>
            ¡Casi lo logras!
          </h1>
          <div style={{ 
            padding: '1.5rem 2rem', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 'var(--radius-xl)', 
            marginBottom: '2rem',
            maxWidth: '450px',
            border: '1px solid rgba(230,57,70,0.3)'
          }}>
            <p style={{ fontSize: '1.125rem', color: '#d4d4e8', marginBottom: '1rem', lineHeight: 1.6, fontWeight: 500 }}>
              Otro jugador cantó <strong style={{ color: '#FCBF49' }}>BINGO</strong> unos milisegundos antes que tú.
            </p>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '1rem' }}>
              El premio de <strong style={{ color: '#FCBF49' }}>{game?.prizeType === 'PRODUCT' ? (game.prizeName || 'el producto') : (game?.prizeValue ? formatCurrency(game.prizeValue) : 'esta partida')}</strong> ya tiene dueño.
            </p>
            <p style={{ fontSize: '1.125rem', color: '#FCBF49', fontWeight: 700 }}>
              ¡No te desanimes! La suerte puede estar de tu lado en la próxima partida. 🍀
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
            <button 
              onClick={() => window.location.hash = '#/solicitar'}
              style={{
                padding: '1rem 2rem', 
                background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 100%)',
                color: '#0A1628', 
                border: 'none', 
                borderRadius: '9999px', 
                fontSize: '1.125rem',
                fontWeight: 800, 
                cursor: 'pointer', 
                boxShadow: '0 10px 30px rgba(252,191,73,0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
            >
              🎟️ Jugar Otra Partida
            </button>
            <button 
              onClick={() => window.location.hash = '#/'}
              style={{
                padding: '1rem 2rem', 
                background: 'rgba(255,255,255,0.1)',
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '9999px', 
                fontSize: '1rem',
                fontWeight: 600, 
                cursor: 'pointer', 
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            >
              🏠 Volver al Inicio
            </button>
          </div>
        </div>
      )}

      {gameHasWinner && !showTooLateMessage && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 50%, #E63946 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'popIn 0.5s ease-out', padding: '2rem', textAlign: 'center', overflowY: 'auto'
        }}>
          <img src="/logo.png" alt="AppyBingo" style={{ position: 'absolute', width: '80%', maxWidth: '500px', opacity: 0.15, transform: 'rotate(-15deg)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 'clamp(4rem, 10vw, 6rem)', marginBottom: '1rem', animation: 'bingo-bounce 0.6s infinite', zIndex: 1 }}>🏆</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: 'white', textShadow: '0 4px 8px rgba(0,0,0,0.3)', marginBottom: '0.5rem', zIndex: 1 }}>
            ¡TENEMOS UN GANADOR!
          </h1>
          <p style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', color: 'white', zIndex: 1, fontWeight: 600, marginBottom: '1.5rem' }}>
            ¡Felicidades <strong style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#0A1628' }}>{winnerName || 'Jugador'}</strong>!
          </p>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: 'var(--radius-xl)', 
            backdropFilter: 'blur(10px)', 
            border: '2px solid rgba(255,255,255,0.4)',
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            zIndex: 1,
            width: '100%',
            maxWidth: '400px'
          }}>
            <div style={{ fontSize: '1rem', color: 'white', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>🎟️ Cartón Ganador</div>
            <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 900, color: '#0A1628', fontFamily: 'monospace', marginBottom: '1rem' }}>
              {winningCardNumber || '---'}
            </div>
            <div style={{ fontSize: '1rem', color: 'white', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>🎁 Premio</div>
            <div style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800, color: '#0A1628' }}>
              {game?.prizeType === 'PRODUCT' ? (game.prizeName || 'Producto') : (game?.prizeValue ? formatCurrency(game.prizeValue) : 'Premio Sorpresa')}
            </div>
          </div>

          <button 
            onClick={() => window.location.hash = '#/'}
            style={{
              padding: '1rem 2.5rem', 
              background: '#0A1628',
              color: '#FCBF49', 
              border: 'none', 
              borderRadius: '9999px', 
              fontSize: '1.125rem',
              fontWeight: 800, 
              cursor: 'pointer', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
          >
            🏠 Volver al Inicio
          </button>
        </div>
      )}
    </div>
  );
}