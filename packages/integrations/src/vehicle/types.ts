export interface VehicleData {
  /** License plate number */
  licensePlate?: string;
  /** VIN (Vehicle Identification Number) */
  vin?: string;
  /** Manufacturer */
  make: string;
  /** Model name */
  model: string;
  /** Sub-model / trim */
  subModel?: string;
  /** Year of manufacture */
  year: number;
  /** Body type */
  bodyType?: string;
  /** Engine type */
  engineType?: 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'plugin_hybrid' | 'lpg';
  /** Engine displacement in cc */
  engineDisplacementCc?: number;
  /** Horsepower */
  horsepower?: number;
  /** Transmission type */
  transmission?: 'manual' | 'automatic' | 'cvt';
  /** Color */
  color?: string;
  /** Number of doors */
  doors?: number;
  /** Number of seats */
  seats?: number;
  /** Fuel economy (km per liter) */
  fuelEconomyKmPerL?: number;
  /** Weight in kg */
  weightKg?: number;
  /** Current test expiry date (Israeli "teset") */
  testExpiryDate?: string;
  /** Whether the vehicle is currently disabled/off-road */
  isDisabled?: boolean;
  /** Ownership type */
  ownership?: 'private' | 'company' | 'leasing' | 'government';
  /** Previous ownership count */
  previousOwners?: number;
}

export interface VehicleLookupResult {
  found: boolean;
  data?: VehicleData;
  /** Source of the data */
  source: string;
  /** When the data was last updated */
  lastUpdated?: Date;
}

export interface VehicleDataProvider {
  /** Look up vehicle data by Israeli license plate number */
  lookupByLicensePlate(licensePlate: string): Promise<VehicleLookupResult>;
  /** Look up vehicle data by VIN */
  lookupByVin(vin: string): Promise<VehicleLookupResult>;
}
