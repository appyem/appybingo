import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, Users, Ticket, Clock } from 'lucide-react';
import styles from './UpcomingGame.module.css';

export function UpcomingGame() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Próxima Partida</h2>
            <p className={styles.sectionSubtitle}>Reserva tu lugar antes de que comience</p>
          </div>
          <Badge variant="warning">
            <Clock style={{ height: '0.75rem', width: '0.75rem', marginRight: '0.5rem' }} />
            EN PREPARACIÓN
          </Badge>
        </div>
        
        <div className={styles.card}>
          <div className={styles.cardBanner}>
            <div className={styles.cardBannerHeader}>
              <div>
                <Badge variant="warning" style={{ display: 'flex', marginBottom: '0.75rem' }}>
                  <Clock style={{ height: '0.75rem', width: '0.75rem', marginRight: '0.25rem' }} />
                  EN PREPARACIÓN
                </Badge>
                <h3 className={styles.cardTitle}>Bingo Nocturno Especial</h3>
                <div className={styles.cardMeta}>
                  <Calendar />
                  <span className={styles.cardMetaText}>Hoy, 8:00 PM</span>
                  <span className={styles.cardMetaSeparator}>•</span>
                  <span className={styles.cardMetaText}>Modalidad: 75 Bolas</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.cardBody}>
            <div className={styles.cardStats}>
              <div className={styles.stat}>
                <div className={`${styles.statIcon} ${styles.statIconPlayers}`}>
                  <Users />
                </div>
                <div>
                  <div className={styles.statValue}>24</div>
                  <div className={styles.statLabel}>Jugadores</div>
                </div>
              </div>
              
              <div className={styles.stat}>
                <div className={`${styles.statIcon} ${styles.statIconTickets}`}>
                  <Ticket />
                </div>
                <div>
                  <div className={styles.statValue}>18</div>
                  <div className={styles.statLabel}>Disponibles</div>
                </div>
              </div>
              
              <div className={styles.stat}>
                <div className={`${styles.statIcon} ${styles.statIconPrice}`}>
                  <Calendar />
                </div>
                <div>
                  <div className={styles.statValue}>$5</div>
                  <div className={styles.statLabel}>Por cartón</div>
                </div>
              </div>
            </div>
            
            <Button variant="outline" size="lg" style={{ width: '100%' }}>
              Reservar Lugar
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
