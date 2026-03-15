'use client';

import { useEffect, useState } from 'react';
import { isCapacitorNative, getNetworkStatus, onNetworkChange } from '@/lib/mobile';

/**
 * Offline banner shown when the device loses network connectivity.
 * Only appears in native app context.
 */
export function NetworkBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isCapacitorNative());
    setIsOffline(!getNetworkStatus().connected);

    const unsubscribe = onNetworkChange((status) => {
      setIsOffline(!status.connected);
    });

    return unsubscribe;
  }, []);

  if (!isNative || !isOffline) return null;

  return (
    <div className="fixed top-0 start-0 end-0 z-[100] bg-red-600 px-4 py-2 text-center text-sm font-medium text-white safe-area-top">
      אין חיבור לאינטרנט
    </div>
  );
}
