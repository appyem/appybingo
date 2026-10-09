import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './context/useAuth';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { RequestPage } from './pages/RequestPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { RequestDetail } from './pages/RequestDetail';
import { MyCardsPage } from './pages/MyCardsPage';
import { CardViewPage } from './pages/CardViewPage';
import { AdminCardsPage } from './pages/AdminCardsPage';
import { AdminGamesPage } from './pages/AdminGamesPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminWinnersPage } from './pages/AdminWinnersPage';
import { GameRoomPage } from './pages/GameRoomPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    
    // Ejecutar al montar para capturar la ruta inicial
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Cargando AppyBingo...</div>;
  }

  const hash = currentHash;

  // Rutas públicas
  if (hash === '#solicitar' || hash.startsWith('#/solicitar/')) return <Layout><RequestPage /></Layout>;
  if (hash === '#mis-cartones' || hash === '#/mis-cartones') return <Layout><MyCardsPage /></Layout>;
  if (hash.startsWith('#/carton/')) return <Layout><CardViewPage /></Layout>;
  if (hash.startsWith('#/game/')) return <Layout><GameRoomPage /></Layout>;
  
  // Rutas administrativas
  if (hash.startsWith('#/admin')) {
    if (!user) return <AdminLoginPage />;
    
    if (hash.startsWith('#/admin/requests/') && hash !== '#/admin/requests') {
      return <RequestDetail />;
    }
    if (hash === '#/admin/games' || hash.startsWith('#/admin/games/')) {
      return <AdminGamesPage />;
    }
    if (hash === '#/admin/cards' || hash.startsWith('#/admin/cards/')) {
      return <AdminCardsPage />;
    }
    if (hash === '#/admin/winners') {
      return <AdminWinnersPage />;
    }
    
    // Ruta por defecto del admin
    return <AdminDashboard />;
  }

  // Ruta por defecto general
  return <Layout><HomePage /></Layout>;
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
