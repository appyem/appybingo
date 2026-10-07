import { useEffect, useState, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/admin/StatusBadge';
import { requestRepository, cardRepository, cardAssignmentService, gameRepository } from '../repositories';
import type { CardRequest, RequestId, Card, Game } from '@bingo-types/index';
import { buildAdminWhatsAppLink, formatDate } from '../utils/admin';
import { buildApprovedWhatsAppMessage } from '../utils/cards';
import { MessageCircle, ExternalLink, Copy, Check, Trash2 } from 'lucide-react';


export function RequestDetail() {
  const [request, setRequest] = useState<CardRequest | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingCard, setDeletingCard] = useState<string | null>(null);
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const hash = window.location.hash;
      const id = hash.replace('#/admin/requests/', '');
      
      if (!id) {
        setError('ID de solicitud no válido');
        setLoading(false);
        return;
      }

      const reqData = await requestRepository.getRequestById(id as RequestId);
      
      if (!reqData) {
        setError('Solicitud no encontrada en Firestore');
        setLoading(false);
        return;
      }

      setRequest(reqData);
      const cardsData = await cardRepository.getCardsByRequestId(reqData.id);
      setCards(cardsData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      console.error('Error cargando detalle:', err);
      setError('Error al cargar la solicitud: ' + message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadOpenGames = async () => {
      try {
        const games = await gameRepository.getGames();
        setAvailableGames(games.filter(g => g.state === 'OPEN'));
      } catch (err) {
        console.error('Error cargando juegos:', err);
      }
    };
    loadOpenGames();
  }, []);

  const handleApprove = async () => {
    if (!request) return;
    if (!selectedGameId) {
      alert('Debes seleccionar un juego en estado OPEN antes de aprobar la solicitud.');
      return;
    }
    if (!confirm('¿Confirmar aprobación de esta solicitud para el juego seleccionado?')) return;
    
    try {
      await requestRepository.updateRequestStatus(request.id, 'APROBADA', undefined, selectedGameId);
      alert('Solicitud aprobada. Ahora puedes generar los cartones.');
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al aprobar: ' + message);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    const reason = prompt('Motivo del rechazo (opcional):');
    if (reason === null) return;
    
    try {
      await requestRepository.updateRequestStatus(request.id, 'RECHAZADA', reason);
      alert('Solicitud rechazada.');
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al rechazar: ' + message);
    }
  };

  const handleGenerateCards = async () => {
    if (!request) return;
    const targetGameId = request.gameId || selectedGameId;
    if (!targetGameId) {
      alert('Error: No hay un juego asociado a esta solicitud.');
      return;
    }
    if (!confirm('¿Generar ' + request.requestedCards + ' cartones para esta solicitud?')) return;
    
    setGenerating(true);
    try {
      const generated = await cardAssignmentService.generateCardsForRequest(request.id, targetGameId);
      setCards(generated);
      alert(generated.length + ' cartones generados exitosamente.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al generar cartones: ' + message);
    } finally {
      setGenerating(false);
    }
  };

  const handleContactWhatsApp = () => {
    if (!request) return;
    let message = "Hola " + request.playerName + ", te contactamos desde AppyBingo respecto a tu solicitud " + request.id + ".";
    if (request.status === 'APROBADA' && cards.length > 0) {
      message = buildApprovedWhatsAppMessage(request.playerName, request.id, cards);
    }
    const link = buildAdminWhatsAppLink(request.whatsapp, message);
    window.location.href = link;
  };

  const handleBack = () => {
    window.location.hash = '#/admin/requests';
  };

  const handleCopyLink = (cardId: string) => {
    const url = window.location.origin + '/#/carton/' + cardId;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(cardId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('¿Estás seguro de eliminar este cartón? Esta acción no se puede deshacer.')) return;
    
    setDeletingCard(cardId);
    try {
      await cardRepository.deleteCard(cardId);
      // Recargar los cartones después de eliminar
      const updatedCards = await cardRepository.getCardsByRequestId(request!.id);
      setCards(updatedCards);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconocido';
      alert('Error al eliminar el cartón: ' + message);
    } finally {
      setDeletingCard(null);
    }
  };

  const handleViewCard = (cardId: string) => {
    window.location.hash = '#/carton/' + cardId;
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando detalles de la solicitud...</div>;
  }

  if (error || !request) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error || 'Solicitud no encontrada'}</div>
        <Button variant="primary" onClick={handleBack}>Volver al listado</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <Button variant="ghost" size="sm" onClick={handleBack} style={{ marginBottom: '1.5rem' }}>
        ← Volver al listado
      </Button>
      
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>{request.id}</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginTop: '0.5rem' }}>Detalle de Solicitud</h1>
          </div>
          <StatusBadge status={request.status || 'PENDIENTE'} />
        </div>

        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Información del Jugador</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Nombre</span>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>{request.playerName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>WhatsApp</span>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>{request.whatsapp}</span>
          </div>
        </div>

        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Información de Solicitud</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Fecha</span>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>{formatDate(request.createdAt)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Cartones solicitados</span>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>{request.requestedCards}</span>
          </div>
          {request.rejectionReason && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--color-border)', marginTop: '0.75rem' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Motivo de rechazo</span>
              <span style={{ color: 'var(--color-error)', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>{request.rejectionReason}</span>
            </div>
          )}
        </div>

        {request.status === 'APROBADA' && (
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cartones Asignados ({cards.length})
            </div>
            {cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)' }}>No se han generado cartones aún.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {cards.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <span style={{ color: 'var(--color-primary)', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' }}>{c.cardNumberFormatted}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{c.id.substring(0, 8)}...</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopyLink(c.id)}
                        title="Copiar enlace"
                      >
                        {copiedId === c.id ? <Check size={14} style={{ marginRight: '0.25rem', color: 'var(--color-success)' }} /> : <Copy size={14} style={{ marginRight: '0.25rem' }} />}
                        {copiedId === c.id ? 'Copiado' : 'Copiar'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteCard(c.id)}
                        disabled={deletingCard === c.id}
                        style={{ color: 'var(--color-error)' }}
                        title="Eliminar cartón"
                      >
                        <Trash2 size={14} style={{ marginRight: '0.25rem' }} />
                        {deletingCard === c.id ? '...' : 'Eliminar'}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleViewCard(c.id)}>
                        <ExternalLink size={14} style={{ marginRight: '0.25rem' }} />
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {request.status === 'PENDIENTE' && (
            <>
              <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                  Seleccionar Juego para esta Solicitud *
                </label>
                <select 
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'white', fontSize: '0.875rem' }}
                >
                  <option value="">-- Selecciona un juego OPEN --</option>
                  {availableGames.map(game => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
                {availableGames.length === 0 && (
                  <p style={{ color: 'var(--color-warning)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    No hay juegos en estado OPEN. Debes crear y abrir un juego primero en la sección de Juegos.
                  </p>
                )}
              </div>
              <Button variant="primary" size="lg" onClick={handleApprove} disabled={!selectedGameId}>Aprobar Solicitud</Button>
              <Button variant="outline" size="lg" onClick={handleReject}>Rechazar</Button>
            </>
          )}
          
          {request.status === 'APROBADA' && cards.length === 0 && (
            <Button variant="primary" size="lg" onClick={handleGenerateCards} disabled={generating}>
              {generating ? 'Generando...' : 'Generar Cartones'}
            </Button>
          )}

          {(request.status === 'APROBADA' || request.status === 'PENDIENTE') && (
            <Button variant="secondary" size="lg" onClick={handleContactWhatsApp}>
              <MessageCircle size={20} style={{ marginRight: '0.5rem' }} />
              Enviar Cartones por WhatsApp
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}