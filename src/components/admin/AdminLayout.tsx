import { useState } from 'react';
import { ClipboardList, Ticket, Gamepad2, Settings, LogOut, Trophy, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin/requests', label: 'Solicitudes', icon: ClipboardList },
    { path: '/admin/cards', label: 'Cartones', icon: Ticket },
    { path: '/admin/games', label: 'Partidas', icon: Gamepad2 },
    { path: '/admin/winners', label: 'Ganadores', icon: Trophy },
    { path: '/admin/settings', label: 'Configuración', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.hash = '#/';
  };

  return (
    <>
      <style>{`
        .admin-sidebar {
          width: 250px;
          background: var(--color-bg-surface);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 40;
          transition: transform 0.3s ease;
        }
        .admin-main {
          flex: 1;
          margin-left: 250px;
          padding: 2rem;
          padding-top: 2rem;
        }
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: var(--color-bg-surface);
          border-bottom: 1px solid var(--color-border);
          z-index: 50;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
        }
        .mobile-overlay {
          display: none;
        }
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(-100%);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
          .mobile-header {
            display: flex;
          }
          .mobile-overlay.active {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            z-index: 35;
            backdrop-filter: blur(2px);
          }
        }
      `}</style>

      {/* Barra Superior solo para Móvil */}
      <div className="mobile-header">
        <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
          <span>ADMIN</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}
          aria-label="Menú"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Fondo oscuro al abrir menú en móvil */}
      <div 
        className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Barra Lateral de Navegación */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-primary)' }}>APPYBINGO</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Panel Administrativo</div>
        </div>
        
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map(item => {
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
            return (
              <a 
                key={item.path}
                href={`#${item.path}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  color: isActive ? 'white' : 'var(--color-text-secondary)',
                  background: isActive ? 'var(--color-primary)' : 'transparent',
                  borderRadius: 'var(--radius-lg)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                <item.icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--color-border)' }}>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              background: 'rgba(239, 68, 68, 0.1)',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="admin-main">
        {children}
      </main>
    </>
  );
}
