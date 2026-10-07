import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Button } from '../components/ui/Button';
import { cardRepository } from '../repositories';
import { Trash2, ExternalLink } from 'lucide-react';
import type { Card } from '@bingo-types/index';

export function AdminCardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCard, setDeletingCard] = useState<string | null>(null);

  const loadCards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await cardRepository.getCards();
      setCards(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      console.error('Error cargando cartones:', err);
      setError('No se pudieron cargar los cartones. Detalle: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCards();
  }, []);

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('¿Estás seguro de eliminar este cartón? Esta acción no se puede deshacer.')) return;
    
    setDeletingCard(cardId);
    try {
      await cardRepository.deleteCard(cardId);
      // Recargar la lista después de eliminar
      await loadCards();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al eliminar el cartón: ' + message);
    } finally {
      setDeletingCard(null);
    }
  };

  const filtered = cards.filter(c => 
    !search || 
    c.cardNumberFormatted.toLowerCase().includes(search.toLowerCase()) || 
    c.requestId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      
      <style>{`
        @media (max-width: 768px) {
          .admin-table-container {
            overflow-x: visible !important;
            background: transparent !important;
            border: none !important;
          }
          .admin-table, .admin-table tbody, .admin-table tr, .admin-table td {
            display: block;
            width: 100%;
            box-sizing: border-box;
          }
          .admin-table thead {
            display: none;
          }
          .admin-table tr {
            margin-bottom: 1rem;
            background: var(--color-bg-surface);
            border-radius: var(--radius-lg);
            padding: 1rem;
            border: 1px solid var(--color-border);
          }
          .admin-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--color-border);
            text-align: right;
          }
          .admin-table td:last-child {
            border-bottom: none;
            justify-content: flex-end;
            margin-top: 0.5rem;
          }
          .admin-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: var(--color-text-muted);
            font-size: 0.875rem;
            text-align: left;
            flex-shrink: 0;
            margin-right: 1rem;
          }
        }
      `}</style>

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
            
            <div className="admin-table-container" style={{overflowX:'auto', background:'var(--color-bg-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-xl)'}}>
              <table style={{width:'100%', borderCollapse:'collapse', minWidth:'700px'}}>
                <thead>
                  <tr style={{background:'var(--color-bg-elevated)'}}>
                    <th style={{padding:'1rem', textAlign:'left', color:'var(--color-text-secondary)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600}}>Número</th>
                    <th style={{padding:'1rem', textAlign:'left', color:'var(--color-text-secondary)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600}}>Solicitud</th>
                    <th style={{padding:'1rem', textAlign:'left', color:'var(--color-text-secondary)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600}}>Estado</th>
                    <th style={{padding:'1rem', textAlign:'left', color:'var(--color-text-secondary)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} style={{borderTop:'1px solid var(--color-border)'}}>
                      <td data-label="Número" style={{padding:'1rem', color:'white', fontFamily:'monospace', fontWeight:600}}>{c.cardNumberFormatted}</td>
                      <td data-label="Solicitud" style={{padding:'1rem', color:'var(--color-text-secondary)'}}>{c.requestId}</td>
                      <td data-label="Estado" style={{padding:'1rem'}}>
                        <span style={{padding:'0.25rem 0.5rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600, background:'rgba(16,185,129,0.1)', color:'var(--color-success)', border:'1px solid rgba(16,185,129,0.3)'}}>
                          {c.status}
                        </span>
                      </td>
                      <td data-label="Acciones" style={{padding:'1rem'}}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Button variant="ghost" size="sm" onClick={() => window.location.hash = '#/carton/' + c.id}>
                            <ExternalLink size={14} style={{ marginRight: '0.25rem' }} />
                            Ver
                          </Button>
                          <button
                            onClick={() => handleDeleteCard(c.id)}
                            disabled={deletingCard === c.id}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-error)',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              borderRadius: 'var(--radius-md)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: deletingCard === c.id ? 0.5 : 1,
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}
                            title="Eliminar cartón"
                          >
                            <Trash2 size={14} style={{ marginRight: '0.25rem' }} />
                            {deletingCard === c.id ? '...' : 'Eliminar'}
                          </button>
                        </div>
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
    </>
  );
}