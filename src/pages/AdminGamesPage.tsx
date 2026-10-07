import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Button } from '../components/ui/Button';
import { gameRepository, cardRepository } from '../repositories';
import { Trash2 } from 'lucide-react';
import type { Game, GameState } from '@bingo-types/index';

export function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGameName, setNewGameName] = useState('');
  const [pricePerCard, setPricePerCard] = useState('');
  const [prizeValue, setPrizeValue] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [drawing, setDrawing] = useState<string | null>(null);
  const [deletingGame, setDeletingGame] = useState<string | null>(null);

  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gameRepository.getGames();
      setGames(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      console.error('Error cargando juegos:', err);
      setError('No se pudieron cargar los juegos. Detalle: ' + message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGames();
  }, []);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim() || !pricePerCard || !prizeValue) {
      alert('Por favor completa todos los campos, incluyendo los valores monetarios.');
      return;
    }
    
    setCreating(true);
    try {
      await gameRepository.createGame({
        name: newGameName.trim(),
        variant: 'BINGO_75',
        state: 'DRAFT',
        createdBy: 'admin',
        pricePerCard: Number(pricePerCard),
        prizeValue: Number(prizeValue),
        scheduledAt: scheduledDate ? new Date(scheduledDate).getTime() : undefined
      });
      setNewGameName('');
      setPricePerCard('');
      setPrizeValue('');
      setScheduledDate('');
      await loadGames();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al crear el juego: ' + message);
    } finally {
      setCreating(false);
    }
  };

  const handleStateChange = async (game: Game, newState: GameState) => {
    if (newState === game.state) return;
    if (!confirm(`¿Cambiar estado del juego "${game.name}" de ${game.state} a ${newState}?`)) return;
    
    try {
      await gameRepository.updateGameState(game.id, newState);
      await loadGames();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al actualizar el estado: ' + message);
    }
  };

  const handleDrawNumber = async (gameId: string) => {
    // Verificar si ya hay un ganador en este juego antes de sacar otra balota
    const allCards = await cardRepository.getCards();
    const hasWinner = allCards.some(c => c.gameId === gameId && c.status === 'WINNER');
    
    if (hasWinner) {
      alert('⚠️ ¡ATENCIÓN! Ya existe un ganador en esta partida. No se pueden sacar más balotas.');
      return;
    }

    setDrawing(gameId);
    try {
      const nextNumber = await gameRepository.drawNextNumber(gameId);
      if (nextNumber) {
        alert(`¡Número sorteado: ${nextNumber}!`);
      }
      await loadGames();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al sortear: ' + message);
    } finally {
      setDrawing(null);
    }
  };

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el juego "${gameName}"? Esta acción no se puede deshacer y los cartones asociados quedarán huérfanos.`)) return;
    
    setDeletingGame(gameId);
    try {
      await gameRepository.deleteGame(gameId);
      await loadGames();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al eliminar el juego: ' + message);
    } finally {
      setDeletingGame(null);
    }
  };

  const getAvailableStates = (currentState: GameState): GameState[] => {
    const transitions: Record<GameState, GameState[]> = {
      'DRAFT': ['OPEN', 'CANCELLED'],
      'OPEN': ['READY', 'CANCELLED'],
      'READY': ['RUNNING', 'OPEN', 'CANCELLED'],
      'RUNNING': ['PAUSED', 'FINISHED', 'CANCELLED'],
      'PAUSED': ['RUNNING', 'FINISHED', 'CANCELLED'],
      'FINISHED': [],
      'CANCELLED': []
    };
    
    return transitions[currentState] || [];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
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

  return (
    <>
      
      <style>{`
        @media (max-width: 768px) {
          .admin-table-container {
            overflow-x: hidden !important;
            overflow-y: auto !important;
            max-height: 65vh;
            -webkit-overflow-scrolling: touch;
            width: 100% !important;
          }
          .admin-table {
            display: block !important;
            width: 100% !important;
            min-width: 0 !important;
          }
          .admin-table tbody {
            display: block;
            width: 100%;
          }
          .admin-table tr {
            display: block;
            width: 100%;
            margin-bottom: 0.75rem;
            background: var(--color-bg-elevated);
            border-radius: var(--radius-md);
            padding: 0.75rem;
            border: 1px solid var(--color-border);
            box-sizing: border-box;
          }
          .admin-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--color-border);
            font-size: 0.875rem;
            width: 100%;
            box-sizing: border-box;
          }
          .admin-table td:last-child {
            border-bottom: none;
            justify-content: flex-end;
            margin-top: 0.25rem;
          }
          .admin-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: var(--color-text-muted);
            flex-shrink: 0;
            margin-right: 1rem;
            text-align: left;
          }
          .admin-table thead {
            display: none;
          }
        }
      `}</style>

      <AdminLayout currentPath="/admin/games">
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', marginBottom: '2rem' }}>Gestión de Juegos</h1>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando juegos...</div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-lg)' }}>
            {error}
          </div>
        ) : (
          <>
            <form onSubmit={handleCreateGame} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', marginBottom: '2rem', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Nombre del juego</label>
                <input type="text" placeholder="Ej: Bingo Nocturno #1" value={newGameName} onChange={(e) => setNewGameName(e.target.value)} required style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'white', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Valor por cartón ($)</label>
                <input type="number" placeholder="5000" value={pricePerCard} onChange={(e) => setPricePerCard(e.target.value)} required min="1" style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'white', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Premio Mayor ($)</label>
                <input type="number" placeholder="500000" value={prizeValue} onChange={(e) => setPrizeValue(e.target.value)} required min="1" style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'white', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Fecha y Hora Programada</label>
                <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'white', fontSize: '0.875rem' }} />
              </div>
              <Button variant="primary" size="md" type="submit" disabled={creating || !newGameName.trim() || !pricePerCard || !prizeValue}>
                {creating ? 'Creando...' : 'Crear Juego'}
              </Button>
            </form>

            <div className="admin-table-container" style={{ overflowX: 'auto', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-elevated)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Nombre</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Variante</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Estado Actual</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Cambiar a</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Sorteo</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Acciones</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Programado</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map(g => {
                    const availableStates = getAvailableStates(g.state);
                    return (
                      <tr key={g.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                        <td data-label="Nombre" style={{ padding: '1rem', color: 'white', fontWeight: 600 }}>{g.name}</td>
                        <td data-label="Variante" style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{g.variant}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                            background: `${getStateColor(g.state)}20`,
                            color: getStateColor(g.state),
                            border: `1px solid ${getStateColor(g.state)}`
                          }}>
                            {g.state}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {availableStates.length === 0 ? (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Estado final</span>
                          ) : (
                            <select
                              onChange={(e) => handleStateChange(g, e.target.value as GameState)}
                              value=""
                              style={{
                                padding: '0.5rem',
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                color: 'white',
                                fontSize: '0.875rem',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">Seleccionar estado...</option>
                              {availableStates.map(state => (
                                <option key={state} value={state}>{state}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {g.state === 'RUNNING' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              {g.currentBall ? (
                                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                                  {g.currentBall}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sin bolas</span>
                              )}
                              <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={() => handleDrawNumber(g.id)}
                                disabled={drawing === g.id || (g.drawnNumbers?.length || 0) >= 75}
                              >
                                {drawing === g.id ? 'Sorteando...' : (g.drawnNumbers?.length || 0) >= 75 ? 'Finalizado' : 'Sacar Bola'}
                              </Button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              Inicia el juego (RUNNING)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteGame(g.id, g.name)}
                            disabled={deletingGame === g.id}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-error)',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              borderRadius: 'var(--radius-md)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              opacity: deletingGame === g.id ? 0.5 : 1
                            }}
                            title="Eliminar juego"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                        <td data-label="Programado" style={{ padding: '1rem', color: g.scheduledAt ? 'var(--color-warning)' : 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: g.scheduledAt ? 600 : 400 }}>
                          {g.scheduledAt ? new Date(g.scheduledAt).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Sin programar'}
                        </td>
                        <td data-label="Creado" style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{formatDate(g.createdAt)}</td>
                      </tr>
                    );
                  })}
                  {games.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No hay juegos creados aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
    </>
  );
}
