import { useEffect, useState } from 'react';
import { gameRepository, cardRepository } from '../repositories';
import type { Game, Card } from '@bingo-types/index';

export function GameRoomPage() {
  // 1. Validación inicial FUERA del useEffect para evitar setState síncrono
  const initialGameId = window.location.hash.replace('#/game/', '').trim();
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(!!initialGameId);
  const [error, setError] = useState<string | null>(initialGameId ? null : 'ID de juego no válido');
  const [playerCards, setPlayerCards] = useState<Card[]>([]);

  useEffect(() => {
    // 2. Salida temprana sin llamar a setState (el estado ya está correcto)
    if (!initialGameId) {
      return;
    }

    // 3. Suscripción en tiempo real (setState dentro de callback permitido)
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

    // 4. Carga asíncrona de cartones (setState dentro de promesa permitido)
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

      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '3rem',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎲</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Área de Sorteo</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          El sorteo estará disponible cuando el juego inicie.
        </p>
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
    </div>
  );
}
