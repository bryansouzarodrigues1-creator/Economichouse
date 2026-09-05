import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl max-w-md mx-auto">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo Offline — Seus dados salvos no aparelho continuam funcionando.</span>
    </div>
  );
};
