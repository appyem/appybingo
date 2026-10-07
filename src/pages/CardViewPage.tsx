import { useEffect, useState, useRef, useCallback } from 'react';
import { cardRepository, gameRepository } from '../repositories';
import { getBingoLetter, speakBingoNumber } from '../utils/bingo';
import type { Card, Game } from '@bingo-types/index';

const Mini3DBall = ({ number }: { number: number }) => {
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
  
  const letter = getBingoLetter(number);
  const color = getBallColor(letter);
  const size = 44;
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${color} 40%, #000000 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `inset -4px -4px 8px rgba(0,0,0,0.6), inset 4px 4px 8px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.3)`,
      position: 'relative',
      flexShrink: 0
    }}>
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '20%',
        width: '30%',
        height: '20%',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
        transform: 'rotate(-45deg)'
      }} />
      <span style={{ fontSize: '10px', fontWeight: 900, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)', lineHeight: 1 }}>{letter}</span>
      <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)', lineHeight: 1 }}>{number}</span>
    </div>
  );
};

export function CardViewPage() {
  const hash = window.location.hash;
  const cardId = hash.startsWith('#/carton/') ? hash.replace('#/carton/', '').trim() : null;
  
  const [card, setCard] = useState<Card | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const [showBallPopup, setShowBallPopup] = useState(false);
  const [currentBall, setCurrentBall] = useState<number | null>(null);
  const [ballLetter, setBallLetter] = useState<string>('');
  
  const [markedNumbers, setMarkedNumbers] = useState<number[]>([]);
  const [pendingAutoMark, setPendingAutoMark] = useState<number | null>(null);
  const [invalidMark, setInvalidMark] = useState<number | null>(null); // Para feedback de error
  
  const [isBingo, setIsBingo] = useState(false);
  const [showBingoButton, setShowBingoButton] = useState(false);
  const [bingoCountdown, setBingoCountdown] = useState(7);
  
  const prevBallRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const markedNumbersRef = useRef(markedNumbers);
  const pendingBallRef = useRef<number | null>(null);
  const autoMarkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bingoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    markedNumbersRef.current = markedNumbers;
  }, [soundEnabled, markedNumbers]);

  useEffect(() => {
    return () => {
      if (autoMarkTimerRef.current) clearTimeout(autoMarkTimerRef.current);
      if (bingoTimerRef.current) clearTimeout(bingoTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isBingo) {
      const winAudio = new Audio('https://cdn.pixabay.com/download/audio/2022/03/24/audio_07823a3a4d.mp3');
      winAudio.volume = 0.6;
      winAudio.play().catch(e => console.log('Reproducción de audio requiere interacción previa:', e));
    }
  }, [isBingo]);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('appybingo_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('appybingo_device_id', deviceId);
    }
    return deviceId;
  };

  useEffect(() => {
    const deviceId = getDeviceId();

    const loadCard = async () => {
      if (!cardId) {
        setLoading(false);
        return;
      }
      try {
        const cardData = await cardRepository.getCardById(cardId);
        if (!cardData) {
          setLoading(false);
          return;
        }

        if (!cardData.openedDeviceId) {
          await cardRepository.updateCardOpenStatus(cardData.id, deviceId);
          setCard({ ...cardData, openedDeviceId: deviceId, openedAt: Date.now() });
        } else if (cardData.openedDeviceId !== deviceId) {
          setBlocked(true);
          setLoading(false);
          return;
        } else {
          setCard(cardData);
          setMarkedNumbers(cardData.markedNumbers || []);
          
          if (cardData.bingoClaimedAt) {
            setIsBingo(true);
            setShowBingoButton(false);
          }
        }

        if (cardData.gameId) {
          const unsubscribe = gameRepository.subscribeToGame(cardData.gameId, (gameData) => {
            if (gameData) {
              setGame(gameData);
            }
          });
          return () => unsubscribe();
        }
      } catch (err) {
        console.error('Error cargando cartón:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCard();
  }, [cardId]);

  const handleClaimBingo = useCallback(async () => {
    if (isBingo) return;
    
    setIsBingo(true);
    setShowBingoButton(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (bingoTimerRef.current) clearTimeout(bingoTimerRef.current);
    
    try {
      if (cardId) {
        await cardRepository.claimBingo(cardId);
        if (soundEnabledRef.current) {
          const utterance = new SpeechSynthesisUtterance('¡Bingo! ¡Felicidades!');
          utterance.lang = 'es-CO';
          utterance.volume = 1;
          window.speechSynthesis.speak(utterance);
        }
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (err) {
      console.error('Error al reclamar Bingo:', err);
    }
  }, [cardId, isBingo]);

  const checkForBingo = useCallback((marked: number[]) => {
    if (!card) return;
    
    const allNumbers = card.matrix.flat().filter(cell => cell !== 'FREE' && cell !== null) as number[];
    const allMarked = allNumbers.every(num => marked.includes(num));
    
    if (allMarked && !isBingo && !showBingoButton) {
      setShowBingoButton(true);
      setBingoCountdown(7);
      
      countdownIntervalRef.current = setInterval(() => {
        setBingoCountdown(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      bingoTimerRef.current = setTimeout(async () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        await handleClaimBingo();
      }, 7000);
    }
  }, [card, isBingo, showBingoButton, handleClaimBingo]);

  useEffect(() => {
    if (markedNumbers.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      checkForBingo(markedNumbers);
    }
  }, [markedNumbers, checkForBingo]);

  const handleMarkNumber = useCallback(async (number: number) => {
    if (markedNumbersRef.current.includes(number)) return;
    
    setMarkedNumbers(prev => [...prev, number]);
    
    if (pendingBallRef.current === number) {
      pendingBallRef.current = null;
      setPendingAutoMark(null);
      if (autoMarkTimerRef.current) {
        clearTimeout(autoMarkTimerRef.current);
        autoMarkTimerRef.current = null;
      }
    }
    
    try {
      if (cardId) {
        await cardRepository.markNumber(cardId, number);
      }
    } catch (err) {
      console.error('Error al marcar número:', err);
    }
  }, [cardId]);

  useEffect(() => {
    if (game?.currentBall && game.currentBall !== prevBallRef.current) {
      const ball = game.currentBall;
      const letter = getBingoLetter(ball);
      setCurrentBall(ball);
      setBallLetter(letter);
      setShowBallPopup(true);

      if (soundEnabledRef.current) {
        speakBingoNumber(ball);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }

      const isInMatrix = card?.matrix.some(row => row.includes(ball));
      if (isInMatrix && !markedNumbersRef.current.includes(ball)) {
        setPendingAutoMark(ball);
        pendingBallRef.current = ball;
        
        if (autoMarkTimerRef.current) clearTimeout(autoMarkTimerRef.current);
        
        autoMarkTimerRef.current = setTimeout(async () => {
          if (pendingBallRef.current === ball && !markedNumbersRef.current.includes(ball)) {
            await handleMarkNumber(ball);
          }
        }, 6000);
      }

      const timer = setTimeout(() => {
        setShowBallPopup(false);
      }, 2500);

      prevBallRef.current = ball;
      return () => clearTimeout(timer);
    }
  }, [game?.currentBall, card?.matrix, handleMarkNumber]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Cargando tu cartón...
      </div>
    );
  }

  if (blocked || !cardId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-base)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ color: 'var(--color-error)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          {blocked ? 'Cartón Bloqueado' : 'ID de cartón no válido'}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '300px' }}>
          {blocked 
            ? 'Este cartón ya fue abierto en otro dispositivo. Por seguridad, solo puede jugarse en un único dispositivo.' 
            : 'El enlace del cartón es incorrecto o ha expirado.'}
        </p>
        <button onClick={() => window.location.hash = '#/'} style={{ padding: '1rem 2rem', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-lg)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          Volver al Inicio
        </button>
      </div>
    );
  }

  if (!card) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>Cartón no encontrado</h2>
        <button onClick={() => window.location.hash = '#/'} style={{ padding: '1rem 2rem', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-lg)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          Volver al Inicio
        </button>
      </div>
    );
  }

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

  const ballColor = getBallColor(ballLetter);
  const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--color-bg-base)', 
      padding: '1rem', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {!soundEnabled && game?.state === 'RUNNING' && (
        <button
          onClick={() => {
            setSoundEnabled(true);
            speakBingoNumber(1);
          }}
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: 50,
            background: 'var(--color-warning)',
            color: 'black',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer'
          }}
        >
          🔊
        </button>
      )}

      <div style={{ textAlign: 'center', marginBottom: '1rem', zIndex: 10 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tu Cartón</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'monospace' }}>{card.cardNumberFormatted}</div>
        {game && (
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {game.name} • {game.state === 'RUNNING' ? '🔴 En Vivo' : '⏳ Esperando'}
          </div>
        )}
      </div>

      {game?.drawnNumbers && game.drawnNumbers.length > 0 && (
        <div style={{ marginBottom: '1rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Últimas balotas
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {game.drawnNumbers.slice(-5).reverse().map((num, idx) => (
              <Mini3DBall key={`${num}-${idx}`} number={num} />
            ))}
          </div>
        </div>
      )}

      <div style={{ 
        background: 'var(--color-bg-surface)', 
        border: '2px solid var(--color-border)', 
        borderRadius: 'var(--radius-xl)', 
        padding: '0.75rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {['B', 'I', 'N', 'G', 'O'].map(letter => (
            <div key={letter} style={{ 
              textAlign: 'center', 
              fontWeight: 900, 
              fontSize: '1.25rem', 
              color: getBallColor(letter), 
              paddingBottom: '0.5rem',
              borderBottom: `3px solid ${getBallColor(letter)}`
            }}>
              {letter}
            </div>
          ))}
          
          {card.matrix.map((row, rowIndex) => 
            row.map((cell, colIndex) => {
              const isFree = cell === 'FREE';
              const num = isFree ? null : (cell as number);
              const isMarked = isFree || (num !== null && markedNumbers.includes(num));
              const isPendingAuto = !isMarked && pendingAutoMark === num;
              const isInvalid = invalidMark === num;

              return (
                <div 
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => {
                    if (!isFree && num !== null && !isMarked) {
                      // VALIDACIÓN CRÍTICA: Solo permitir marcar si la balota YA SALIÓ
                      const hasBeenDrawn = game?.drawnNumbers?.includes(num);
                      if (hasBeenDrawn) {
                        handleMarkNumber(num);
                      } else {
                        // Feedback de error: no ha salido
                        setInvalidMark(num);
                        if (navigator.vibrate) navigator.vibrate(50);
                        setTimeout(() => setInvalidMark(null), 500);
                      }
                    }
                  }}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isMarked 
                      ? 'var(--color-success)' 
                      : (isPendingAuto ? 'rgba(252, 191, 73, 0.2)' : 'var(--color-bg-elevated)'),
                    color: isMarked ? 'white' : (isFree ? '#0A1628' : 'white'),
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: isFree ? '0.7rem' : '1.1rem',
                    border: isInvalid ? '2px solid var(--color-error)' : (isPendingAuto ? '2px solid var(--color-warning)' : (isFree ? 'none' : '1px solid var(--color-border)')),
                    cursor: isFree || isMarked ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    userSelect: 'none',
                    animation: isPendingAuto ? 'pulse-border 1s infinite' : (isInvalid ? 'shake 0.5s' : 'none'),
                    position: 'relative'
                  }}
                >
                  {isFree ? 'FREE' : cell}
                  {isMarked && !isFree && (
                    <div style={{ position: 'absolute', fontSize: '1.5rem', opacity: 0.8 }}>✓</div>
                  )}
                  {isPendingAuto && (
                    <div style={{
                      position: 'absolute',
                      bottom: '2px',
                      fontSize: '0.6rem',
                      color: 'var(--color-warning)',
                      fontWeight: 700
                    }}>
                      ¡TOCA!
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {showBingoButton && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#FCBF49',
            marginBottom: '1rem',
            textShadow: '0 4px 8px rgba(0,0,0,0.5)',
            animation: 'pulse-text 1s infinite'
          }}>
            ¡CARTÓN COMPLETO!
          </div>
          
          <button
            onClick={handleClaimBingo}
            style={{
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #FCBF49 0%, #F77F00 50%, #E63946 100%)',
              border: 'none',
              boxShadow: '0 20px 60px rgba(252, 191, 73, 0.6), inset -10px -10px 20px rgba(0,0,0,0.3), inset 10px 10px 20px rgba(255,255,255,0.4)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'bingo-pulse 0.8s infinite',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '15%',
              left: '20%',
              width: '30%',
              height: '20%',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
              transform: 'rotate(-45deg)'
            }} />
            <span style={{
              fontSize: '4rem',
              fontWeight: 900,
              color: 'white',
              textShadow: '0 4px 8px rgba(0,0,0,0.5)',
              lineHeight: 1
            }}>
              ¡BINGO!
            </span>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'white',
              marginTop: '0.5rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {bingoCountdown}s
            </span>
          </button>
          
          <div style={{
            marginTop: '2rem',
            fontSize: '1rem',
            color: 'white',
            textAlign: 'center',
            maxWidth: '300px'
          }}>
            {bingoCountdown > 0 
              ? `¡Toca el botón antes de que se acabe el tiempo!`
              : '¡Activando automáticamente...'}
          </div>
        </div>
      )}

      {isBingo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 50%, #E63946 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          animation: 'fadeIn 0.5s ease-out',
          overflow: 'hidden'
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
            fontSize: '3.5rem',
            fontWeight: 900,
            color: 'white',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            marginBottom: '0.5rem',
            zIndex: 1,
            textAlign: 'center'
          }}>
            ¡BINGO!
          </h1>
          <p style={{ fontSize: '1.5rem', color: 'white', textAlign: 'center', maxWidth: '300px', zIndex: 1, fontWeight: 600 }}>
            ¡Felicidades! Has ganado el Premio Mayor
          </p>
          
          {game && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem 2rem',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-xl)',
              backdropFilter: 'blur(4px)',
              zIndex: 1,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'white', textTransform: 'uppercase', fontWeight: 600 }}>Valor del Premio</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FCBF49', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {formatCurrency(game.prizeValue)}
              </div>
            </div>
          )}
          
          <p style={{
            marginTop: '2rem',
            fontSize: '1rem',
            color: 'white',
            textAlign: 'center',
            maxWidth: '300px',
            zIndex: 1,
            opacity: 0.9
          }}>
            El administrador validará tu victoria y se pondrá en contacto contigo.
          </p>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: '300px' }}>
        {game?.state === 'RUNNING' 
          ? '¡Atento! Toca los números en tu cartón. Si no lo haces en 6 segundos, se marcarán solos.' 
          : 'El sorteo comenzará pronto. Mantén esta pantalla abierta.'}
      </div>

      {showBallPopup && currentBall && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${ballColor} 40%, #000000 100%)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `
              inset -10px -10px 20px rgba(0,0,0,0.6),
              inset 10px 10px 20px rgba(255,255,255,0.4),
              0 15px 35px rgba(0,0,0,0.5)
            `,
            animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '15%',
              left: '20%',
              width: '30%',
              height: '20%',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
              transform: 'rotate(-45deg)'
            }} />
            
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)', lineHeight: 1 }}>{ballLetter}</span>
            <span style={{ fontSize: '3.5rem', fontWeight: 900, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)', lineHeight: 1, marginTop: '0.25rem' }}>{currentBall}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0) translateY(50px); opacity: 0; }
          60% { transform: scale(1.15) translateY(-10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-border {
          0%, 100% { border-color: var(--color-warning); box-shadow: 0 0 0 0 rgba(252, 191, 73, 0.4); }
          50% { border-color: #FCBF49; box-shadow: 0 0 0 6px rgba(252, 191, 73, 0); }
        }
        @keyframes pulse-text { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes bingo-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes bingo-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
