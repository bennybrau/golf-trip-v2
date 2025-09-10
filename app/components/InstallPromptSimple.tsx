import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPromptSimple() {
  const [mounted, setMounted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [deviceType, setDeviceType] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check if already running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    if (isStandalone) return;

    // Check if already dismissed
    try {
      if (sessionStorage.getItem('installPromptDismissed') === 'true') return;
    } catch {
      // Ignore sessionStorage errors
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
      // Show iOS prompt after delay
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Listen for install prompt
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, [mounted]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch (error) {
      console.warn('Install prompt failed:', error);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      sessionStorage.setItem('installPromptDismissed', 'true');
    } catch {
      // Ignore sessionStorage errors
    }
  };

  if (!mounted || !showPrompt) return null;

  return (
    <Card className="mb-6 border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 text-2xl">📱</div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-2">
              Add Golf Trip to Home Screen
            </h3>
            
            {deviceType === 'ios' && (
              <div className="text-sm text-green-800 space-y-2">
                <p>Get quick access to Golf Trip:</p>
                <ol className="list-decimal list-inside space-y-1 pl-2">
                  <li>Tap the Share button <span className="inline-block w-4 h-4 text-blue-600">📤</span> in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
            )}
            
            {deviceType === 'android' && (
              <div className="text-sm text-green-800">
                <p>Install Golf Trip as an app for quick access.</p>
              </div>
            )}
            
            {deviceType === 'desktop' && (
              <div className="text-sm text-green-800">
                <p>Install Golf Trip for quick desktop access.</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-2">
            {(deviceType === 'android' || deviceType === 'desktop') && deferredPrompt && (
              <Button 
                onClick={handleInstall}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Install
              </Button>
            )}
            <button 
              onClick={handleDismiss}
              className="text-xs text-green-600 hover:text-green-800 underline"
            >
              Not now
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}