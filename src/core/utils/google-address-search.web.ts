import { loadGoogleMaps } from '@/core/utils/google-maps-loader.web';

import type {
  GoogleAddressCoordinate,
  GoogleAddressError,
  GoogleAddressPrediction,
  GoogleAddressSearchOptions,
  GoogleAddressResolved,
} from '@/core/utils/google-address-search.shared';
export type {
  GoogleAddressCoordinate,
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

function normalizeAddressLabel(label: string | null | undefined) {
  return label?.replace(/\s+/g, ' ').trim() || '';
}

function getAddressComponent(result: any, targetTypes: string[]) {
  const components = Array.isArray(result?.address_components)
    ? result.address_components
    : [];

  const component = components.find((entry: any) =>
    Array.isArray(entry?.types) &&
    targetTypes.some((type) => entry.types.includes(type)),
  );

  return normalizeAddressLabel(component?.long_name || component?.short_name);
}

function buildApproximateAddressFromComponents(result: any) {
  const street = getAddressComponent(result, ['route']);
  const streetNumber = getAddressComponent(result, ['street_number']);
  const neighborhood = getAddressComponent(result, [
    'sublocality',
    'sublocality_level_1',
    'neighborhood',
  ]);
  const locality = getAddressComponent(result, ['locality']);
  const adminAreaLevel2 = getAddressComponent(result, [
    'administrative_area_level_2',
  ]);
  const adminAreaLevel1 = getAddressComponent(result, [
    'administrative_area_level_1',
  ]);

  const headline = street
    ? [street, streetNumber].filter(Boolean).join(', ')
    : neighborhood || locality || adminAreaLevel2 || adminAreaLevel1;

  const tail = [
    street ? neighborhood : null,
    locality,
    !locality ? adminAreaLevel2 : null,
    adminAreaLevel1,
  ].filter(Boolean);

  const approximateAddress = [headline, ...tail].filter(Boolean).join(', ');
  return normalizeAddressLabel(approximateAddress);
}

function isCountryOnlyResult(result: any) {
  const types = Array.isArray(result?.types) ? result.types : [];
  return types.length > 0 && types.every((type: string) => type === 'country');
}

function isPlusCodeOnlyResult(result: any) {
  const types = Array.isArray(result?.types) ? result.types : [];
  if (!types.includes('plus_code')) {
    return false;
  }

  return !buildApproximateAddressFromComponents(result);
}

function isUsefulAddressLabel(label: string) {
  const normalized = normalizeAddressLabel(label);
  if (!normalized) {
    return false;
  }

  if (/^brasil$/i.test(normalized)) {
    return false;
  }

  return true;
}

function getReverseGeocodePriority(result: any) {
  const types = Array.isArray(result?.types) ? result.types : [];

  if (types.includes('street_address')) return 0;
  if (types.includes('premise') || types.includes('subpremise')) return 1;
  if (types.includes('route')) return 2;
  if (types.includes('intersection')) return 3;
  if (
    types.includes('neighborhood') ||
    types.includes('sublocality') ||
    types.includes('sublocality_level_1')
  ) {
    return 4;
  }
  if (types.includes('locality') || types.includes('postal_code')) return 5;
  if (
    types.includes('administrative_area_level_2') ||
    types.includes('administrative_area_level_1')
  ) {
    return 6;
  }
  if (types.includes('country') || types.includes('plus_code')) return 99;

  return 7;
}

function buildReverseGeocodeCandidate(result: any) {
  if (!result?.geometry?.location) {
    return null;
  }

  const label = normalizeAddressLabel(result.formatted_address || result.name);
  const approximateLabel = buildApproximateAddressFromComponents(result);
  const types = Array.isArray(result?.types) ? result.types : [];

  return {
    result,
    label,
    approximateLabel,
    priority: getReverseGeocodePriority(result),
    types,
    isCountryOnly: isCountryOnlyResult(result),
    isPlusCodeOnly: isPlusCodeOnlyResult(result),
  };
}

type ReverseGeocodeCandidate = NonNullable<
  ReturnType<typeof buildReverseGeocodeCandidate>
>;

function pickCandidateLabel(candidate: ReturnType<typeof buildReverseGeocodeCandidate>) {
  if (!candidate) {
    return '';
  }

  if (candidate.isCountryOnly) {
    return '';
  }

  if (candidate.isPlusCodeOnly) {
    return candidate.approximateLabel;
  }

  if (isUsefulAddressLabel(candidate.label)) {
    return candidate.label;
  }

  if (isUsefulAddressLabel(candidate.approximateLabel)) {
    return candidate.approximateLabel;
  }

  return '';
}

function selectBestReverseGeocodeResult(results: any[] | null | undefined) {
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const candidates = results
    .map((result) => buildReverseGeocodeCandidate(result))
    .filter((candidate): candidate is ReverseGeocodeCandidate => Boolean(candidate))
    .map((candidate) => ({
      ...candidate,
      resolvedLabel: pickCandidateLabel(candidate),
    }))
    .filter((candidate) => isUsefulAddressLabel(candidate.resolvedLabel));

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => left.priority - right.priority);
  return candidates[0];
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

export async function reverseGeocodeCoordinateWithGoogleMaps(
  coordinate: GoogleAddressCoordinate,
  options?: GoogleAddressSearchOptions,
): Promise<GoogleAddressResolved | null> {
  const maps = await loadGoogleMaps();
  const geocoder = getGeocoder(maps);

  return new Promise((resolve, reject) => {
    geocoder.geocode(
      {
        location: {
          lat: coordinate.latitude,
          lng: coordinate.longitude,
        },
        language: options?.language || 'pt-BR',
        region: options?.region || 'br',
      },
      (results: any[] | null, status: string) => {
        logGoogleAddressDebug('reverse-geocode-response', {
          coordinate,
          status,
          count: results?.length || 0,
        });

        const error = mapStatusToError(
          'Google Geocoder falhou ao resolver coordenadas',
          status,
          'geocode',
        );
        if (error) {
          reject(error);
          return;
        }

        const bestCandidate = selectBestReverseGeocodeResult(results);
        if (!bestCandidate) {
          resolve(null);
          return;
        }

        const location = bestCandidate.result.geometry.location;
        resolve({
          id: `reverse-${coordinate.latitude.toFixed(6)}-${coordinate.longitude.toFixed(6)}`,
          label: bestCandidate.resolvedLabel,
          coordinate: {
            latitude: location.lat(),
            longitude: location.lng(),
          },
          placeId: bestCandidate.result.place_id || undefined,
          types: bestCandidate.types,
        });
      },
    );
  });
}
