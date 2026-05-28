import { useEffect } from 'react';

import { ApiReporteRepository } from '@/features/reportes/services/ApiReporteRepository';

import { isWeb } from '@/core/utils/platform-capabilities';

export function PWAShellRuntime() {
  useEffect(() => {
    if (!isWeb) {
      return;
    }

    const repository = new ApiReporteRepository();

    const flushQueue = () => {
      void repository.flushPendingSubmissions().catch((error) => {
        console.error('[PWA] queue flush error', error);
      });
    };

    flushQueue();
    window.addEventListener('online', flushQueue);

    return () => {
      window.removeEventListener('online', flushQueue);
    };
  }, []);

  return null;
}
