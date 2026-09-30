import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Users, Ticket, Zap } from 'lucide-react';
import styles from './ActiveGame.module.css';

export function ActiveGame() {
  return (
    <section className={styles.section} id="partidas">
      <div className="container">
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Partida en Vivo</h2>
            <p className={styles.sectionSubtitle}>Únete ahora y compite en tiempo real</p>
          </div>
          <Badge variant="success" style={{ display: 'none' }}>
            <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', background: 'var(--color-success)', animation: 'pulse-glow 2s infinite', marginRight: '0.5rem' }} />
            EN VIVO
          </Badge>
        </div>
        
        <div className={styles.card}>
          <div className={styles.cardGlow} />
          
          <div className={styles.cardContent}>
            <div className={styles.cardInner}>
              <div className={styles.cardInfo}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <Zap />
                  </div>
                  <div>
                    <Badge variant="success" style={{ display: 'flex', marginBottom: '0.5rem' }}>
                      <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', background: 'var(--color-success)', animation: 'pulse-glow 2s infinite', marginRight: '0.5rem' }} />
                      EN VIVO
                    </Badge>
                    <h3 className={styles.cardTitle}>Gran Bingo AppyBingo #042</h3>
                  </div>
                </div>
                
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
                      <div className={styles.statValue}>150</div>
                      <div className={styles.statLabel}>Cartones</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.cardActions}>
                <Button variant="primary" size="lg">
                  Unirse a la Partida
                </Button>
                <Button variant="outline" size="lg">
                  Ver Detalles
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
