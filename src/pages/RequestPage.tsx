import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
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
import styles from './RequestPage.module.css';

type Step = 'FORM' | 'SUMMARY' | 'SUCCESS';

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

  if (step === 'FORM') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.title}>Solicitar Cartones</h1>
            <p className={styles.subtitle}>Completa tus datos para generar tu solicitud</p>
            {game && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Juego seleccionado</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>{game.name}</div>
              </div>
            )}
            <div className={styles.form}>
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
              <div>
                <label className={styles.summaryLabel} style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Cantidad de cartones
                </label>
                <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={99} />
              </div>
              <Button variant="primary" size="lg" onClick={handleContinue} style={{ marginTop: '1rem' }}>
                Continuar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'SUMMARY') {
    const displayPhone = formatWhatsAppDisplay(normalizeWhatsApp(whatsapp));
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.title}>Confirma tu Solicitud</h1>
            <p className={styles.subtitle}>Revisa que tus datos sean correctos</p>
            <div className={styles.summaryBox}>
              {game && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Juego</span>
                  <span className={styles.summaryValue} style={{ color: 'var(--color-primary)' }}>{game.name}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Jugador</span>
                <span className={styles.summaryValue}>{name}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>WhatsApp</span>
                <span className={styles.summaryValue}>{displayPhone}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Cantidad</span>
                <span className={styles.summaryValue}>{quantity} carton(es)</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>ID de Solicitud</span>
                <span className={styles.summaryValue} style={{ color: 'var(--color-primary)' }}>{requestId}</span>
              </div>
            </div>
            <div className={styles.warningBox}>
              <AlertCircle className={styles.warningIcon} size={20} />
              <p className={styles.warningText}>
                Al continuar se abrira WhatsApp para enviar tu solicitud. Un administrador te contactara con los metodos de pago y la confirmacion. <strong>Tus cartones aun no estan aprobados.</strong>
              </p>
            </div>
            <div className={styles.actions}>
              <Button variant="primary" size="lg" onClick={handleOpenWhatsApp}>
                <MessageCircle size={20} style={{ marginRight: '0.5rem' }} />
                Solicitar por WhatsApp
              </Button>
              <Button variant="ghost" size="md" onClick={handleBack}>
                Volver y corregir
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successIcon}>
            <div className={styles.successIconCircle}>
              <CheckCircle size={40} />
            </div>
          </div>
          <h1 className={styles.title}>Solicitud Creada</h1>
          <p className={styles.subtitle}>ID de tu solicitud:</p>
          <div className={styles.requestIdDisplay}>{requestId}</div>
          
          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Cartones solicitados</span>
              <span className={styles.summaryValue}>{quantity}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>WhatsApp</span>
              <span className={styles.summaryValue}>{formatWhatsAppDisplay(normalizeWhatsApp(whatsapp))}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Estado</span>
              <span className={styles.summaryValue} style={{ color: 'var(--color-warning)' }}>PENDIENTE</span>
            </div>
          </div>

          <div className={styles.warningBox}>
            <AlertCircle className={styles.warningIcon} size={20} />
            <p className={styles.warningText}>
              Si WhatsApp no se abrio automaticamente, por favor instalalo o abrello manualmente y envia el mensaje. Tu solicitud no se procesara hasta que el mensaje sea recibido.
            </p>
          </div>

          <div className={styles.actions}>
            <Button variant="primary" size="lg" onClick={() => { window.location.hash = ''; }}>
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
