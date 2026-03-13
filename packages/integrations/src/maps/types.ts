import type { GeoPoint } from '@zuzz/types';

export interface GeocodeResult {
  point: GeoPoint;
  formattedAddress: string;
  city?: string;
  region?: string;
  neighborhood?: string;
  postalCode?: string;
  country: string;
}

export interface ReverseGeocodeResult {
  formattedAddress: string;
  city?: string;
  region?: string;
  neighborhood?: string;
  postalCode?: string;
  country: string;
}

export interface MapProvider {
  /** Convert an address string to coordinates */
  geocode(address: string): Promise<GeocodeResult | null>;
  /** Convert coordinates to an address */
  reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult | null>;
}
