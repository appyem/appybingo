import { Header } from './Header';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <style>{`
        /* Estilos exclusivos y agresivos para comprimir el footer en móviles */
        @media (max-width: 768px) {
          .mobile-footer-compact {
            padding: 0.75rem 0.5rem !important;
          }
          .mobile-footer-grid {
            display: flex;
            flex-direction: column;
            gap: 0.5rem !important;
            text-align: center;
          }
          .mobile-footer-logo {
            height: 28px !important;
            width: auto !important;
            margin: 0 auto 0.25rem auto !important;
            display: block !important;
          }
          .mobile-footer-desc {
            display: none !important;
          }
          .mobile-footer-col {
            margin: 0 !important;
            padding: 0 !important;
          }
          .mobile-footer-col h3 {
            font-size: 0.65rem !important;
            margin: 0 0 0.25rem 0 !important;
            opacity: 0.5;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          /* FORZAR DISTRIBUCIÓN HORIZONTAL DE LOS ENLACES */
          .mobile-footer-links {
            display: flex !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 0.2rem 0.6rem !important;
            padding: 0 !important;
            margin: 0 !important;
            list-style: none !important;
          }
          /* CLAVE: Evitar que cada palabra sea un bloque vertical */
          .mobile-footer-links li {
            display: inline-block !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .mobile-footer-link {
            font-size: 0.6rem !important;
            opacity: 0.6 !important;
            text-decoration: none !important;
            white-space: nowrap !important; /* Evita que la palabra se parta en dos líneas */
            line-height: 1.2 !important;
          }
          .mobile-footer-bottom {
            margin-top: 0.5rem !important;
            padding-top: 0.5rem !important;
            border-top: 1px solid rgba(255,255,255,0.05) !important;
          }
          .mobile-footer-copyright {
            font-size: 0.5rem !important;
            opacity: 0.3 !important;
            line-height: 1 !important;
          }
        }
      `}</style>

      <div className={styles.layout}>
        <Header />
        <main className={styles.main}>
          {children}
        </main>
        <footer className={`${styles.footer} mobile-footer-compact`}>
          <div className="container">
            <div className={`${styles.footerGrid} mobile-footer-grid`}>
              <div className={styles.footerBrand}>
                <div className={styles.footerLogo}>
                  <img 
                    src="/logo.png" 
                    alt="AppyBingo" 
                    className="mobile-footer-logo"
                    style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
                  />
                </div>
                <p className={`${styles.footerDescription} mobile-footer-desc`}>
                  La plataforma de Bingo en vivo más moderna y segura.
                </p>
              </div>
              
              <div className={`${styles.footerColumn} mobile-footer-col`}>
                <h3>Jugar</h3>
                <ul className={`${styles.footerLinks} mobile-footer-links`}>
                  <li><a href="#partidas" className={`${styles.footerLink} mobile-footer-link`}>Partidas</a></li>
                  <li><a href="#proximas" className={`${styles.footerLink} mobile-footer-link`}>Próximas</a></li>
                </ul>
              </div>
              
              <div className={`${styles.footerColumn} mobile-footer-col`}>
                <h3>Soporte</h3>
                <ul className={`${styles.footerLinks} mobile-footer-links`}>
                  <li><a href="#ayuda" className={`${styles.footerLink} mobile-footer-link`}>Ayuda</a></li>
                  <li><a href="#contacto" className={`${styles.footerLink} mobile-footer-link`}>Contacto</a></li>
                </ul>
              </div>
              
              <div className={`${styles.footerColumn} mobile-footer-col`}>
                <h3>Legal</h3>
                <ul className={`${styles.footerLinks} mobile-footer-links`}>
                  <li><a href="#terminos" className={`${styles.footerLink} mobile-footer-link`}>Términos</a></li>
                  <li><a href="#privacidad" className={`${styles.footerLink} mobile-footer-link`}>Privacidad</a></li>
                </ul>
              </div>
            </div>
            
            <div className={`${styles.footerBottom} mobile-footer-bottom`}>
              <p className={`${styles.footerCopyright} mobile-footer-copyright`}>
                © {new Date().getFullYear()} AppyBingo. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
