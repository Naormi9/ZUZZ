import type { VehicleDataProvider, VehicleLookupResult, VehicleData } from './types';

const SAMPLE_VEHICLES: Record<string, VehicleData> = {
  '1234567': {
    licensePlate: '1234567',
    vin: 'WBAPH5C55BA123456',
    make: 'BMW',
    model: '320i',
    subModel: 'Luxury',
    year: 2022,
    bodyType: 'sedan',
    engineType: 'petrol',
    engineDisplacementCc: 1998,
    horsepower: 184,
    transmission: 'automatic',
    color: 'שחור מטאלי',
    doors: 4,
    seats: 5,
    fuelEconomyKmPerL: 14.5,
    weightKg: 1520,
    testExpiryDate: '2026-08-15',
    isDisabled: false,
    ownership: 'private',
    previousOwners: 1,
  },
  '7654321': {
    licensePlate: '7654321',
    vin: 'JTDKN3DU5A0123456',
    make: 'Toyota',
    model: 'Corolla',
    subModel: 'Cross',
    year: 2023,
    bodyType: 'suv',
    engineType: 'hybrid',
    engineDisplacementCc: 1798,
    horsepower: 140,
    transmission: 'cvt',
    color: 'לבן פנינה',
    doors: 5,
    seats: 5,
    fuelEconomyKmPerL: 22.0,
    weightKg: 1390,
    testExpiryDate: '2027-03-01',
    isDisabled: false,
    ownership: 'private',
    previousOwners: 0,
  },
  '9876543': {
    licensePlate: '9876543',
    vin: '5YJ3E1EA8LF123456',
    make: 'Tesla',
    model: 'Model 3',
    subModel: 'Long Range',
    year: 2024,
    bodyType: 'sedan',
    engineType: 'electric',
    horsepower: 346,
    transmission: 'automatic',
    color: 'כחול כהה',
    doors: 4,
    seats: 5,
    weightKg: 1830,
    testExpiryDate: '2027-11-20',
    isDisabled: false,
    ownership: 'private',
    previousOwners: 0,
  },
  '5551234': {
    licensePlate: '5551234',
    vin: 'WF0XXXGCDXLA12345',
    make: 'Hyundai',
    model: 'Tucson',
    subModel: 'Limited',
    year: 2021,
    bodyType: 'suv',
    engineType: 'diesel',
    engineDisplacementCc: 1995,
    horsepower: 186,
    transmission: 'automatic',
    color: 'אפור',
    doors: 5,
    seats: 5,
    fuelEconomyKmPerL: 17.0,
    weightKg: 1650,
    testExpiryDate: '2025-06-10',
    isDisabled: false,
    ownership: 'company',
    previousOwners: 2,
  },
  '3332211': {
    licensePlate: '3332211',
    vin: 'KMHD35LH5LU123456',
    make: 'Kia',
    model: 'EV6',
    subModel: 'GT-Line',
    year: 2024,
    bodyType: 'suv',
    engineType: 'electric',
    horsepower: 325,
    transmission: 'automatic',
    color: 'ירוק',
    doors: 5,
    seats: 5,
    weightKg: 2090,
    testExpiryDate: '2028-01-15',
    isDisabled: false,
    ownership: 'leasing',
    previousOwners: 0,
  },
};

const VIN_INDEX: Record<string, string> = {};
for (const [plate, data] of Object.entries(SAMPLE_VEHICLES)) {
  if (data.vin) {
    VIN_INDEX[data.vin] = plate;
  }
}

/**
 * Mock vehicle data provider returning sample Israeli car data.
 * Useful for development and testing.
 */
export class MockVehicleDataProvider implements VehicleDataProvider {
  async lookupByLicensePlate(licensePlate: string): Promise<VehicleLookupResult> {
    const normalized = licensePlate.replace(/[-\s]/g, '');
    const data = SAMPLE_VEHICLES[normalized];

    if (!data) {
      return { found: false, source: 'mock' };
    }

    return {
      found: true,
      data,
      source: 'mock',
      lastUpdated: new Date(),
    };
  }

  async lookupByVin(vin: string): Promise<VehicleLookupResult> {
    const normalized = vin.toUpperCase().trim();
    const plate = VIN_INDEX[normalized];

    if (!plate) {
      return { found: false, source: 'mock' };
    }

    return {
      found: true,
      data: SAMPLE_VEHICLES[plate],
      source: 'mock',
      lastUpdated: new Date(),
    };
  }
}
