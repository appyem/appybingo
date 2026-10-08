import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { gameRepository } from '../repositories';
import type { Game } from '@bingo-types/index';

// Componente de Bola 3D Realista
const BingoBall3D = ({ number, color, size = 80, delay = 0, x, y }: { 
  number: number; 
  color: string; 
  size?: number; 
  delay?: number;
  x: string;
  y: string;
}) => {
  return (
    <div
      className="bingo-ball-3d"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: `${size}px`,
        height: `${size}px`,
        animation: `bounce3d 3s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        zIndex: 2,
      }}
    >
      {/* Sombra proyectada en el suelo */}
      <div
        style={{
          position: 'absolute',
          bottom: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${size * 0.7}px`,
          height: '12px',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          animation: 'shadowPulse 3s ease-in-out infinite',
          animationDelay: `${delay}s`,
        }}
      />
      {/* La bola 3D */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${color} 0%, ${color}dd 40%, ${color}88 70%, #000000 100%)`,
          boxShadow: `
            inset -${size * 0.15}px -${size * 0.15}px ${size * 0.3}px rgba(0,0,0,0.6),
            inset ${size * 0.1}px ${size * 0.1}px ${size * 0.2}px rgba(255,255,255,0.3),
            0 ${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.4)
          `,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Brillo especular superior */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '15%',
            width: '40%',
            height: '25%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
            transform: 'rotate(-30deg)',
            filter: 'blur(2px)',
          }}
        />
        {/* Reflejo inferior suave */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '20%',
            width: '25%',
            height: '15%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
            transform: 'rotate(20deg)',
          }}
        />
        {/* Círculo blanco central con el número */}
        <div
          style={{
            width: '65%',
            height: '55%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 40%, #ffffff 0%, #f0f0f0 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: `${size * 0.18}px`,
              fontWeight: 900,
              color: color,
              lineHeight: 1,
              fontFamily: 'Arial Black, sans-serif',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {number <= 15 ? 'B' : number <= 30 ? 'I' : number <= 45 ? 'N' : number <= 60 ? 'G' : 'O'}
          </span>
          <span
            style={{
              fontSize: `${size * 0.32}px`,
              fontWeight: 900,
              color: '#1a1a2e',
              lineHeight: 1,
              marginTop: '2px',
              fontFamily: 'Arial Black, sans-serif',
            }}
          >
            {number}
          </span>
        </div>
      </div>
    </div>
  );
};

// Partícula decorativa
const Sparkle = ({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: `${size}px`,
      height: `${size}px`,
      background: 'radial-gradient(circle, #FCBF49 0%, rgba(252,191,73,0) 70%)',
      borderRadius: '50%',
      animation: 'sparkle 2s ease-in-out infinite',
      animationDelay: `${delay}s`,
      pointerEvents: 'none',
    }}
  />
);

export function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gameRepository.getGames().then(data => {
      setGames(data);
      setLoading(false);
    });
  }, []);

  const activeGames = games.filter(g => g.state === 'RUNNING' || g.state === 'PAUSED');
  const upcomingGames = games.filter(g => g.state === 'OPEN' || g.state === 'READY');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div style={{ padding: '2rem 1rem', maxWidth: '64rem', margin: '0 auto' }}>
      
      {/* HERO SECTION - Diseño Casa de Apuestas */}
      <div style={{ 
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '4rem', 
        padding: '5rem 2rem 4rem',
        borderRadius: 'var(--radius-2xl)', 
        border: '2px solid rgba(252, 191, 73, 0.3)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}>
        {/* Efectos de luz de fondo */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-20%',
          width: '60%',
          height: '200%',
          background: 'radial-gradient(ellipse at center, rgba(252,191,73,0.15) 0%, rgba(252,191,73,0) 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-10%',
          width: '50%',
          height: '150%',
          background: 'radial-gradient(ellipse at center, rgba(230,57,70,0.1) 0%, rgba(230,57,70,0) 70%)',
          pointerEvents: 'none',
        }} />

        {/* Partículas decorativas */}
        <Sparkle x="10%" y="20%" size={6} delay={0} />
        <Sparkle x="85%" y="15%" size={8} delay={0.5} />
        <Sparkle x="75%" y="70%" size={5} delay={1} />
        <Sparkle x="20%" y="75%" size={7} delay={1.5} />
        <Sparkle x="50%" y="10%" size={4} delay={0.8} />

        {/* Bolas 3D Realistas con rebote */}
        <BingoBall3D number={7} color="#E63946" size={70} delay={0} x="5%" y="15%" />
        <BingoBall3D number={52} color="#9B5DE5" size={60} delay={0.5} x="78%" y="10%" />
        <BingoBall3D number={18} color="#2A9D8F" size={65} delay={1} x="8%" y="65%" />
        <BingoBall3D number={34} color="#F77F00" size={75} delay={1.5} x="75%" y="60%" />

        {/* Contenido central */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '2rem', 
          position: 'relative',
          zIndex: 10
        }}>
          {/* Logo con efecto de brillo */}
          <div style={{ position: 'relative' }}>
            <img 
              src="/logo.png" 
              alt="AppyBingo" 
              style={{ 
                height: '140px', 
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.5))',
                animation: 'logoFloat 4s ease-in-out infinite',
              }} 
            />
          </div>

          {/* Texto de Bienvenida */}
          <div style={{ textAlign: 'center', maxWidth: '48rem' }}>
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: 900, 
              color: 'white', 
              marginBottom: '1rem', 
              lineHeight: 1.1,
              textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 0 40px rgba(252,191,73,0.3)',
              letterSpacing: '-0.02em',
            }}>
              ¡La emoción del{' '}
              <span style={{ 
                color: '#FCBF49',
                textShadow: '0 0 20px rgba(252,191,73,0.6), 0 4px 8px rgba(0,0,0,0.5)',
              }}>
                Bingo
              </span>{' '}
              en tiempo real!
            </h1>
            <p style={{ 
              fontSize: '1.25rem', 
              color: '#d4d4e8', 
              maxWidth: '36rem', 
              margin: '0 auto 2.5rem', 
              fontWeight: 400,
              lineHeight: 1.6,
            }}>
              Segura, emocionante y desde cualquier dispositivo. Elige tu partida, solicita tus cartones y ¡que comience la suerte!
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const firstUpcoming = upcomingGames[0];
                if (firstUpcoming) {
                  window.location.hash = '#/solicitar/' + firstUpcoming.id;
                } else {
                  window.location.hash = '#solicitar';
                }
              }}
              className="cta-button-premium"
              style={{
                background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 100%)',
                color: '#0A1628',
                fontWeight: 800,
                fontSize: '1.25rem',
                padding: '1.25rem 3rem',
                border: 'none',
                borderRadius: '9999px',
                boxShadow: '0 10px 30px rgba(252,191,73,0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'inherit',
                position: 'relative',
                zIndex: 20,
              }}
            >
              🎟️ Solicitar Cartones Ahora
            </button>
          </div>
        </div>
      </div>

      {/* PARTIDAS EN VIVO */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '16px', height: '16px', background: '#E63946', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 12px #E63946', animation: 'pulse-glow 2s ease-in-out infinite' }}></span>
          Partidas en Vivo
        </h2>
        {loading ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando partidas...</p>
        ) : activeGames.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>No hay partidas en vivo en este momento. ¡Revisa las próximas!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {activeGames.map(game => (
              <GameCard key={game.id} game={game} isActive={true} formatCurrency={formatCurrency} />
            ))}
          </div>
        )}
      </div>

      {/* PRÓXIMAS PARTIDAS */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '16px', height: '16px', background: '#2A9D8F', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 12px #2A9D8F' }}></span>
          Próximas Partidas
        </h2>
        {loading ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando partidas...</p>
        ) : upcomingGames.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>No hay próximas partidas programadas. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {upcomingGames.map(game => (
              <GameCard key={game.id} game={game} isActive={false} formatCurrency={formatCurrency} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce3d {
          0%, 100% { 
            transform: translateY(0) scale(1); 
          }
          50% { 
            transform: translateY(-25px) scale(1.05); 
          }
        }
        @keyframes shadowPulse {
          0%, 100% { 
            transform: translateX(-50%) scale(1); 
            opacity: 0.6;
          }
          50% { 
            transform: translateX(-50%) scale(0.7); 
            opacity: 0.3;
          }
        }
        @keyframes sparkle {
          0%, 100% { 
            opacity: 0; 
            transform: scale(0.5); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2); 
          }
        }
        @keyframes logoFloat {
          0%, 100% { 
            transform: translateY(0); 
          }
          50% { 
            transform: translateY(-8px); 
          }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 12px #E63946; }
          50% { opacity: 0.6; box-shadow: 0 0 20px #E63946; }
        }
        .cta-button-premium:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 15px 40px rgba(252,191,73,0.6), 0 0 0 8px rgba(252,191,73,0.1) !important;
        }
        .cta-button-premium:active {
          transform: translateY(0) scale(0.98);
        }
      `}</style>
    </div>
  );
}

function GameCard({ game, isActive, formatCurrency }: { game: Game; isActive: boolean; formatCurrency: (v: number) => string }) {
  
    const handleShare = () => {
    const shareUrl = `${window.location.origin}/#/solicitar/${game.id}`;
    const message = `¡Juega AppyBingo: ${game.name}!\nSolicita tu cartón ahora. ¡Mucha suerte! 🍀\n${shareUrl}`;
    const encodedMessage = encodeURIComponent(message);
    
    // Forzar apertura de WhatsApp nativo (App móvil o Desktop)
    window.location.href = `https://api.whatsapp.com/send?text=${encodedMessage}`;
  };

  const borderColor = isActive ? '#E63946' : '#2A9D8F';
  const badgeBg = isActive ? 'rgba(230, 57, 70, 0.15)' : 'rgba(42, 157, 143, 0.15)';
  const badgeColor = isActive ? '#E63946' : '#2A9D8F';
  const boxShadow = isActive ? '0 8px 24px rgba(230, 57, 70, 0.2)' : '0 8px 24px rgba(42, 157, 143, 0.1)';

  return (
    <div style={{
      background: 'var(--color-bg-surface)',
      border: `2px solid ${borderColor}`,
      borderRadius: 'var(--radius-xl)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxShadow,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = isActive ? '0 12px 32px rgba(230, 57, 70, 0.3)' : '0 12px 32px rgba(42, 157, 143, 0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = boxShadow;
    }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'white' }}>{game.name}</h3>
          <span style={{
            padding: '0.375rem 0.875rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: badgeBg,
            color: badgeColor,
            border: `2px solid ${badgeColor}`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {isActive ? '🔴 EN VIVO' : '🟢 PRÓXIMA'}
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Variante: {game.variant}</p>
        {game.scheduledAt && !isActive && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginTop: '0.5rem', 
            padding: '0.5rem 0.75rem', 
            background: 'rgba(252, 191, 73, 0.1)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(252, 191, 73, 0.3)'
          }}>
            <span style={{ fontSize: '1rem' }}>🕒</span>
            <span style={{ fontSize: '0.875rem', color: '#FCBF49', fontWeight: 600 }}>
              Programado: {new Date(game.scheduledAt).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>🏆 Premio Mayor</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FCBF49' }}>{formatCurrency(game.prizeValue)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>🎟️ Valor Cartón</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>{formatCurrency(game.pricePerCard)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isActive ? (
          <>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => window.location.hash = `#/game/${game.id}`}
              style={{
                background: 'linear-gradient(135deg, #E63946 0%, #F77F00 100%)',
                fontWeight: 700
              }}
            >
              👁️ Ver Sala en Vivo
            </Button>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', fontWeight: 500 }}>
              La venta de cartones está cerrada para esta partida.
            </p>
          </>
        ) : (
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => window.location.hash = `#/solicitar/${game.id}`}
            style={{
              background: 'linear-gradient(135deg, #2A9D8F 0%, #0077B6 100%)',
              fontWeight: 700
            }}
          >
            🎟️ Solicitar Cartones
          </Button>
        )}
      
        <button
          onClick={handleShare}
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >
          🔗 Compartir partida
        </button>
      </div>
    </div>
  );
}