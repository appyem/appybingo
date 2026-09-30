import { useEffect, useState } from 'react';
import { cardRepository } from '../repositories';
import { BingoCardDisplay } from '../components/bingo/BingoCardDisplay';
import type { Card } from '@bingo-types/index';

export function CardViewPage() {
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const id = hash.replace('#/carton/', '').trim();
    
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('ID de cartón no válido en la URL');
      setLoading(false);
      return;
    }

    // 1. Obtener o generar huella del dispositivo
    let deviceId = localStorage.getItem('appybingo_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('appybingo_device_id', deviceId);
    }

    // 2. Consultar el cartón
    cardRepository.getCardById(id)
      .then(c => {
        if (!c) {
          setError('Cartón no encontrado en la base de datos.');
          setLoading(false);
          return;
        }

        // 3. Validar huella de dispositivo
        if (c.openedDeviceId) {
          if (c.openedDeviceId !== deviceId) {
            setError('⚠️ Acceso denegado: Este cartón ya fue abierto en otro dispositivo. Por seguridad, el acceso ha sido bloqueado.');
            setLoading(false);
            return;
          }
        } else {
          // Primera vez que se abre: registrar el dispositivo
          cardRepository.updateCardOpenStatus(id, deviceId).catch(err => {
            console.error('Error registrando apertura:', err);
          });
        }

        setCard(c);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar el cartón:', err);
        setError('Error al cargar el cartón: ' + (err instanceof Error ? err.message : 'Desconocido'));
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{padding:'2rem',textAlign:'center', color:'var(--color-text-secondary)'}}>Cargando cartón...</div>;
  
  if (error || !card) {
    return (
      <div style={{padding:'2rem',textAlign:'center', maxWidth:'32rem', margin:'0 auto'}}>
        <h1 style={{fontSize:'1.5rem', fontWeight:900, color:'white', marginBottom:'1rem'}}>APPY<span style={{color:'var(--color-primary)'}}>BINGO</span></h1>
        <div style={{background:'rgba(239,68,68,0.1)', border:'1px solid var(--color-error)', borderRadius:'var(--radius-lg)', padding:'1.5rem'}}>
          <p style={{color:'var(--color-error)', fontWeight: 600, marginBottom:'0.5rem'}}>{error || 'Cartón no encontrado o enlace inválido.'}</p>
          <p style={{color:'var(--color-text-secondary)', fontSize:'0.875rem', fontFamily: 'monospace'}}>ID: {window.location.hash.replace('#/carton/', '')}</p>
        </div>
        <button 
          onClick={() => window.location.hash = '#/admin/cards'}
          style={{marginTop:'1.5rem', padding:'0.75rem 1.5rem', background:'var(--color-primary)', color:'white', border:'none', borderRadius:'var(--radius-md)', cursor:'pointer', fontWeight: 600}}
        >
          Volver al Panel
        </button>
      </div>
    );
  }

  return (
    <div style={{padding: '2rem 0 4rem', minHeight: 'calc(100vh - 4rem)', display:'flex', flexDirection:'column', alignItems:'center'}}>
      <div style={{textAlign:'center', marginBottom:'2rem', width:'100%', maxWidth:'32rem', padding:'0 1rem'}}>
        <div style={{fontSize:'1.5rem', fontWeight:900, color:'white', marginBottom:'0.5rem'}}>APPY<span style={{color:'var(--color-primary)'}}>BINGO</span></div>
        <div style={{fontSize:'1.125rem', color:'var(--color-text-secondary)'}}>Cartón Asignado</div>
        <div style={{fontSize:'2rem', fontWeight:900, color:'var(--color-primary)', fontFamily:'monospace', marginTop:'0.5rem'}}>{card.cardNumberFormatted}</div>
        <span style={{display:'inline-block', marginTop:'1rem', padding:'0.25rem 0.75rem', background:'rgba(16,185,129,0.1)', color:'var(--color-success)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600}}>
          {card.openedAt ? 'ABIERTO' : 'NUEVO'}
        </span>
      </div>
      
      <BingoCardDisplay matrix={card.matrix} cardNumber={card.cardNumberFormatted} />
      
      <div style={{marginTop:'3rem', color:'var(--color-text-muted)', fontSize:'0.875rem', textAlign:'center', maxWidth:'32rem', padding:'0 1rem'}}>
        <p>Este cartón es único e intransferible.</p>
        <p>No compartas tu enlace con terceros.</p>
      </div>
    </div>
  );
}