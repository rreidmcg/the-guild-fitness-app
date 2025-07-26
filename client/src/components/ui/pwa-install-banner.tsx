import { useState } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-offline';

export function PWAInstallBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { isInstallable, promptInstall } = usePWAInstall();

  if (!isInstallable || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setDismissed(true);
    }
  };

  return (
    <Card className="fixed top-4 left-4 right-4 z-50 bg-game-slate border-blue-500 md:left-auto md:right-4 md:w-80">
      <CardContent className="p-4">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white text-sm">Install App</h4>
              <p className="text-xs text-gray-300">Add to home screen for quick access and offline features</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex space-x-2 mt-3">
          <Button 
            size="sm" 
            onClick={handleInstall}
            className="bg-blue-600 hover:bg-blue-700 text-xs"
          >
            Install
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setDismissed(true)}
            className="text-xs border-gray-600"
          >
            Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}