import { Button } from '../ui/Button';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../../utils/admin';
import type { CardRequest } from '@bingo-types/index';
import styles from './RequestCard.module.css';

interface RequestCardProps {
  request: CardRequest;
  onView: (id: string) => void;
}

export function RequestCard({ request, onView }: RequestCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.requestId}>{request.id}</div>
        <StatusBadge status={request.status || 'PENDIENTE'} />
      </div>
      
      <div className={styles.playerName}>{request.playerName}</div>
      <div className={styles.whatsapp}>{request.whatsapp}</div>
      
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Cartones</span>
          <span className={styles.statValue}>{request.requestedCards}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Fecha</span>
          <span className={styles.statValue}>{formatDate(request.createdAt)}</span>
        </div>
      </div>
      
      <div className={styles.actions}>
        <Button variant="primary" size="sm" onClick={() => onView(request.id)}>
          Ver Detalle
        </Button>
      </div>
    </div>
  );
}