import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setDeviceType('ios');
      // Show iOS instructions after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Handle PWA install prompt for Android/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || 
      sessionStorage.getItem('installPromptDismissed') === 'true' || 
      !showPrompt || 
      !deviceType) {
    return null;
  }

  return (
    <Card className="mb-6 border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 text-2xl">📱</div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-2">
              Add to Home Screen
            </h3>
            
            {deviceType === 'ios' && (
              <div className="text-sm text-green-800 space-y-2">
                <p>Get quick access to Golf Trip:</p>
                <ol className="list-decimal list-inside space-y-1 pl-2">
                  <li>Tap the Share button <span className="inline-block w-4 h-4 text-blue-600">📤</span> at the bottom of Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
            )}
            
            {(deviceType === 'android' || deviceType === 'desktop') && deferredPrompt && (
              <div className="text-sm text-green-800 space-y-2">
                <p>Install Golf Trip as an app for quick access and offline use.</p>
              </div>
            )}
            
            {deviceType === 'android' && !deferredPrompt && (
              <div className="text-sm text-green-800 space-y-2">
                <p>Add Golf Trip to your home screen:</p>
                <ol className="list-decimal list-inside space-y-1 pl-2">
                  <li>Tap the menu (⋮) in Chrome</li>
                  <li>Select "Add to Home screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
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