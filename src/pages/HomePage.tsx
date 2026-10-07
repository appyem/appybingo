import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { gameRepository } from '../repositories';
import type { Game } from '@bingo-types/index';

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
      
      {/* HERO SECTION CON LOGO Y Bolas DE BINGO */}
      <div style={{ 
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '4rem', 
        padding: '4rem 2rem', 
        background: 'linear-gradient(135deg, #1E6FE8 0%, #0077B6 100%)',
        borderRadius: 'var(--radius-2xl)', 
        border: '2px solid var(--color-border-light)',
        boxShadow: '0 20px 60px rgba(30, 111, 232, 0.3)'
      }}>
        {/* Bolas de Bingo Decorativas Flotantes */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '60px', height: '60px', background: '#E63946', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem', color: 'white', boxShadow: '0 8px 16px rgba(230, 57, 70, 0.4)', animation: 'float 3s ease-in-out infinite' }}>7</div>
        <div style={{ position: 'absolute', top: '20%', right: '8%', width: '50px', height: '50px', background: '#9B5DE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem', color: 'white', boxShadow: '0 8px 16px rgba(155, 93, 229, 0.4)', animation: 'float 4s ease-in-out infinite 0.5s' }}>52</div>
        <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: '55px', height: '55px', background: '#2A9D8F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem', color: 'white', boxShadow: '0 8px 16px rgba(42, 157, 143, 0.4)', animation: 'float 3.5s ease-in-out infinite 1s' }}>18</div>
        <div style={{ position: 'absolute', bottom: '20%', right: '5%', width: '65px', height: '65px', background: '#F77F00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem', color: 'white', boxShadow: '0 8px 16px rgba(247, 127, 0, 0.4)', animation: 'float 4.5s ease-in-out infinite 1.5s' }}>34</div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '2rem', 
          position: 'relative',
          zIndex: 1
        }}>
          {/* Logo Grande */}
          <img 
            src="/logo.png" 
            alt="AppyBingo" 
            style={{ 
              height: '120px', 
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
            }} 
          />

          {/* Texto de Bienvenida */}
          <div style={{ textAlign: 'center', maxWidth: '48rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'white', marginBottom: '1rem', lineHeight: 1.1, textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
              ¡La emoción del <span style={{ color: '#FCBF49' }}>Bingo</span> en tiempo real!
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#B8D4F0', maxWidth: '36rem', margin: '0 auto 2rem', fontWeight: 500 }}>
              Segura, emocionante y desde cualquier dispositivo. Elige tu partida, solicita tus cartones y ¡que comience la suerte!
            </p>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => {
                const firstUpcoming = upcomingGames[0];
                if (firstUpcoming) {
                  window.location.hash = `#/solicitar/${firstUpcoming.id}`;
                } else {
                  window.location.hash = '#/solicitar';
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 100%)',
                color: '#0A1628',
                fontWeight: 700,
                fontSize: '1.125rem',
                padding: '1rem 2rem',
                boxShadow: '0 8px 20px rgba(252, 191, 73, 0.4)'
              }}
            >
              🎟️ Solicitar Cartones Ahora
            </Button>
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
    </div>
  );
}

function GameCard({ game, isActive, formatCurrency }: { game: Game; isActive: boolean; formatCurrency: (v: number) => string }) {
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
      </div>
    </div>
  );
}
