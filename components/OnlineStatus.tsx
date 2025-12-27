import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';

export const OnlineStatus: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null; // Don't show indicator when online
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 bg-amber-100 border border-amber-300 rounded-lg shadow-md">
      <WifiOff className="w-4 h-4 text-amber-700" />
      <span className="text-sm font-medium text-amber-700">Modo offline</span>
    </div>
  );
};
