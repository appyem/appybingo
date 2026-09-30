import { Ticket, Link, Trophy } from 'lucide-react';
import styles from './HowItWorks.module.css';

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Ticket,
      title: 'Solicita tu cartón',
      description: 'Elige tu partida y obtén tu cartón único al instante',
    },
    {
      number: '02',
      icon: Link,
      title: 'Recibe tu enlace',
      description: 'Accede a tu cartón personalizado desde cualquier dispositivo',
    },
    {
      number: '03',
      icon: Trophy,
      title: 'Juega y gana',
      description: 'Marca tus números en tiempo real y compite por el premio',
    },
  ];

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>¿Cómo funciona?</h2>
          <p className={styles.sectionSubtitle}>
            Jugar en AppyBingo es simple, rápido y emocionante
          </p>
        </div>
        
        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <div key={index} className={styles.step}>
              <div className={styles.stepGlow} />
              
              <div className={styles.stepContent}>
                <div className={styles.stepNumber}>
                  {step.number}
                </div>
                
                <div className={styles.stepIcon}>
                  <step.icon />
                </div>
                
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
