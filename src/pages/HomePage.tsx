import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { gameRepository } from '../repositories';
import type { Game } from '@bingo-types/index';

// Componente de Bola 3D Realista
const BingoBall3D = ({ number, color, size = 80, delay = 0, x, y }: { 
  number: number; 
  color: string; 
  size?: number; 
  delay?: number;
  x: string;
  y: string;
}) => {
  
return (
    <div
      className="bingo-ball-3d"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: `${size}px`,
        height: `${size}px`,
        animation: `bounce3d 3s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        zIndex: 2,
      }}
    >
      {/* Sombra proyectada en el suelo */}
      <div
        style={{
          position: 'absolute',
          bottom: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${size * 0.7}px`,
          height: '12px',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          animation: 'shadowPulse 3s ease-in-out infinite',
          animationDelay: `${delay}s`,
        }}
      />
      {/* La bola 3D */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${color} 0%, ${color}dd 40%, ${color}88 70%, #000000 100%)`,
          boxShadow: `
            inset -${size * 0.15}px -${size * 0.15}px ${size * 0.3}px rgba(0,0,0,0.6),
            inset ${size * 0.1}px ${size * 0.1}px ${size * 0.2}px rgba(255,255,255,0.3),
            0 ${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.4)
          `,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Brillo especular superior */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '15%',
            width: '40%',
            height: '25%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
            transform: 'rotate(-30deg)',
            filter: 'blur(2px)',
          }}
        />
        {/* Reflejo inferior suave */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '20%',
            width: '25%',
            height: '15%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
            transform: 'rotate(20deg)',
          }}
        />
        {/* Círculo blanco central con el número */}
        <div
          style={{
            width: '65%',
            height: '55%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 40%, #ffffff 0%, #f0f0f0 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: `${size * 0.18}px`,
              fontWeight: 900,
              color: color,
              lineHeight: 1,
              fontFamily: 'Arial Black, sans-serif',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {number <= 15 ? 'B' : number <= 30 ? 'I' : number <= 45 ? 'N' : number <= 60 ? 'G' : 'O'}
          </span>
          <span
            style={{
              fontSize: `${size * 0.32}px`,
              fontWeight: 900,
              color: '#1a1a2e',
              lineHeight: 1,
              marginTop: '2px',
              fontFamily: 'Arial Black, sans-serif',
            }}
          >
            {number}
          </span>
        </div>
      </div>
    </div>
  );
};

// Partícula decorativa
const Sparkle = ({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: `${size}px`,
      height: `${size}px`,
      background: 'radial-gradient(circle, #FCBF49 0%, rgba(252,191,73,0) 70%)',
      borderRadius: '50%',
      animation: 'sparkle 2s ease-in-out infinite',
      animationDelay: `${delay}s`,
      pointerEvents: 'none',
    }}
  />
);

export function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrganizeModal, setShowOrganizeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgForm, setOrgForm] = useState({
    eventName: '',
    pricePerCard: '',
    prizeType: 'CASH' as 'CASH' | 'PRODUCT',
    prizeValue: '',
    prizeName: '',
    prizeDescription: '',
    sponsorName: '',
    scheduledDate: '',
    requesterName: '',
    requesterWhatsApp: ''
  });

  useEffect(() => {
    let isMounted = true;
    let initialLoadDone = false;

    const fetchGames = async () => {
      try {
        // Solo mostrar pantalla de carga la PRIMERA vez
        if (!initialLoadDone && isMounted) {
          setLoading(true);
        }
        
        const data = await gameRepository.getGames();
        
        if (isMounted) {
          setGames(data);
          initialLoadDone = true;
          setLoading(false);
        }
      } catch (err) {
        console.error('Error cargando juegos en segundo plano:', err);
        if (isMounted) {
          initialLoadDone = true;
          setLoading(false);
        }
      }
    };

    // 1. Carga inicial inmediata
    fetchGames();

    // 2. Polling silencioso: Actualizar cada 15 segundos SIN mostrar pantalla de carga
    const intervalId = setInterval(fetchGames, 15000);

    // 3. Limpieza segura al desmontar el componente (evita memory leaks)
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const activeGames = games.filter(g => g.state === 'RUNNING' || g.state === 'PAUSED');
  const upcomingGames = games.filter(g => g.state === 'OPEN' || g.state === 'READY');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

    const handleOrganizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Construir los datos del juego exactamente como lo hace el Admin
      const gameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt'> = {
        name: orgForm.eventName.trim(),
        variant: 'BINGO_75',
        state: 'DRAFT', // Se crea en borrador para que el admin lo revise y lo abra
        createdBy: orgForm.requesterName.trim() || 'Solicitante',
        pricePerCard: Number(orgForm.pricePerCard) || 0,
        prizeType: orgForm.prizeType,
        ...(orgForm.prizeType === 'CASH' ? { prizeValue: Number(orgForm.prizeValue) || 0 } : {}),
        ...(orgForm.prizeType === 'PRODUCT' ? { 
          prizeName: orgForm.prizeName.trim(),
          ...(orgForm.prizeDescription.trim() ? { prizeDescription: orgForm.prizeDescription.trim() } : {})
        } : {}),
        ...(orgForm.scheduledDate ? { scheduledAt: new Date(orgForm.scheduledDate).getTime() } : {}),
        sponsorName: orgForm.sponsorName.trim() || 'AppyBingo',
        ...(orgForm.requesterWhatsApp.trim() ? { 
    organizerWhatsApp: (() => {
      const cleanNumber = orgForm.requesterWhatsApp.replace(/\D/g, '');
      return cleanNumber.startsWith('57') ? cleanNumber : '57' + cleanNumber;
    })()
  } : {})
      };

      // Crear el juego automáticamente en la base de datos
      await gameRepository.createGame(gameData);
      
      // Notificación opcional a tu WhatsApp para que sepas que hay uno nuevo para activar
      const adminWhatsApp = "573215177902"; // ⚠️ Reemplaza con tu número real
      const message = `¡Nueva solicitud de Bingo creada automáticamente!\n\n📌 *Evento:* ${orgForm.eventName}\n💰 *Valor cartón:* ${formatCurrency(Number(orgForm.pricePerCard))}\n🕒 *Fecha/Hora:* ${orgForm.scheduledDate ? new Date(orgForm.scheduledDate).toLocaleString('es-CO') : 'Sin programar'}\n👤 *Solicitante:* ${orgForm.requesterName}\n📱 *WhatsApp:* ${orgForm.requesterWhatsApp}\n\nEl juego ya está en estado DRAFT en tu panel.`;
      
      // Limpiar formulario y cerrar modal
      setOrgForm({
        eventName: '', pricePerCard: '', prizeType: 'CASH',
        prizeValue: '', prizeName: '', prizeDescription: '',
        sponsorName: '', scheduledDate: '', requesterName: '', requesterWhatsApp: ''
      });
      setShowOrganizeModal(false);
      
      // Abrir WhatsApp en nueva pestaña para notificarte
      window.open(`https://api.whatsapp.com/send?phone=${adminWhatsApp}&text=${encodeURIComponent(message)}`, '_blank');
      
      alert('¡Juego creado exitosamente! Un administrador lo revisará y activará pronto.');
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error al crear el juego:', err);
      alert('Ocurrió un error al crear el juego. Detalle: ' + (err.message || 'Desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Configuración de elementos flotantes para llenar la pantalla en PC
  const floatingBalls = [
    { number: 7, color: '#E63946', size: 60, x: '8%', y: '15%', delay: 0 },
    { number: 52, color: '#9B5DE5', size: 50, x: '85%', y: '10%', delay: 0.5 },
    { number: 18, color: '#2A9D8F', size: 55, x: '12%', y: '65%', delay: 1 },
    { number: 34, color: '#F77F00', size: 65, x: '80%', y: '60%', delay: 1.5 },
    { number: 12, color: '#0077B6', size: 45, x: '45%', y: '80%', delay: 2 },
    { number: 68, color: '#E63946', size: 40, x: '25%', y: '25%', delay: 2.5 },
    { number: 71, color: '#9B5DE5', size: 35, x: '70%', y: '85%', delay: 3 },
  ];

  const floatingLogos = [
    { x: '5%', y: '40%', size: 50, delay: 0 },
    { x: '90%', y: '50%', size: 60, delay: 1 },
    { x: '45%', y: '15%', size: 40, delay: 2 },
    { x: '75%', y: '85%', size: 55, delay: 1.5 },
    { x: '20%', y: '90%', size: 45, delay: 3 },
    { x: '85%', y: '30%', size: 35, delay: 2.5 },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      position: 'relative', 
      overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 0%, #3b4d61 0%, #1e2a38 40%, #0f151c 100%)'
    }}>
      {/* Balotas 3D flotantes en el fondo */}
      {floatingBalls.map((ball, idx) => (
        <BingoBall3D 
          key={`bg-ball-${idx}`}
          number={ball.number} 
          color={ball.color} 
          size={ball.size} 
          delay={ball.delay} 
          x={ball.x} 
          y={ball.y} 
        />
      ))}

      {/* Logos pequeños flotantes en el fondo */}
      {floatingLogos.map((logo, idx) => (
        <img 
          key={`bg-logo-${idx}`}
          src="/logo.png" 
          alt="AppyBingo" 
          style={{
            position: 'absolute',
            left: logo.x,
            top: logo.y,
            width: `${logo.size}px`,
            height: 'auto',
            opacity: 0.25,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5)) brightness(1.5)',
            animation: `floatLogo 6s ease-in-out infinite`,
            animationDelay: `${logo.delay}s`,
            zIndex: 0,
            pointerEvents: 'none',
          }} 
        />
      ))}

      <div style={{ padding: '2rem 1rem', maxWidth: '64rem', margin: '0 auto', position: 'relative', zIndex: 10 }}>
      
      {/* HERO SECTION - Diseño Casa de Apuestas */}
      <div style={{ 
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '4rem', 
        padding: '5rem 2rem 4rem',
        borderRadius: 'var(--radius-2xl)', 
        border: '2px solid rgba(252, 191, 73, 0.3)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}>
        {/* Efectos de luz de fondo */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-20%',
          width: '60%',
          height: '200%',
          background: 'radial-gradient(ellipse at center, rgba(252,191,73,0.15) 0%, rgba(252,191,73,0) 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-10%',
          width: '50%',
          height: '150%',
          background: 'radial-gradient(ellipse at center, rgba(230,57,70,0.1) 0%, rgba(230,57,70,0) 70%)',
          pointerEvents: 'none',
        }} />

        {/* Partículas decorativas */}
        <Sparkle x="10%" y="20%" size={6} delay={0} />
        <Sparkle x="85%" y="15%" size={8} delay={0.5} />
        <Sparkle x="75%" y="70%" size={5} delay={1} />
        <Sparkle x="20%" y="75%" size={7} delay={1.5} />
        <Sparkle x="50%" y="10%" size={4} delay={0.8} />

        {/* Bolas 3D Realistas con rebote */}
        <BingoBall3D number={7} color="#E63946" size={70} delay={0} x="5%" y="15%" />
        <BingoBall3D number={52} color="#9B5DE5" size={60} delay={0.5} x="78%" y="10%" />
        <BingoBall3D number={18} color="#2A9D8F" size={65} delay={1} x="8%" y="65%" />
        <BingoBall3D number={34} color="#F77F00" size={75} delay={1.5} x="75%" y="60%" />

        {/* Contenido central */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '2rem', 
          position: 'relative',
          zIndex: 10
        }}>
          {/* Logo con efecto de brillo */}
          <div style={{ position: 'relative' }}>
            <video 
              src="/logoanimado.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline
              style={{ 
                height: '140px', 
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.5))',
                animation: 'logoFloat 4s ease-in-out infinite',
              }} 
            />
          </div>

          {/* Texto de Bienvenida */}
          <div style={{ textAlign: 'center', maxWidth: '48rem' }}>
            <h1 style={{ 
              fontSize: 'clamp(2rem, 6vw, 3.5rem)', 
              fontWeight: 900, 
              color: 'white', 
              marginBottom: '1rem', 
              lineHeight: 1.1,
              textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 0 40px rgba(252,191,73,0.3)',
              letterSpacing: '-0.02em',
            }}>
              ¡La emoción del{' '}
              <span style={{ 
                color: '#FCBF49',
                textShadow: '0 0 20px rgba(252,191,73,0.6), 0 4px 8px rgba(0,0,0,0.5)',
              }}>
                Bingo
              </span>{' '}
              en tiempo real!
            </h1>
            <p style={{ 
              fontSize: '1.25rem', 
              color: '#d4d4e8', 
              maxWidth: '36rem', 
              margin: '0 auto 2.5rem', 
              fontWeight: 400,
              lineHeight: 1.6,
            }}>
              Segura, emocionante y desde cualquier dispositivo. Elige tu partida, solicita tus cartones y ¡que comience la suerte!
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowOrganizeModal(true);
              }}
              className="cta-button-premium"
              style={{
                background: 'linear-gradient(135deg, #FCBF49 0%, #F77F00 100%)',
                color: '#0A1628',
                fontWeight: 800,
                fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                padding: '1rem 2rem',
                width: '100%',
                maxWidth: '400px',
                border: 'none',
                borderRadius: '9999px',
                boxShadow: '0 10px 30px rgba(252,191,73,0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'inherit',
                position: 'relative',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                margin: '0 auto'
              }}
            >
              🎲 Organiza tu propio Bingo
            </button>
          </div>
        </div>
      </div>

      {/* PARTIDAS EN VIVO */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '16px', height: '16px', background: '#E63946', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 12px #E63946', animation: 'pulse-glow 2s ease-in-out infinite' }}></span>
          Partidas en Vivo
        </h2>
        {loading ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando partidas...</p>
        ) : activeGames.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>No hay partidas en vivo en este momento. ¡Revisa las próximas!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {activeGames.map(game => (
              <GameCard key={game.id} game={game} isActive={true} formatCurrency={formatCurrency} />
            ))}
          </div>
        )}
      </div>

      {/* PRÓXIMAS PARTIDAS */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '16px', height: '16px', background: '#2A9D8F', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 12px #2A9D8F' }}></span>
          Próximas Partidas
        </h2>
        {loading ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando partidas...</p>
        ) : upcomingGames.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>No hay próximas partidas programadas. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {upcomingGames.map(game => (
              <GameCard key={game.id} game={game} isActive={false} formatCurrency={formatCurrency} />
            ))}
          </div>
        )}
      </div>


            {/* MODAL: Organiza tu propio Bingo (Glassmorphism) */}
      {showOrganizeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(10, 22, 40, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'rgba(26, 26, 36, 0.7)',
            border: '1px solid rgba(252, 191, 73, 0.2)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2.5rem 2rem',
            position: 'relative',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}>
            <button 
              className="modal-close-btn"
              onClick={() => setShowOrganizeModal(false)}
              aria-label="Cerrar"
            >
              ✕
            </button>

            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 1.75rem)', fontWeight: 900, color: 'white', marginBottom: '0.5rem', textAlign: 'center' }}>
              🎲 Organiza tu Bingo
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Completa los datos y te contactaremos por WhatsApp para coordinar tu evento.
            </p>

            <form onSubmit={handleOrganizeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Nombre del Evento o Juego *</label>
                <input 
                  type="text" required 
                  className="glass-input"
                  value={orgForm.eventName}
                  onChange={(e) => setOrgForm({...orgForm, eventName: e.target.value})}
                  placeholder="Ej: Bingo de la Familia Pérez"
                />
              </div>

              <div>
                <label className="form-label">Valor por Cartón ($) *</label>
                <input 
                  type="number" required min="0" step="100"
                  className="glass-input"
                  value={orgForm.pricePerCard}
                  onChange={(e) => setOrgForm({...orgForm, pricePerCard: e.target.value})}
                  placeholder="Ej: 5000 (0 para juego gratuito)"
                />
              </div>

              <div>
                <label className="form-label">Tipo de Premio *</label>
                <select 
                  className="glass-select"
                  value={orgForm.prizeType}
                  onChange={(e) => setOrgForm({...orgForm, prizeType: e.target.value as 'CASH' | 'PRODUCT', prizeValue: '', prizeName: '', prizeDescription: ''})}
                >
                  <option value="CASH">💵 Efectivo</option>
                  <option value="PRODUCT">🎁 Producto</option>
                </select>
              </div>

              {orgForm.prizeType === 'CASH' ? (
                <div>
                  <label className="form-label">Valor del Premio ($) *</label>
                  <input 
                    type="number" required min="10000"
                    className="glass-input"
                    value={orgForm.prizeValue}
                    onChange={(e) => setOrgForm({...orgForm, prizeValue: e.target.value})}
                    placeholder="Ej: 500000"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="form-label">Nombre del Producto *</label>
                    <input 
                      type="text" required
                      className="glass-input"
                      value={orgForm.prizeName}
                      onChange={(e) => setOrgForm({...orgForm, prizeName: e.target.value})}
                      placeholder="Ej: Smart TV 55 pulgadas"
                    />
                  </div>
                  <div>
                    <label className="form-label">Descripción del Producto (Opcional)</label>
                    <input 
                      type="text"
                      className="glass-input"
                      value={orgForm.prizeDescription}
                      onChange={(e) => setOrgForm({...orgForm, prizeDescription: e.target.value})}
                      placeholder="Ej: Marca Samsung, 4K, con garantía"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="form-label">Patrocinador (Opcional)</label>
                <input 
                  type="text"
                  className="glass-input"
                  value={orgForm.sponsorName}
                  onChange={(e) => setOrgForm({...orgForm, sponsorName: e.target.value})}
                  placeholder="Ej: Supermercados Éxito"
                />
              </div>

              <div>
                <label className="form-label">Fecha y Hora del Evento (Opcional)</label>
                <input 
                  type="datetime-local"
                  className="glass-input"
                  value={orgForm.scheduledDate}
                  onChange={(e) => setOrgForm({...orgForm, scheduledDate: e.target.value})}
                />
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <label className="form-label" style={{ color: '#FCBF49', fontWeight: 700 }}>Tus Datos de Contacto *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
                  <input 
                    type="text" required
                    className="glass-input"
                    value={orgForm.requesterName}
                    onChange={(e) => setOrgForm({...orgForm, requesterName: e.target.value})}
                    placeholder="Tu nombre completo"
                  />
                  <input 
                    type="tel" required
                    className="glass-input"
                    value={orgForm.requesterWhatsApp}
                    onChange={(e) => setOrgForm({...orgForm, requesterWhatsApp: e.target.value})}
                    placeholder="Tu número de WhatsApp (Ej: 3001234567)"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="whatsapp-submit-btn"
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isSubmitting ? '⏳ Creando juego...' : '🚀 Crear Solicitud de Bingo'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce3d {
          0%, 100% { 
            transform: translateY(0) scale(1); 
          }
          50% { 
            transform: translateY(-25px) scale(1.05); 
          }
        }
        @keyframes shadowPulse {
          0%, 100% { 
            transform: translateX(-50%) scale(1); 
            opacity: 0.6;
          }
          50% { 
            transform: translateX(-50%) scale(0.7); 
            opacity: 0.3;
          }
        }
        @keyframes sparkle {
          0%, 100% { 
            opacity: 0; 
            transform: scale(0.5); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2); 
          }
        }
        @keyframes logoFloat {
          0%, 100% { 
            transform: translateY(0); 
          }
          50% { 
            transform: translateY(-8px); 
          }
        }
        @keyframes floatLogo {
          0%, 100% { 
            transform: translateY(0) rotate(0deg); 
          }
          50% { 
            transform: translateY(-25px) rotate(5deg); 
          }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 12px #E63946; }
          50% { opacity: 0.6; box-shadow: 0 0 20px #E63946; }
        }
        .cta-button-premium:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 15px 40px rgba(252,191,73,0.6), 0 0 0 8px rgba(252,191,73,0.1) !important;
        }
        .cta-button-premium:active {
          transform: translateY(0) scale(0.98);
        }
        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.5rem;
        }
        .glass-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .glass-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: #FCBF49;
          box-shadow: 0 0 0 3px rgba(252, 191, 73, 0.1);
        }
        .glass-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .glass-select {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          outline: none;
          cursor: pointer;
          box-sizing: border-box;
        }
        .glass-select:focus {
          border-color: #FCBF49;
        }
        .glass-select option {
          background: #1a1a24;
          color: white;
        }
        .modal-close-btn {
          position: absolute; top: 1rem; right: 1rem;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); 
          color: white; border-radius: 50%; width: 36px; height: 36px;
          font-size: 1.25rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .modal-close-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        .whatsapp-submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
          font-weight: 800;
          font-size: 1.125rem;
          padding: 1rem;
          border: none;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(37, 211, 102, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .whatsapp-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(37, 211, 102, 0.4);
        }
        .whatsapp-submit-btn:active {
          transform: translateY(0);
        }
      `}</style>
      </div>
    </div>
  );
}

function GameCard({ game, isActive, formatCurrency }: { game: Game; isActive: boolean; formatCurrency: (v: number) => string }) {
  
    const handleShare = () => {
    const shareUrl = `${window.location.origin}/#/solicitar/${game.id}`;
    const message = `¡Juega AppyBingo: ${game.name}!\nSolicita tu cartón ahora. ¡Mucha suerte! 🍀\n${shareUrl}`;
    const encodedMessage = encodeURIComponent(message);
    
    // Forzar apertura de WhatsApp nativo (App móvil o Desktop)
    window.location.href = `https://api.whatsapp.com/send?text=${encodedMessage}`;
  };

  const borderColor = isActive ? '#E63946' : '#2A9D8F';
  const badgeBg = isActive ? 'rgba(230, 57, 70, 0.15)' : 'rgba(42, 157, 143, 0.15)';
  const badgeColor = isActive ? '#E63946' : '#2A9D8F';
  const boxShadow = isActive ? '0 8px 24px rgba(230, 57, 70, 0.2)' : '0 8px 24px rgba(42, 157, 143, 0.1)';

  return (
    <div style={{
      background: 'var(--color-bg-surface)',
      border: `2px solid ${borderColor}`,
      borderRadius: 'var(--radius-xl)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxShadow,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = isActive ? '0 12px 32px rgba(230, 57, 70, 0.3)' : '0 12px 32px rgba(42, 157, 143, 0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = boxShadow;
    }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'white' }}>{game.name}</h3>
          <span style={{
            padding: '0.375rem 0.875rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: badgeBg,
            color: badgeColor,
            border: `2px solid ${badgeColor}`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {isActive ? '🔴 EN VIVO' : '🟢 PRÓXIMA'}
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Variante: {game.variant}</p>
        {game.scheduledAt && !isActive && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginTop: '0.5rem', 
            padding: '0.5rem 0.75rem', 
            background: 'rgba(252, 191, 73, 0.1)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(252, 191, 73, 0.3)'
          }}>
            <span style={{ fontSize: '1rem' }}>🕒</span>
            <span style={{ fontSize: '0.875rem', color: '#FCBF49', fontWeight: 600 }}>
              Programado: {new Date(game.scheduledAt).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* PREMIO DESTACADO (Si es producto con imagen) */}
      {game.prizeType === 'PRODUCT' && game.prizeImageUrl && (
        <div style={{ 
          marginBottom: '1rem', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden', 
          border: '2px solid rgba(252, 191, 73, 0.3)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <img 
            src={game.prizeImageUrl} 
            alt={game.prizeName || 'Premio'} 
            style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} 
          />
          <div style={{ padding: '0.75rem 1rem', background: 'var(--color-bg-elevated)' }}>
            <div style={{ fontSize: '0.75rem', color: '#FCBF49', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>🎁 Premio Mayor</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>{game.prizeName}</div>
            {game.prizeDescription && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', lineHeight: 1.3 }}>{game.prizeDescription}</div>
            )}
          </div>
        </div>
      )}

      {/* INFO DE PRECIO (Siempre visible) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
            {game.prizeType === 'PRODUCT' ? '🎁 Tipo de Premio' : '🏆 Premio Mayor'}
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#FCBF49' }}>
            {game.prizeType === 'PRODUCT' ? (game.prizeName || 'Producto') : (game.prizeValue ? formatCurrency(game.prizeValue) : 'Por definir')}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>🎟️ Valor Cartón</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>{formatCurrency(game.pricePerCard)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isActive ? (
          <>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => window.location.hash = `#/game/${game.id}`}
              style={{
                background: 'linear-gradient(135deg, #E63946 0%, #F77F00 100%)',
                fontWeight: 700
              }}
            >
              👁️ Ver Sala en Vivo
            </Button>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', fontWeight: 500 }}>
              La venta de cartones está cerrada para esta partida.
            </p>
          </>
        ) : (
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => window.location.hash = `#/solicitar/${game.id}`}
            style={{
              background: 'linear-gradient(135deg, #2A9D8F 0%, #0077B6 100%)',
              fontWeight: 700
            }}
          >
            🎟️ Solicitar Cartones
          </Button>
        )}
      
        <button
          onClick={handleShare}
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >
          🔗 Compartir partida
        </button>
      </div>
    </div>
  );
}