import { useState } from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { Button } from '../ui/Button';
import { Menu, X } from 'lucide-react';
import styles from './Header.module.css';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, isIOS, isAndroid, handleInstallClick } = useInstallPrompt();

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerInner}>
          <a href="/" className={styles.logo}>
            <img 
              src="/logo.png" 
              alt="AppyBingo" 
              style={{ 
                height: '48px', 
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
          </a>

          <nav className={styles.nav} aria-label="Navegacion principal">
            <a href="/" className={styles.navLink}>Inicio</a>
            <a href="#partidas" className={styles.navLink}>Partidas</a>
            <a href="#mis-cartones" className={styles.navLink}>Mis Cartones</a>
          </nav>

          <div className={styles.actions}>
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                style={{
                  background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 100%)',
                  border: '3px solid red', // TEMPORAL: Diagnóstico
                  color: '#0A1628',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginRight: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(252,191,73,0.3)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(252,191,73,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(252,191,73,0.3)'; }}
              >
                '🚨 BOTÓN DE PRUEBA 🚨'
              </button>
            )}
            <a href="#/admin/requests"><Button variant="ghost" size="sm">Admin</Button></a>
            <a href="#solicitar"><Button variant="primary" size="sm">Solicitar Carton</Button></a>
          </div>

          <button 
            className={styles.menuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <nav className={styles.mobileNav}>
            <a href="/" className={styles.mobileNavLink}>Inicio</a>
            <a href="#partidas" className={styles.mobileNavLink}>Partidas</a>
            <a href="#mis-cartones" className={styles.mobileNavLink}>Mis Cartones</a>
            <div className={styles.mobileActions}>
              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 100%)',
                    color: '#0A1628',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    boxShadow: '0 2px 8px rgba(252,191,73,0.3)'
                  }}
                >
                  {isIOS ? '📲 Agregar a Inicio' : (isAndroid ? '📲 Instalar App' : '📲 Descargar')}
                </button>
              )}
              <a href="#/admin/requests" style={{ width: '100%' }}><Button variant="ghost" size="sm" style={{ width: '100%' }}>Admin</Button></a>
              <a href="#solicitar" style={{ width: '100%' }}>
                <Button variant="primary" size="sm" style={{ width: '100%' }}>Solicitar Carton</Button>
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
