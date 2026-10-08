import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { RequestCard } from '../components/admin/RequestCard';
import { RequestFilters } from '../components/admin/RequestFilters';
import { requestRepository, gameRepository } from '../repositories';
import { filterRequests, countRequestsByStatus, countTotalRequestedCards } from '../utils/admin';
import type { CardRequest, Game } from '@bingo-types/index';
import type { RequestFilter } from '../utils/admin';
import styles from './AdminDashboard.module.css';

export function AdminDashboard() {
  const [requests, setRequests] = useState<CardRequest[]>([]);
  const [filter, setFilter] = useState<RequestFilter>('TODAS');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [reqData, gamesData] = await Promise.all([
        requestRepository.getRequests(),
        gameRepository.getGames()
      ]);
      setRequests(reqData);
      setGames(gamesData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      console.error('Error cargando datos:', err);
      setError('No se pudieron cargar los datos. Detalle: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  
  // Obtener IDs de juegos activos e históricos
  const activeGameIds = new Set(games.filter(g => g.state === 'OPEN' || g.state === 'READY').map(g => g.id));
  const historyGameIds = new Set(games.filter(g => g.state === 'FINISHED' || g.state === 'CANCELLED').map(g => g.id));

  // Filtrar solicitudes según el modo de vista
  const filteredByMode = requests.filter(req => {
    if (viewMode === 'ACTIVE') {
      // Mostrar solicitudes de juegos activos, o pendientes sin juego asignado aún
      return !req.gameId || activeGameIds.has(req.gameId);
    } else {
      // Mostrar solicitudes de juegos finalizados o cancelados
      return req.gameId && historyGameIds.has(req.gameId);
    }
  });

  const finalFilteredRequests = filterRequests(filteredByMode, { status: filter, search });
  const counts = countRequestsByStatus(filteredByMode);
  const totalCards = countTotalRequestedCards(filteredByMode);


  const handleView = (id: string) => {
    window.location.hash = '#/admin/requests/' + id;
  };

  return (
    <AdminLayout currentPath="/admin/requests">
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Gestión de Solicitudes</h1>
        <p className={styles.subtitle}>Administra las solicitudes de cartones de los jugadores</p>
        
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando solicitudes...</div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-lg)' }}>
            {error}
          </div>
        ) : (
          <>
            
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setViewMode('ACTIVE')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: viewMode === 'ACTIVE' ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
              color: viewMode === 'ACTIVE' ? 'white' : 'var(--color-text-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Solicitudes Activas
          </button>
          <button
            onClick={() => setViewMode('HISTORY')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: viewMode === 'HISTORY' ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
              color: viewMode === 'HISTORY' ? 'white' : 'var(--color-text-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Histórico / Estadísticas
          </button>
        </div>

            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.statCardPending}`}>
                <div className={styles.statValue}>{counts.PENDIENTE}</div>
                <div className={styles.statLabel}>Pendientes</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardApproved}`}>
                <div className={styles.statValue}>{counts.APROBADA}</div>
                <div className={styles.statLabel}>Aprobadas</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardRejected}`}>
                <div className={styles.statValue}>{counts.RECHAZADA}</div>
                <div className={styles.statLabel}>Rechazadas</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardTotal}`}>
                <div className={styles.statValue}>{totalCards}</div>
                <div className={styles.statLabel}>Cartones Solicitados</div>
              </div>
            </div>

            <RequestFilters
              currentFilter={filter}
              search={search}
              onFilterChange={setFilter}
              onSearchChange={setSearch}
            />

            <div style={{ display: 'grid', gap: '1rem' }}>
              {finalFilteredRequests.map(request => (
                <RequestCard key={request.id} request={request} onView={handleView} />
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}