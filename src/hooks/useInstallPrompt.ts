import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface CustomNavigator extends Navigator {
  standalone?: boolean;
}

export function useInstallPrompt() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid;
  
  const [isInstalled, setIsInstalled] = useState(() => {
    return (
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as CustomNavigator).standalone === true
    );
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Debug para que puedas verificar en la consola del navegador de tu celular
    console.log('🔍 PWA Debug -> isMobile:', isMobile, '| isInstalled:', isInstalled, '| deferredPrompt:', !!deferredPrompt);

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
  }, [isMobile, isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
      return;
    }

    if (isIOS) {
      alert('Para instalar AppyBingo en tu iPhone:\n\n1. Toca el botón "Compartir" (cuadrado con flecha) en la parte inferior de Safari.\n2. Selecciona "Agregar a pantalla de inicio".\n3. Toca "Agregar".');
      return;
    }

    if (isAndroid) {
      alert('Para instalar AppyBingo en tu Android:\n\n1. Toca el menú de Chrome (⋮) en la esquina superior derecha.\n2. Selecciona "Instalar aplicación" o "Agregar a pantalla principal".\n3. Toca "Instalar" o "Agregar".');
      return;
    }
  };

  // Garantizamos que el botón se muestre en CUALQUIER móvil si no está instalado
  const isInstallable = isMobile && !isInstalled;

  return { isInstallable, isInstalled, isIOS, isAndroid, handleInstallClick };
}
