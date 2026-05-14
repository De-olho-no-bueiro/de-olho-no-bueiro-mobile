import type {
  GoogleAddressPrediction,
  GoogleAddressResolved,
  GoogleAddressSearchOptions,
} from '@/core/utils/google-address-search.shared';

export type {
  GoogleAddressError,
  GoogleAddressPrediction,
  GoogleAddressResolved,
  GoogleAddressSearchOptions,
} from '@/core/utils/google-address-search.shared';
export { isGoogleRequestDeniedError } from '@/core/utils/google-address-search.shared';

function unsupportedError() {
  return new Error('Busca de endereços do Google só está disponível no navegador.');
}

export async function searchAddressPredictionsWithGoogleMaps(
  _query: string,
  _maxResults = 5,
  _options?: GoogleAddressSearchOptions,
): Promise<
  GoogleAddressPrediction[]
> {
  throw unsupportedError();
}

export async function geocodePlaceIdWithGoogleMaps(
  _placeId: string,
): Promise<GoogleAddressResolved> {
  throw unsupportedError();
}

export async function geocodeAddressWithGoogleMaps(
  _query: string,
  _maxResults = 5,
  _options?: GoogleAddressSearchOptions,
): Promise<GoogleAddressResolved[]> {
  throw unsupportedError();
}
