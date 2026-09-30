import { Minus, Plus } from 'lucide-react';
import styles from './QuantitySelector.module.css';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({ value, onChange, min = 1, max = 99 }: QuantitySelectorProps) {
  return (
    <div className={styles.selector}>
      <button 
        className={styles.button} 
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Disminuir cantidad"
      >
        <Minus size={20} />
      </button>
      <span className={styles.value}>{value}</span>
      <button 
        className={styles.button} 
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Aumentar cantidad"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}