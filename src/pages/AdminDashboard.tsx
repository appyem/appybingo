import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { RequestCard } from '../components/admin/RequestCard';
import { RequestFilters } from '../components/admin/RequestFilters';
import { requestRepository } from '../repositories';
import { filterRequests, countRequestsByStatus, countTotalRequestedCards } from '../utils/admin';
import type { CardRequest } from '@bingo-types/index';
import type { RequestFilter } from '../utils/admin';
import styles from './AdminDashboard.module.css';

export function AdminDashboard() {
  const [requests, setRequests] = useState<CardRequest[]>([]);
  const [filter, setFilter] = useState<RequestFilter>('TODAS');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await requestRepository.getRequests();
      setRequests(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      console.error('Error cargando solicitudes:', err);
      setError('No se pudieron cargar las solicitudes. Verifica los índices de Firestore. Detalle: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRequests();
  }, []);

  const filteredRequests = filterRequests(requests, { status: filter, search });
  const counts = countRequestsByStatus(requests);
  const totalCards = countTotalRequestedCards(requests);

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
              {filteredRequests.map(request => (
                <RequestCard key={request.id} request={request} onView={handleView} />
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}