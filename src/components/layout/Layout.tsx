import { Header } from './Header';
import { Trophy } from 'lucide-react';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <div className={styles.footerLogoIcon}>
                  <Trophy />
                </div>
                <div className={styles.footerLogoText}>
                  <span className={styles.footerLogoTextPrimary}>APPY</span>
                  <span className={styles.footerLogoTextSecondary}>BINGO</span>
                </div>
              </div>
              <p className={styles.footerDescription}>
                La plataforma de Bingo en vivo más moderna y segura. Juega desde cualquier dispositivo.
              </p>
            </div>
            
            <div className={styles.footerColumn}>
              <h3>Jugar</h3>
              <ul className={styles.footerLinks}>
                <li><a href="#partidas" className={styles.footerLink}>Partidas en vivo</a></li>
                <li><a href="#proximas" className={styles.footerLink}>Próximas partidas</a></li>
                <li><a href="#como-funciona" className={styles.footerLink}>Cómo funciona</a></li>
              </ul>
            </div>
            
            <div className={styles.footerColumn}>
              <h3>Soporte</h3>
              <ul className={styles.footerLinks}>
                <li><a href="#ayuda" className={styles.footerLink}>Centro de ayuda</a></li>
                <li><a href="#contacto" className={styles.footerLink}>Contacto</a></li>
                <li><a href="#faq" className={styles.footerLink}>Preguntas frecuentes</a></li>
              </ul>
            </div>
            
            <div className={styles.footerColumn}>
              <h3>Legal</h3>
              <ul className={styles.footerLinks}>
                <li><a href="#terminos" className={styles.footerLink}>Términos de uso</a></li>
                <li><a href="#privacidad" className={styles.footerLink}>Política de privacidad</a></li>
                <li><a href="#cookies" className={styles.footerLink}>Política de cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <p className={styles.footerCopyright}>
              © {new Date().getFullYear()} AppyBingo por AppyEmpresa. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
