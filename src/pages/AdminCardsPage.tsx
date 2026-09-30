import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Button } from '../components/ui/Button';
import { cardRepository } from '../repositories';
import type { Card } from '@bingo-types/index';

export function AdminCardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await cardRepository.getCards();
        setCards(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Desconocido';
        console.error('Error cargando cartones:', err);
        setError('No se pudieron cargar los cartones. Verifica los índices de Firestore. Detalle: ' + message);
      } finally {
        setIsLoading(false);
      }
    };
    loadCards();
  }, []);

  const filtered = cards.filter(c => 
    !search || 
    c.cardNumberFormatted.toLowerCase().includes(search.toLowerCase()) || 
    c.requestId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout currentPath="/admin/cards">
      <div style={{padding:'2rem'}}>
        <h1 style={{fontSize:'1.875rem', fontWeight:700, color:'white', marginBottom:'2rem'}}>Gestión de Cartones</h1>
        
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando cartones...</div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-lg)' }}>
            {error}
          </div>
        ) : (
          <>
            <input 
              type="text" 
              placeholder="Buscar por número de cartón o ID de solicitud..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{width:'100%', padding:'0.75rem 1rem', background:'var(--color-bg-elevated)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', color:'white', marginBottom:'1.5rem', fontSize:'0.875rem'}} 
            />
            
            <div style={{overflowX:'auto', background:'var(--color-bg-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-xl)'}}>
              <table style={{width:'100%', borderCollapse:'collapse', minWidth:'600px'}}>
                <thead>
                  <tr style={{background:'var(--color-bg-elevated)'}}>
                    <th style={{padding:'1rem', textAlign:'left', color:'var(--color-text-secondary)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600}}>Número</th>
                    <th style={{padding:'1rem', textAlign:'left', color:'var(--color-text-secondary)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600}}>Solicitud</th>
                    <th style={{padding:'1rem', textAlign:'left', color:'var(--color-text-secondary)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600}}>Estado</th>
                    <th style={{padding:'1rem', textAlign:'left', color:'var(--color-text-secondary)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600}}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} style={{borderTop:'1px solid var(--color-border)'}}>
                      <td style={{padding:'1rem', color:'white', fontFamily:'monospace', fontWeight:600}}>{c.cardNumberFormatted}</td>
                      <td style={{padding:'1rem', color:'var(--color-text-secondary)'}}>{c.requestId}</td>
                      <td style={{padding:'1rem'}}>
                        <span style={{padding:'0.25rem 0.5rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600, background:'rgba(16,185,129,0.1)', color:'var(--color-success)', border:'1px solid rgba(16,185,129,0.3)'}}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{padding:'1rem'}}>
                        <Button variant="ghost" size="sm" onClick={() => window.location.hash = '#/carton/' + c.id}>Ver</Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{padding:'2rem', textAlign:'center', color:'var(--color-text-secondary)'}}>No se encontraron cartones.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}