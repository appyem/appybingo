import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface CustomNavigator extends Navigator {
  standalone?: boolean;
}

interface CustomWindow extends Window {
  MSStream?: unknown;
}

export function useInstallPrompt() {
  // Detectar si es iOS (iPhone, iPad, iPod) de forma segura sin 'any'
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as CustomWindow).MSStream;

  // Inicializar el estado directamente para evitar setState en useEffect
  const [isInstalled, setIsInstalled] = useState(() => {
    return (
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as CustomNavigator).standalone === true
    );
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert('Para instalar AppyBingo en tu iPhone:\n\n1. Toca el botón "Compartir" (cuadrado con flecha) en la parte inferior de Safari.\n2. Desplázate hacia abajo y selecciona "Agregar a pantalla de inicio".\n3. Toca "Agregar" en la esquina superior derecha.');
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  // Mostrar botón si es instalable nativamente O si es iOS (para mostrar la instrucción)
  const isInstallable = (!!deferredPrompt || isIOS) && !isInstalled;

  return { isInstallable, isInstalled, isIOS, handleInstallClick };
}
