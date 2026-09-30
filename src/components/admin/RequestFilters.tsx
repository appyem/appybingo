import type { RequestFilter } from '../../utils/admin';
import styles from './RequestFilters.module.css';

interface RequestFiltersProps {
  currentFilter: RequestFilter;
  search: string;
  onFilterChange: (filter: RequestFilter) => void;
  onSearchChange: (search: string) => void;
}

const FILTERS: RequestFilter[] = ['TODAS', 'PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'CANCELADA'];

export function RequestFilters({ currentFilter, search, onFilterChange, onSearchChange }: RequestFiltersProps) {
  return (
    <div className={styles.filters}>
      <div className={styles.filterRow}>
        <div className={styles.statusFilters}>
          {FILTERS.map(filter => (
            <button
              key={filter}
              className={`${styles.statusButton} ${currentFilter === filter ? styles.statusButtonActive : ''}`}
              onClick={() => onFilterChange(filter)}
            >
              {filter === 'EN_REVISION' ? 'EN REVISIÓN' : filter}
            </button>
          ))}
        </div>
        
        <input
          type="text"
          placeholder="Buscar por ID, nombre o WhatsApp..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>
    </div>
  );
}