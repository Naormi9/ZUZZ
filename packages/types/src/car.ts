import type { ListingBase, ListingDocument } from './listing';

export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'phev' | 'electric' | 'lpg' | 'cng';
export type GearboxType = 'automatic' | 'manual' | 'robotic' | 'cvt';
export type OwnershipType = 'private' | 'company' | 'leasing' | 'rental' | 'government' | 'taxi';
export type SellerType = 'private' | 'dealer' | 'leasing_company';
export type BodyType = 'sedan' | 'hatchback' | 'suv' | 'crossover' | 'coupe' | 'convertible' | 'wagon' | 'van' | 'pickup' | 'minivan' | 'commercial' | 'other';
export type ChargeConnectorType = 'type1' | 'type2' | 'ccs' | 'chademo' | 'tesla';

export interface CarListing extends ListingBase {
  vertical: 'cars';
  car: CarDetails;
  documents: ListingDocument[];
  sellerType: SellerType;
  trustFactors: CarTrustFactor[];
}

export interface CarDetails {
  licensePlate?: string;
  vin?: string;
  make: string;
  model: string;
  trim?: string;
  year: number;
  firstRegistrationDate?: Date;
  bodyType?: BodyType;
  mileage: number;
  handCount: number;
  ownershipType: OwnershipType;
  gearbox: GearboxType;
  fuelType: FuelType;
  engineVolume?: number; // cc
  horsepower?: number;
  seats?: number;
  color?: string;
  interiorColor?: string;
  testUntil?: Date;

  // Seller declarations
  accidentDeclared: boolean;
  accidentDetails?: string;
  engineReplaced: boolean;
  gearboxReplaced: boolean;
  frameDamage: boolean;
  maintenanceHistory?: 'full_agency' | 'partial_agency' | 'independent' | 'none';
  numKeys?: number;
  warrantyExists: boolean;
  warrantyDetails?: string;
  recallStatus?: 'none' | 'open' | 'resolved';
  personalImport: boolean;

  // EV-specific
  isElectric: boolean;
  batteryCapacity?: number; // kWh
  batteryHealth?: number; // percentage
  batteryWarrantyUntil?: Date;
  rangeKm?: number;
  acChargeKw?: number;
  dcChargeKw?: number;
  chargeConnectorType?: ChargeConnectorType;

  // Extras
  features?: string[];
}

export interface CarTrustFactor {
  type: CarTrustFactorType;
  status: 'positive' | 'negative' | 'warning' | 'neutral';
  label: string;
  description?: string;
}

export type CarTrustFactorType =
  | 'verified_owner'
  | 'verified_dealer'
  | 'docs_uploaded'
  | 'test_valid'
  | 'test_expired'
  | 'low_mileage'
  | 'high_mileage'
  | 'price_below_market'
  | 'price_above_market'
  | 'suspicious_price'
  | 'accident_declared'
  | 'no_accident'
  | 'recall_open'
  | 'recall_resolved'
  | 'full_maintenance'
  | 'high_completeness'
  | 'frame_damage'
  | 'engine_replaced'
  | 'single_owner'
  | 'warranty_active';

export interface CarSearchFilters {
  make?: string[];
  model?: string[];
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  fuelType?: FuelType[];
  gearbox?: GearboxType[];
  handCountMax?: number;
  bodyType?: BodyType[];
  color?: string[];
  sellerType?: SellerType[];
  city?: string[];
  region?: string[];
  hasTest?: boolean;
  hasWarranty?: boolean;
  noAccidents?: boolean;
  isElectric?: boolean;
  isHybrid?: boolean;
  verifiedSeller?: boolean;
  hasDocuments?: boolean;
  trustScoreMin?: number;
  engineVolumeFrom?: number;
  engineVolumeTo?: number;
  horsepowerFrom?: number;
  horsepowerTo?: number;
}

export interface CarSearchSort {
  field: 'price' | 'year' | 'mileage' | 'createdAt' | 'trustScore' | 'relevance';
  order: 'asc' | 'desc';
}

// Israeli car data reference types
export interface CarMakeModel {
  make: string;
  makeHe: string;
  models: Array<{
    model: string;
    modelHe: string;
    years?: number[];
  }>;
}

export interface CarCreateWizardStep {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  label: string;
  labelHe: string;
}

export const CAR_WIZARD_STEPS: CarCreateWizardStep[] = [
  { step: 1, label: 'Identify Vehicle', labelHe: 'זיהוי רכב' },
  { step: 2, label: 'Vehicle Details', labelHe: 'פרטי הרכב' },
  { step: 3, label: 'Seller Statements', labelHe: 'הצהרות מוכר' },
  { step: 4, label: 'Pricing', labelHe: 'תמחור' },
  { step: 5, label: 'Photos', labelHe: 'תמונות' },
  { step: 6, label: 'Documents', labelHe: 'מסמכים' },
  { step: 7, label: 'Preview & Publish', labelHe: 'תצוגה מקדימה' },
];
