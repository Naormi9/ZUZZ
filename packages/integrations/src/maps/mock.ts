import type { GeoPoint } from '@zuzz/types';
import type { MapProvider, GeocodeResult, ReverseGeocodeResult } from './types';

interface CityData {
  name: string;
  nameHe: string;
  region: string;
  regionHe: string;
  point: GeoPoint;
}

const ISRAELI_CITIES: CityData[] = [
  { name: 'Tel Aviv', nameHe: 'תל אביב-יפו', region: 'Tel Aviv', regionHe: 'מחוז תל אביב', point: { lat: 32.0853, lng: 34.7818 } },
  { name: 'Jerusalem', nameHe: 'ירושלים', region: 'Jerusalem', regionHe: 'מחוז ירושלים', point: { lat: 31.7683, lng: 35.2137 } },
  { name: 'Haifa', nameHe: 'חיפה', region: 'Haifa', regionHe: 'מחוז חיפה', point: { lat: 32.7940, lng: 34.9896 } },
  { name: 'Beer Sheva', nameHe: 'באר שבע', region: 'South', regionHe: 'מחוז הדרום', point: { lat: 31.2530, lng: 34.7915 } },
  { name: 'Rishon LeZion', nameHe: 'ראשון לציון', region: 'Central', regionHe: 'מחוז המרכז', point: { lat: 31.9730, lng: 34.7925 } },
  { name: 'Petah Tikva', nameHe: 'פתח תקווה', region: 'Central', regionHe: 'מחוז המרכז', point: { lat: 32.0868, lng: 34.8878 } },
  { name: 'Ashdod', nameHe: 'אשדוד', region: 'South', regionHe: 'מחוז הדרום', point: { lat: 31.8044, lng: 34.6553 } },
  { name: 'Netanya', nameHe: 'נתניה', region: 'Central', regionHe: 'מחוז המרכז', point: { lat: 32.3215, lng: 34.8532 } },
  { name: 'Herzliya', nameHe: 'הרצליה', region: 'Tel Aviv', regionHe: 'מחוז תל אביב', point: { lat: 32.1629, lng: 34.8447 } },
  { name: 'Ramat Gan', nameHe: 'רמת גן', region: 'Tel Aviv', regionHe: 'מחוז תל אביב', point: { lat: 32.0804, lng: 34.8135 } },
  { name: 'Eilat', nameHe: 'אילת', region: 'South', regionHe: 'מחוז הדרום', point: { lat: 29.5577, lng: 34.9519 } },
  { name: 'Nazareth', nameHe: 'נצרת', region: 'North', regionHe: 'מחוז הצפון', point: { lat: 32.6996, lng: 35.3035 } },
];

/**
 * Mock map provider with Israeli city data.
 * Returns the nearest Israeli city for geocoding and reverse geocoding.
 */
export class MockMapProvider implements MapProvider {
  async geocode(address: string): Promise<GeocodeResult | null> {
    const normalized = address.toLowerCase().trim();

    const match = ISRAELI_CITIES.find(
      (c) =>
        normalized.includes(c.name.toLowerCase()) ||
        address.includes(c.nameHe)
    );

    if (!match) return null;

    return {
      point: match.point,
      formattedAddress: `${match.nameHe}, ישראל`,
      city: match.nameHe,
      region: match.regionHe,
      country: 'IL',
    };
  }

  async reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult | null> {
    // Find the closest city
    let closest: CityData | null = null;
    let minDistance = Infinity;

    for (const city of ISRAELI_CITIES) {
      const dist = this.haversineDistance(point, city.point);
      if (dist < minDistance) {
        minDistance = dist;
        closest = city;
      }
    }

    if (!closest || minDistance > 50) return null; // Within 50km

    return {
      formattedAddress: `${closest.nameHe}, ישראל`,
      city: closest.nameHe,
      region: closest.regionHe,
      country: 'IL',
    };
  }

  /** Haversine distance in kilometers */
  private haversineDistance(a: GeoPoint, b: GeoPoint): number {
    const R = 6371;
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h =
      sinLat * sinLat +
      Math.cos(this.toRad(a.lat)) * Math.cos(this.toRad(b.lat)) * sinLng * sinLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
