import type { CardMatrix } from '@bingo-types/index';
import styles from './BingoCardDisplay.module.css';

interface BingoCardDisplayProps {
  matrix: CardMatrix;
  cardNumber?: string;
  className?: string;
}

export function BingoCardDisplay({ matrix, cardNumber, className = '' }: BingoCardDisplayProps) {
  const columns = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {cardNumber && (
        <div className={styles.cardNumber}>
          <div className={styles.cardNumberLabel}>Cartón</div>
          <div className={styles.cardNumberValue}>#{cardNumber}</div>
        </div>
      )}
      
      <div className={styles.cardContainer}>
        <div className={styles.cardGlow} />
        
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderGrid}>
              {columns.map((col) => (
                <div 
                  key={col} 
                  className={styles.cardHeaderCell}
                  aria-label={`Columna ${col}`}
                >
                  {col}
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.cardBody}>
            <div className={styles.cardGrid}>
              {matrix.map((row, rowIndex) => (
                row.map((cell, colIndex) => {
                  const isFree = cell === 'FREE';
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`${styles.cardCell} ${isFree ? styles.cardCellFree : styles.cardCellNumber}`}
                      aria-label={isFree ? 'Espacio libre' : `Número ${cell}`}
                    >
                      {isFree ? (
                        <span className={styles.cardCellFreeText}>FREE</span>
                      ) : (
                        cell
                      )}
                    </div>
                  );
                })
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
