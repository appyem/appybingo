import { useState } from 'react';
import { Button } from '../ui/Button';
import { Menu, X, Trophy } from 'lucide-react';
import styles from './Header.module.css';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerInner}>
          <a href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Trophy />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoTextPrimary}>APPY</span>
              <span className={styles.logoTextSecondary}>BINGO</span>
            </div>
          </a>

          <nav className={styles.nav} aria-label="Navegacion principal">
            <a href="/" className={styles.navLink}>Inicio</a>
            <a href="#partidas" className={styles.navLink}>Partidas</a>
            <a href="#mis-cartones" className={styles.navLink}>Mis Cartones</a>
          </nav>

          <div className={styles.actions}>
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