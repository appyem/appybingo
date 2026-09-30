import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Button } from '../components/ui/Button';
import { gameRepository } from '../repositories';
import type { Game, GameState } from '@bingo-types/index';

export function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGameName, setNewGameName] = useState('');
  const [creating, setCreating] = useState(false);

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
    if (!newGameName.trim()) return;
    
    setCreating(true);
    try {
      await gameRepository.createGame({
        name: newGameName.trim(),
        variant: 'BINGO_75',
        state: 'DRAFT',
        createdBy: 'admin' // En el futuro será el UID del admin
      });
      setNewGameName('');
      await loadGames();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al crear el juego: ' + message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleState = async (game: Game) => {
    const newState: GameState = game.state === 'DRAFT' ? 'OPEN' : 'DRAFT';
    if (!confirm(`¿Cambiar estado del juego "${game.name}" a ${newState}?`)) return;
    
    try {
      await gameRepository.updateGameState(game.id, newState);
      await loadGames();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al actualizar el estado: ' + message);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
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
            <form onSubmit={handleCreateGame} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  Nombre del nuevo juego
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Bingo Nocturno #1" 
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'white', fontSize: '0.875rem' }}
                />
              </div>
              <Button variant="primary" size="md" type="submit" disabled={creating || !newGameName.trim()}>
                {creating ? 'Creando...' : 'Crear Juego (DRAFT)'}
              </Button>
            </form>

            <div style={{ overflowX: 'auto', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-elevated)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Nombre</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Variante</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Estado</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Creado</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map(g => (
                    <tr key={g.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '1rem', color: 'white', fontWeight: 600 }}>{g.name}</td>
                      <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{g.variant}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                          background: g.state === 'OPEN' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: g.state === 'OPEN' ? 'var(--color-success)' : 'var(--color-warning)',
                          border: `1px solid ${g.state === 'OPEN' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                        }}>
                          {g.state}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{formatDate(g.createdAt)}</td>
                      <td style={{ padding: '1rem' }}>
                        <Button 
                          variant={g.state === 'DRAFT' ? 'primary' : 'outline'} 
                          size="sm" 
                          onClick={() => handleToggleState(g)}
                        >
                          {g.state === 'DRAFT' ? 'Abrir Juego' : 'Cerrar a DRAFT'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {games.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
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
  );
}
