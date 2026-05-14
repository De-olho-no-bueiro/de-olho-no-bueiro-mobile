export type GoogleAddressPrediction = {
  id: string;
  label: string;
  placeId: string;
};

export type GoogleAddressSearchOptions = {
  country?: string;
  language?: string;
  region?: string;
  locationBias?: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
  };
};

export type GoogleAddressResolved = {
  id: string;
  label: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  placeId?: string;
};

export type GoogleAddressError = Error & {
  service?: 'autocomplete' | 'geocode';
  status?: string;
};

export function isGoogleRequestDeniedError(
  error: unknown,
  service?: 'autocomplete' | 'geocode',
): error is GoogleAddressError {
  if (!(error instanceof Error)) {
    return false;
  }

  const candidate = error as GoogleAddressError;
  return (
    candidate.status === 'REQUEST_DENIED' &&
    (!service || candidate.service === service)
  );
}
