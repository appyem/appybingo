import { Header } from './Header';
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
      <footer className={styles.footer} style={{ padding: '1rem 0', textAlign: 'center' }}>
        <div className="container">
          <img 
            src="/logo.png" 
            alt="AppyBingo" 
            style={{ 
              height: '32px', 
              width: 'auto', 
              objectFit: 'contain',
              marginBottom: '0.5rem',
              opacity: 0.8
            }}
          />
          <p style={{ 
            fontSize: '0.6rem', 
            opacity: 0.4, 
            margin: 0,
            lineHeight: 1.2
          }}>
            © {new Date().getFullYear()} AppyBingo por AppyEmpresa. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
