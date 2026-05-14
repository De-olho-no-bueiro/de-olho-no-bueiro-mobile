import { loadGoogleMaps } from '@/core/utils/google-maps-loader.web';

import type {
  GoogleAddressError,
  GoogleAddressPrediction,
  GoogleAddressSearchOptions,
  GoogleAddressResolved,
} from '@/core/utils/google-address-search.shared';
export type {
  GoogleAddressError,
  GoogleAddressPrediction,
  GoogleAddressResolved,
  GoogleAddressSearchOptions,
} from '@/core/utils/google-address-search.shared';
export { isGoogleRequestDeniedError } from '@/core/utils/google-address-search.shared';

let autocompleteServiceInstance: any | null = null;
let geocoderInstance: any | null = null;

function getAutocompleteService(maps: any) {
  if (!maps?.places?.AutocompleteService) {
    throw new Error(
      'Google Places não está disponível. Verifique a Places API e o carregamento da biblioteca places.',
    );
  }

  if (!autocompleteServiceInstance) {
    autocompleteServiceInstance = new maps.places.AutocompleteService();
  }

  return autocompleteServiceInstance;
}

function getGeocoder(maps: any) {
  if (!geocoderInstance) {
    geocoderInstance = new maps.Geocoder();
  }

  return geocoderInstance;
}

function mapStatusToError(
  prefix: string,
  status: string,
  service: 'autocomplete' | 'geocode',
) {
  if (status === 'ZERO_RESULTS') {
    return null;
  }

  const error = new Error(`${prefix} (${status}).`) as GoogleAddressError;
  error.service = service;
  error.status = status;
  return error;
}

function buildAutocompleteRequest(
  maps: any,
  input: string,
  options?: GoogleAddressSearchOptions,
  includeAddressType = true,
) {
  const request: Record<string, unknown> = {
    input,
    componentRestrictions: { country: options?.country || 'br' },
    language: options?.language || 'pt-BR',
    region: options?.region || 'br',
  };

  if (includeAddressType) {
    request.types = ['address'];
  }

  if (options?.locationBias) {
    request.location = new maps.LatLng(
      options.locationBias.latitude,
      options.locationBias.longitude,
    );
    request.radius = options.locationBias.radiusMeters || 50000;
  }

  return request;
}

function buildGeocodeRequest(
  query: string,
  options?: GoogleAddressSearchOptions,
) {
  return {
    address:
      options?.country && !/brasil/i.test(query)
        ? `${query}, Brasil`
        : query,
    language: options?.language || 'pt-BR',
    region: options?.region || 'br',
    componentRestrictions: {
      country: options?.country || 'BR',
    },
  };
}

function logGoogleAddressDebug(event: string, payload: Record<string, unknown>) {
  const host =
    typeof window !== 'undefined' ? window.location.host : 'unknown-host';

  console.info('[Search][Google]', event, {
    host,
    ...payload,
  });
}

async function getPredictions(
  autocompleteService: any,
  request: Record<string, unknown>,
): Promise<{ predictions: any[]; status: string }> {
  return new Promise((resolve) => {
    autocompleteService.getPlacePredictions(
      request,
      (predictions: any[] | null, status: string) => {
        resolve({
          predictions: predictions ?? [],
          status,
        });
      },
    );
  });
}

export async function searchAddressPredictionsWithGoogleMaps(
  query: string,
  maxResults = 5,
  options?: GoogleAddressSearchOptions,
): Promise<GoogleAddressPrediction[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const maps = await loadGoogleMaps();
  const autocompleteService = getAutocompleteService(maps);
  const attempts = [
    {
      name: 'address-biased',
      request: buildAutocompleteRequest(maps, trimmedQuery, options, true),
    },
    {
      name: 'general-biased',
      request: buildAutocompleteRequest(maps, trimmedQuery, options, false),
    },
    {
      name: 'general-brazil',
      request: buildAutocompleteRequest(
        maps,
        /brasil/i.test(trimmedQuery) ? trimmedQuery : `${trimmedQuery}, Brasil`,
        options,
        false,
      ),
    },
  ];

  for (const attempt of attempts) {
    const { predictions, status } = await getPredictions(
      autocompleteService,
      attempt.request,
    );

    logGoogleAddressDebug('autocomplete-response', {
      attempt: attempt.name,
      query: trimmedQuery,
      status,
      count: predictions.length,
      hasPlacesLibrary: Boolean(maps?.places?.AutocompleteService),
    });

    const error = mapStatusToError(
      'Google Autocomplete falhou',
      status,
      'autocomplete',
    );
    if (error) {
      throw error;
    }

    if (predictions.length > 0) {
      return predictions.slice(0, maxResults).map((prediction, index) => ({
        id: `prediction-${prediction.place_id}-${index}`,
        label: prediction.description || trimmedQuery,
        placeId: prediction.place_id,
      }));
    }
  }

  return [];
}

export async function geocodePlaceIdWithGoogleMaps(
  placeId: string,
): Promise<GoogleAddressResolved> {
  const trimmedPlaceId = placeId.trim();
  if (!trimmedPlaceId) {
    throw new Error('Place ID inválido para resolver endereço.');
  }

  const maps = await loadGoogleMaps();
  const geocoder = getGeocoder(maps);

  return new Promise((resolve, reject) => {
    geocoder.geocode({ placeId: trimmedPlaceId }, (results: any[] | null, status: string) => {
      const error = mapStatusToError('Google Geocoder falhou ao resolver o lugar', status, 'geocode');
      if (error) {
        reject(error);
        return;
      }

      const firstResult = results?.[0];
      const location = firstResult?.geometry?.location;
      if (!firstResult || !location) {
        reject(new Error('Google Geocoder retornou um lugar sem coordenadas.'));
        return;
      }

      resolve({
        id: `place-${trimmedPlaceId}`,
        label: firstResult.formatted_address || firstResult.name || trimmedPlaceId,
        coordinate: {
          latitude: location.lat(),
          longitude: location.lng(),
        },
        placeId: trimmedPlaceId,
      });
    });
  });
}

export async function geocodeAddressWithGoogleMaps(
  query: string,
  maxResults = 5,
  options?: GoogleAddressSearchOptions,
): Promise<GoogleAddressResolved[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const maps = await loadGoogleMaps();
  const geocoder = getGeocoder(maps);

  return new Promise((resolve, reject) => {
    geocoder.geocode(buildGeocodeRequest(trimmedQuery, options), (results: any[] | null, status: string) => {
      logGoogleAddressDebug('geocode-response', {
        query: trimmedQuery,
        status,
        count: results?.length || 0,
      });

      const error = mapStatusToError('Google Geocoder falhou ao buscar o endereço', status, 'geocode');
      if (error) {
        reject(error);
        return;
      }

      resolve(
        (results ?? []).slice(0, maxResults).map((result, index) => ({
          id: `geocode-${trimmedQuery}-${index}`,
          label: result.formatted_address || trimmedQuery,
          coordinate: {
            latitude: result.geometry.location.lat(),
            longitude: result.geometry.location.lng(),
          },
          placeId: result.place_id || undefined,
        })),
      );
    });
  });
}
