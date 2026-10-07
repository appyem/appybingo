import { useEffect, useState } from 'react';
import { Input } from '../components/ui/Input';
import { QuantitySelector } from '../components/ui/QuantitySelector';
import { AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import { 
  normalizeWhatsApp, 
  isValidWhatsApp, 
  formatWhatsAppDisplay,
  buildWhatsAppRequestMessage,
  buildWhatsAppDeepLink
} from '../utils/requests';
import { requestRepository, gameRepository } from '../repositories';
import { createUUID } from '@utils/ids';
import type { Game } from '@bingo-types/index';

type Step = 'FORM' | 'SUMMARY' | 'SUCCESS';

// Componente de Bola 3D Realista (reutilizado del Hero)
const BingoBall3D = ({ number, color, size = 70, delay = 0, x, y }: { 
  number: number; 
  color: string; 
  size?: number; 
  delay?: number;
  x: string;
  y: string;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: `${size}px`,
      height: `${size}px`,
      animation: `bounce3d 3s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      zIndex: 2,
      pointerEvents: 'none',
    }}
  >
    <div
      style={{
        position: 'absolute',
        bottom: '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${size * 0.7}px`,
        height: '10px',
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%',
        animation: 'shadowPulse 3s ease-in-out infinite',
        animationDelay: `${delay}s`,
      }}
    />
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${color} 0%, ${color}dd 40%, ${color}88 70%, #000000 100%)`,
        boxShadow: `inset -${size * 0.15}px -${size * 0.15}px ${size * 0.3}px rgba(0,0,0,0.6), inset ${size * 0.1}px ${size * 0.1}px ${size * 0.2}px rgba(255,255,255,0.3), 0 ${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.4)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: '40%', height: '25%', borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%)', transform: 'rotate(-30deg)', filter: 'blur(2px)' }} />
      <div style={{ width: '65%', height: '55%', borderRadius: '50%', background: 'radial-gradient(circle at 50% 40%, #ffffff 0%, #f0f0f0 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: `${size * 0.18}px`, fontWeight: 900, color: color, lineHeight: 1, fontFamily: 'Arial Black, sans-serif' }}>
          {number <= 15 ? 'B' : number <= 30 ? 'I' : number <= 45 ? 'N' : number <= 60 ? 'G' : 'O'}
        </span>
        <span style={{ fontSize: `${size * 0.32}px`, fontWeight: 900, color: '#1a1a2e', lineHeight: 1, marginTop: '2px', fontFamily: 'Arial Black, sans-serif' }}>{number}</span>
      </div>
    </div>
  </div>
);

// Partícula decorativa
const Sparkle = ({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: `${size}px`, height: `${size}px`, background: 'radial-gradient(circle, #FCBF49 0%, rgba(252,191,73,0) 70%)', borderRadius: '50%', animation: 'sparkle 2s ease-in-out infinite', animationDelay: `${delay}s`, pointerEvents: 'none' }} />
);

export function RequestPage() {
  const hash = window.location.hash;
  const initialGameId = hash.startsWith('#/solicitar/') ? hash.replace('#/solicitar/', '').trim() : null;
  
  const [game, setGame] = useState<Game | null>(null);
  const [step, setStep] = useState<Step>('FORM');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [nameError, setNameError] = useState('');
  const [whatsappError, setWhatsappError] = useState('');
  const [requestId, setRequestId] = useState('');

  useEffect(() => {
    if (initialGameId) {
      gameRepository.getGameById(initialGameId).then(setGame);
    }
  }, [initialGameId]);

  const validateForm = () => {
    let isValid = true;
    if (!name.trim() || name.trim().length < 3) {
      setNameError('Por favor ingresa un nombre valido (minimo 3 caracteres)');
      isValid = false;
    } else {
      setNameError('');
    }
    const normalizedPhone = normalizeWhatsApp(whatsapp);
    if (!isValidWhatsApp(normalizedPhone)) {
      setWhatsappError('Ingresa un numero de WhatsApp colombiano valido (ej: 3215177902)');
      isValid = false;
    } else {
      setWhatsappError('');
    }
    return isValid;
  };

  const handleContinue = async () => {
    if (validateForm()) {
      const newRequestId = 'APPY-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const playerId = createUUID();
      
      await requestRepository.createRequest({
        playerId,
        playerName: name.trim(),
        whatsapp: normalizeWhatsApp(whatsapp),
        requestedCards: quantity,
        status: 'PENDIENTE',
        gameId: initialGameId || undefined
      });
      
      sessionStorage.setItem('currentDemoPlayerId', playerId);
      setRequestId(newRequestId);
      setStep('SUMMARY');
    }
  };

  const handleOpenWhatsApp = () => {
    const normalizedPhone = normalizeWhatsApp(whatsapp);
    const displayPhone = formatWhatsAppDisplay(normalizedPhone);
    const message = buildWhatsAppRequestMessage(name.trim(), displayPhone, quantity, requestId);
    const deepLink = buildWhatsAppDeepLink(message);
    window.location.href = deepLink;
    setStep('SUCCESS');
  };

  const handleBack = () => {
    if (step === 'SUMMARY') setStep('FORM');
    if (step === 'SUCCESS') {
      setName('');
      setWhatsapp('');
      setQuantity(1);
      setRequestId('');
      setStep('FORM');
    }
  };

  

  return (
    <>
      
      <style>{`
        @keyframes bounce3d { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-25px) scale(1.05); } }
        @keyframes shadowPulse { 0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.6; } 50% { transform: translateX(-50%) scale(0.7); opacity: 0.3; } }
        @keyframes sparkle { 0%, 100% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes logoFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .request-hero { position: relative; overflow: hidden; padding: 3rem 1.5rem 2rem; border-radius: var(--radius-2xl); border: 2px solid rgba(252, 191, 73, 0.3); box-shadow: 0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1); background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); margin-bottom: 2rem; }
        .request-hero-light1 { position: absolute; top: -50%; left: -20%; width: 60%; height: 200%; background: radial-gradient(ellipse at center, rgba(252,191,73,0.15) 0%, rgba(252,191,73,0) 70%); pointer-events: none; }
        .request-hero-light2 { position: absolute; bottom: -30%; right: -10%; width: 50%; height: 150%; background: radial-gradient(ellipse at center, rgba(230,57,70,0.1) 0%, rgba(230,57,70,0) 70%); pointer-events: none; }
        .request-form-card { background: rgba(26, 26, 36, 0.85); backdrop-filter: blur(10px); border: 1px solid rgba(252, 191, 73, 0.2); border-radius: var(--radius-xl); padding: 2rem; max-width: 480px; margin: 0 auto; position: relative; z-index: 10; }
        .request-title { font-size: 2rem; font-weight: 900; color: white; text-align: center; margin-bottom: 0.5rem; text-shadow: 0 4px 8px rgba(0,0,0,0.5), 0 0 40px rgba(252,191,73,0.3); letter-spacing: -0.02em; }
        .request-subtitle { font-size: 1rem; color: #d4d4e8; text-align: center; margin-bottom: 2rem; font-weight: 400; }
        .request-game-badge { margin-bottom: 1.5rem; padding: 1rem; background: rgba(252, 191, 73, 0.1); border-radius: var(--radius-lg); border: 1px solid rgba(252, 191, 73, 0.3); text-align: center; }
        .request-game-badge-label { font-size: 0.75rem; color: #FCBF49; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; }
        .request-game-badge-name { font-size: 1.25rem; font-weight: 800; color: white; margin-top: 0.25rem; }
        .request-cta { width: 100%; background: linear-gradient(135deg, #FCBF49 0%, #F77F00 100%); color: #0A1628; font-weight: 800; font-size: 1.125rem; padding: 1rem; border: none; border-radius: 9999px; box-shadow: 0 10px 30px rgba(252,191,73,0.4); cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.05em; font-family: inherit; margin-top: 1rem; }
        .request-cta:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 15px 40px rgba(252,191,73,0.6); }
        .request-cta:active { transform: translateY(0) scale(0.98); }
        .request-ghost { width: 100%; background: transparent; color: #d4d4e8; font-weight: 600; font-size: 0.875rem; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: 9999px; cursor: pointer; transition: all 0.2s ease; font-family: inherit; margin-top: 0.75rem; }
        .request-ghost:hover { background: rgba(255,255,255,0.05); color: white; }
        .request-success-icon { text-align: center; margin-bottom: 1rem; }
        .request-success-circle { width: 80px; height: 80px; margin: 0 auto; border-radius: 50%; background: linear-gradient(135deg, #FCBF49 0%, #F77F00 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(252,191,73,0.4); }
        .request-request-id { text-align: center; font-size: 1.5rem; font-weight: 900; color: #FCBF49; font-family: monospace; padding: 1rem; background: rgba(252, 191, 73, 0.1); border-radius: var(--radius-lg); border: 1px solid rgba(252, 191, 73, 0.3); margin: 1rem 0; }
        .request-warning { display: flex; gap: 0.75rem; padding: 1rem; background: rgba(247, 127, 0, 0.1); border: 1px solid rgba(247, 127, 0, 0.3); border-radius: var(--radius-lg); margin: 1.5rem 0; align-items: flex-start; }
        .request-warning-text { font-size: 0.875rem; color: #d4d4e8; line-height: 1.5; }
      `}</style>

      <div style={{ padding: '2rem 1rem', maxWidth: '64rem', margin: '0 auto' }}>
        <div className="request-hero">
          <div className="request-hero-light1" />
          <div className="request-hero-light2" />
          
          <Sparkle x="10%" y="20%" size={6} delay={0} />
          <Sparkle x="85%" y="15%" size={8} delay={0.5} />
          <Sparkle x="75%" y="70%" size={5} delay={1} />
          <Sparkle x="20%" y="75%" size={7} delay={1.5} />
          
          <BingoBall3D number={7} color="#E63946" size={60} delay={0} x="5%" y="10%" />
          <BingoBall3D number={52} color="#9B5DE5" size={50} delay={0.5} x="78%" y="8%" />
          <BingoBall3D number={18} color="#2A9D8F" size={55} delay={1} x="8%" y="60%" />
          <BingoBall3D number={34} color="#F77F00" size={65} delay={1.5} x="75%" y="55%" />

          <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <img 
              src="/logo.png" 
              alt="AppyBingo" 
              style={{ 
                height: '90px', 
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
                animation: 'logoFloat 4s ease-in-out infinite',
                marginBottom: '1rem',
              }} 
            />
          </div>
        </div>

        {step === 'FORM' && (
          <div className="request-form-card">
            <h1 className="request-title">Solicitar Cartones</h1>
            <p className="request-subtitle">Completa tus datos para generar tu solicitud</p>
            
            {game && (
              <div className="request-game-badge">
                <div className="request-game-badge-label">Juego seleccionado</div>
                <div className="request-game-badge-name">{game.name}</div>
              </div>
            )}
            
            <div>
              <Input
                label="Nombre completo"
                placeholder="Ej: Cristian"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={nameError}
              />
              <Input
                label="Numero de WhatsApp"
                placeholder="Ej: 3215177902"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                error={whatsappError}
                maxLength={12}
              />
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#d4d4e8', marginBottom: '0.5rem' }}>
                  Cantidad de cartones
                </label>
                <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={99} />
              </div>
              <button
                type="button"
                className="request-cta"
                onClick={handleContinue}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 'SUMMARY' && (() => {
          const displayPhone = formatWhatsAppDisplay(normalizeWhatsApp(whatsapp));
          return (
            <div className="request-form-card">
              <h1 className="request-title">Confirma tu Solicitud</h1>
              <p className="request-subtitle">Revisa que tus datos sean correctos</p>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.5rem' }}>
                {game && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ color: '#d4d4e8', fontSize: '0.875rem' }}>Juego</span>
                    <span style={{ color: '#FCBF49', fontWeight: 700, fontSize: '0.875rem' }}>{game.name}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: '#d4d4e8', fontSize: '0.875rem' }}>Jugador</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: '#d4d4e8', fontSize: '0.875rem' }}>WhatsApp</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{displayPhone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: '#d4d4e8', fontSize: '0.875rem' }}>Cantidad</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{quantity} carton(es)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ color: '#d4d4e8', fontSize: '0.875rem' }}>ID de Solicitud</span>
                  <span style={{ color: '#FCBF49', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'monospace' }}>{requestId}</span>
                </div>
              </div>
              
              <div className="request-warning">
                <AlertCircle size={20} color="#F77F00" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p className="request-warning-text">
                  Al continuar se abrira WhatsApp para enviar tu solicitud. Un administrador te contactara con los metodos de pago y la confirmacion. <strong>Tus cartones aun no estan aprobados.</strong>
                </p>
              </div>
              
              <button
                type="button"
                className="request-cta"
                onClick={handleOpenWhatsApp}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <MessageCircle size={20} />
                Solicitar por WhatsApp
              </button>
              <button
                type="button"
                className="request-ghost"
                onClick={handleBack}
              >
                Volver y corregir
              </button>
            </div>
          );
        })()}

        {step === 'SUCCESS' && (
          <div className="request-form-card">
            <div className="request-success-icon">
              <div className="request-success-circle">
                <CheckCircle size={40} color="#0A1628" />
              </div>
            </div>
            <h1 className="request-title">Solicitud Creada</h1>
            <p className="request-subtitle">ID de tu solicitud:</p>
            <div className="request-request-id">{requestId}</div>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: '#d4d4e8', fontSize: '0.875rem' }}>Cartones solicitados</span>
                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{quantity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: '#d4d4e8', fontSize: '0.875rem' }}>WhatsApp</span>
                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{formatWhatsAppDisplay(normalizeWhatsApp(whatsapp))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span style={{ color: '#d4d4e8', fontSize: '0.875rem' }}>Estado</span>
                <span style={{ color: '#F77F00', fontWeight: 700, fontSize: '0.875rem' }}>PENDIENTE</span>
              </div>
            </div>

            <div className="request-warning">
              <AlertCircle size={20} color="#F77F00" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p className="request-warning-text">
                Si WhatsApp no se abrio automaticamente, por favor instalalo o abrello manualmente y envia el mensaje. Tu solicitud no se procesara hasta que el mensaje sea recibido.
              </p>
            </div>

            <button
              type="button"
              className="request-cta"
              onClick={() => { window.location.hash = ''; }}
            >
              Volver al Inicio
            </button>
          </div>
        )}
      </div>
    </>
  );
}
