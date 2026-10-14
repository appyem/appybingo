import { useEffect, useState, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/admin/StatusBadge';
import { requestRepository, cardRepository, cardAssignmentService, gameRepository } from '../repositories';
import type { CardRequest, Card, Game, RequestId } from '@bingo-types/index';
import { buildApprovedWhatsAppMessage } from '../utils/cards';
import { MessageCircle, Copy, Check } from 'lucide-react';

export function OrganizerRequestsPage() {
  const hash = window.location.hash;
  const gameId = hash.startsWith('#/organizador/') ? hash.replace('#/organizador/', '').trim() : null;

  const [game, setGame] = useState<Game | null>(null);
  const [requests, setRequests] = useState<CardRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!gameId) {
      if (!silent) setLoading(false);
      return;
    }
    try {
      if (!silent) {
        setLoading(true);
      }
      const gameData = await gameRepository.getGameById(gameId);
      if (!gameData) {
        if (!silent) setLoading(false);
        return;
      }
      setGame(gameData);

      const allRequests = await requestRepository.getRequests();
      // Filtrar solo las solicitudes de este juego específico
      const gameRequests = allRequests.filter(req => req.gameId === gameId);
      setRequests(gameRequests);
    } catch (err: unknown) {
      console.error('Error cargando datos del organizador:', err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [gameId]);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Carga inicial con indicador de carga
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(false);

    // 2. Polling silencioso: Actualiza la lista cada 10 segundos SIN pantalla de carga
    const intervalId = setInterval(() => {
      if (isMounted) {
        loadData(true);
      }
    }, 10000);

    // 3. Limpieza segura al desmontar el componente
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [loadData]);

  const handleApproveAndGenerate = async (requestId: RequestId, requestedCards: number) => {
    if (!gameId) return;
    if (!confirm(`¿Aprobar y generar ${requestedCards} cartones para esta solicitud?`)) return;

    setGeneratingId(requestId);
    try {
      // 1. Aprobar la solicitud y vincularla al juego
      await requestRepository.updateRequestStatus(requestId, 'APROBADA', undefined, gameId);
      
      // 2. Generar los cartones automáticamente
      const generatedCards = await cardAssignmentService.generateCardsForRequest(requestId, gameId);
      
      alert(`${generatedCards.length} cartones generados exitosamente.`);
      await loadData(); // Recargar para mostrar los cambios
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al procesar: ' + message);
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando panel del organizador...</div>;
  }

  if (!gameId || !game) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Enlace de organizador no válido o juego no encontrado.</div>
        <Button variant="primary" onClick={() => { window.location.hash = '#/'; }}>Volver al Inicio</Button>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDIENTE' || r.status === 'EN_REVISION');
  const approvedRequests = requests.filter(r => r.status === 'APROBADA');

  return (
    <div style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <Button variant="ghost" size="sm" onClick={() => { window.location.hash = '#/'; }} style={{ marginBottom: '1.5rem' }}>
        ← Volver al Inicio
      </Button>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>Panel del Organizador</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Juego: <strong style={{ color: 'var(--color-primary)' }}>{game.name}</strong></p>
        
        {game.state === 'FINISHED' && (
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => { window.location.hash = `#/organizador/${gameId}/reporte`; }}
            style={{ 
              marginTop: '1.5rem',
              width: '100%', 
              maxWidth: '400px',
              background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              margin: '1.5rem auto 0 auto'
            }}
          >
            📊 Ver Resumen Final y Ganador del Juego
          </Button>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Solicitudes Pendientes ({pendingRequests.length})</h2>
        {pendingRequests.length === 0 ? (
          <div style={{ padding: '1.5rem', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No hay solicitudes pendientes para este juego.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingRequests.map(req => (
              <div key={req.id} style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{req.id}</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>{req.playerName}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{req.whatsapp}</div>
                  </div>
                  <StatusBadge status={req.status || 'PENDIENTE'} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'white', fontWeight: 600 }}>{req.requestedCards} cartón(es) solicitado(s)</span>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handleApproveAndGenerate(req.id, req.requestedCards)}
                    disabled={generatingId === req.id}
                  >
                    {generatingId === req.id ? 'Procesando...' : 'Aprobar y Generar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {approvedRequests.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Solicitudes Aprobadas ({approvedRequests.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {approvedRequests.map(req => (
              <ApprovedRequestItem key={req.id} request={req} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para manejar la carga perezosa de cartones de una solicitud aprobada
function ApprovedRequestItem({ request }: { request: CardRequest }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    if (expanded && cards.length === 0) {
      setLoadingCards(true);
      try {
        const data = await cardRepository.getCardsByRequestId(request.id);
        setCards(data);
      } catch (err) {
        console.error('Error cargando cartones:', err);
      } finally {
        setLoadingCards(false);
      }
    }
  }, [expanded, cards.length, request.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCards();
     
  }, [expanded, loadCards]);

  const handleCopyLink = (cardId: string) => {
    const url = window.location.origin + '/#/carton/' + cardId;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCardId(cardId);
      setTimeout(() => setCopiedCardId(null), 2000);
    });
  };

  const handleContactWhatsApp = () => {
    const message = buildApprovedWhatsAppMessage(request.playerName, request.id, cards);
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `https://api.whatsapp.com/send?phone=${request.whatsapp}&text=${encodedMessage}`;
  };

  return (
    <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{request.id}</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>{request.playerName}</div>
        </div>
        <StatusBadge status="APROBADA" />
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setExpanded(!expanded)} 
        style={{ width: '100%', marginBottom: expanded ? '1rem' : '0' }}
      >
        {expanded ? 'Ocultar Cartones' : `Ver ${request.requestedCards} Cartones Generados`}
      </Button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {loadingCards ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)' }}>Cargando cartones...</div>
          ) : cards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)' }}>No se encontraron cartones.</div>
          ) : (
            <>
              {cards.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--color-primary)', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' }}>{c.cardNumberFormatted}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleCopyLink(c.id)}>
                    {copiedCardId === c.id ? <Check size={14} style={{ marginRight: '0.25rem', color: 'var(--color-success)' }} /> : <Copy size={14} style={{ marginRight: '0.25rem' }} />}
                    {copiedCardId === c.id ? 'Copiado' : 'Copiar Link'}
                  </Button>
                </div>
              ))}
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleContactWhatsApp} 
                style={{ marginTop: '0.5rem' }}
              >
                <MessageCircle size={16} style={{ marginRight: '0.5rem' }} />
                Enviar Cartones por WhatsApp
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}