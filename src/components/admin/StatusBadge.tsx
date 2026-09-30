import type { RequestStatus } from '@bingo-types/index';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: RequestStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}