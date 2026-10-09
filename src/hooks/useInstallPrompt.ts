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
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as CustomWindow).MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

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

    if (isAndroid && !deferredPrompt) {
      alert('Para instalar AppyBingo en tu Android:\n\n1. Toca el menú de Chrome (los 3 puntos verticales ⋮ en la esquina superior derecha).\n2. Selecciona "Instalar aplicación" o "Agregar a la pantalla principal".\n3. Confirma tocando "Instalar" o "Agregar".');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    }
  };

  // Mostrar botón en móviles (Android/iOS) o si el navegador lo soporta nativamente, siempre que no esté instalado.
  const isInstallable = (isMobile || !!deferredPrompt) && !isInstalled;

  return { isInstallable, isInstalled, isIOS, isAndroid, handleInstallClick };
}
