import { Button } from '../ui/Button';
import { BingoCardDisplay } from '../bingo/BingoCardDisplay';
import { Sparkles, Play } from 'lucide-react';
import { generateBingoCard } from '@domain/cards/generator';
import styles from './Hero.module.css';

export function Hero() {
  const demoCard = generateBingoCard();

  return (
    <section className={styles.hero} id="inicio">
      <div className={styles.heroBackground} />
      <div className={styles.heroGlow} />
      
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.heroBadge}>
              <Sparkles className={styles.heroBadgeIcon} />
              <span className={styles.heroBadgeText}>Plataforma de Bingo en Vivo</span>
            </div>
            
            <h1 className={styles.heroTitle}>
              La emoción del Bingo{' '}
              <span className={styles.heroTitleGradient}>en tu bolsillo</span>
            </h1>
            
            <p className={styles.heroDescription}>
              Únete a partidas en tiempo real, solicita tu cartón al instante y vive la experiencia del Bingo moderno desde cualquier dispositivo.
            </p>
            
            <div className={styles.heroActions}>
              <Button variant="primary" size="lg">
                <Play style={{ height: '1.25rem', width: '1.25rem', marginRight: '0.5rem' }} />
                Solicitar Cartón
              </Button>
              <Button variant="outline" size="lg">
                Ver Partidas
              </Button>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroVisualGlow} />
            <div className={styles.heroVisualContent}>
              <BingoCardDisplay matrix={demoCard} cardNumber="0042" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
