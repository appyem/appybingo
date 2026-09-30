import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      window.location.hash = '#/admin/requests';
    } catch {
      setError('Credenciales inválidas. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '24rem', margin: '4rem auto' }}>
      <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem', textAlign: 'center' }}>Acceso Administrativo</h1>
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>AppyBingo Panel</p>
        
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button variant="primary" size="lg" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => window.location.hash = '#'} style={{ marginTop: '0.5rem' }}>
            ← Volver al Inicio
          </Button>
        </form>
      </div>
    </div>
  );
}
