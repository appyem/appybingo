import { ClipboardList, Ticket, Gamepad2, Settings, LogOut, Trophy } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const { logout } = useAuth();

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <img 
            src="/logo.png" 
            alt="AppyBingo" 
            style={{ 
              height: '60px', 
              width: 'auto',
              objectFit: 'contain',
              marginBottom: '0.5rem'
            }} 
          />
          <div className={styles.sidebarSubtitle}>Panel Administrativo</div>
        </div>
        
        <nav className={styles.nav}>
          <a 
            href="#/admin/requests" 
            className={`${styles.navLink} ${currentPath === '/admin/requests' ? styles.navLinkActive : ''}`}
          >
            <ClipboardList size={18} />
            Solicitudes
          </a>
          <a 
            href="#/admin/cards" 
            className={`${styles.navLink} ${currentPath === '/admin/cards' ? styles.navLinkActive : ''}`}
          >
            <Ticket size={18} />
            Cartones
          </a>
          <a 
            href="#/admin/games" 
            className={`${styles.navLink} ${currentPath === '/admin/games' ? styles.navLinkActive : ''}`}
          >
            <Gamepad2 size={18} />
            Partidas
          </a>
          <a 
            href="#/admin/winners" 
            className={`${styles.navLink} ${currentPath === '/admin/winners' ? styles.navLinkActive : ''}`}
          >
            <Trophy size={18} />
            Ganadores
          </a>
          <a 
            href="#/admin/settings" 
            className={`${styles.navLink} ${currentPath === '/admin/settings' ? styles.navLinkActive : ''}`}
          >
            <Settings size={18} />
            Configuración
          </a>
        </nav>

        <div style={{ padding: '0 0.75rem', marginTop: 'auto' }}>
          <button 
            onClick={async () => {
              await logout();
              window.location.hash = '#/';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              color: 'var(--color-text-secondary)',
              borderRadius: 'var(--radius-lg)',
              transition: 'all 0.2s',
              width: '100%',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: 'none',
              background: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-surface)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
      
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
