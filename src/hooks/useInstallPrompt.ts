import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface CustomNavigator extends Navigator {
  standalone?: boolean;
}

export function useInstallPrompt() {
  // Detectar si es dispositivo móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
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
    // Si el navegador permite instalación directa (Android con Chrome), ejecutarla
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
      return;
    }

    // Si es iOS, mostrar instrucciones mínimas (Apple no permite otra forma)
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      alert('Para instalar:\n1. Toca el botón Compartir (⬆️)\n2. Selecciona "Agregar a pantalla de inicio"\n3. Toca "Agregar"');
      return;
    }

    // Si es Android sin evento, mostrar instrucciones del menú de Chrome
    if (/Android/i.test(navigator.userAgent)) {
      alert('Para instalar:\n1. Toca el menú de Chrome (⋮)\n2. Selecciona "Instalar aplicación"');
      return;
    }
  };

  // Mostrar botón en móviles o si hay evento nativo, siempre que no esté instalado
  const isInstallable = (isMobile || !!deferredPrompt) && !isInstalled;

  return { isInstallable, isInstalled, handleInstallClick };
}
