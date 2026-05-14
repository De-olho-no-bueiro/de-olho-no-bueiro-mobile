let loaderPromise: Promise<any> | null = null;

declare global {
  interface Window {
    google?: any;
  }
}

function getApiKey() {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.MAPS_API_KEY?.trim() ||
    ''
  );
}

export function getGoogleMapsApiKey() {
  return getApiKey();
}

export function loadGoogleMaps() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps só pode ser carregado no navegador.'));
  }

  if (window.google?.maps) {
    if (!window.google.maps.places) {
      return Promise.reject(
        new Error(
          'Google Maps foi carregado sem a biblioteca places. Recarregue a página após habilitar a Places API.',
        ),
      );
    }

    return Promise.resolve(window.google.maps);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('Configure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para habilitar o mapa web.'));
  }

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
        return;
      }

      reject(new Error('Google Maps JS carregou, mas o objeto global não está disponível.'));
    };
    script.onerror = () => {
      reject(new Error('Não foi possível carregar o Google Maps JS.'));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
