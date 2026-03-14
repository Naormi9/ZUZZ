import type { ListingBase, ListingDocument } from './listing';

export type PropertyType =
  | 'apartment'
  | 'house'
  | 'penthouse'
  | 'garden_apartment'
  | 'duplex'
  | 'studio'
  | 'villa'
  | 'cottage'
  | 'lot'
  | 'commercial'
  | 'office'
  | 'other';
export type PropertyCondition = 'new' | 'renovated' | 'good' | 'needs_renovation' | 'shell';
export type PropertyListingType = 'sale' | 'rent' | 'roommates';
export type HomeSeller = 'owner' | 'agent' | 'developer';

export interface PropertyListing extends ListingBase {
  vertical: 'homes';
  property: PropertyDetails;
  documents: ListingDocument[];
  sellerType: HomeSeller;
  projectId?: string;
}

export interface PropertyDetails {
  propertyType: PropertyType;
  listingType: PropertyListingType;
  rooms: number;
  bathrooms: number;
  floor?: number;
  totalFloors?: number;
  sizeSqm: number;
  balconySqm?: number;
  gardenSqm?: number;
  parkingSpots?: number;
  condition: PropertyCondition;
  yearBuilt?: number;
  isAccessible?: boolean;
  hasElevator?: boolean;
  hasSafeRoom?: boolean; // ממ"ד
  hasStorage?: boolean;
  hasAirConditioning?: boolean;
  hasCentralHeating?: boolean;
  hasSolarHeater?: boolean;
  furniture?: 'none' | 'partial' | 'full';
  entryDate?: Date;
  isImmediate?: boolean;
  features?: string[];
  arnona?: number; // municipal tax
  vaadBait?: number; // building committee fee
}

export interface Project {
  id: string;
  name: string;
  developerId: string;
  description?: string;
  location: {
    city: string;
    neighborhood?: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  status: 'planning' | 'under_construction' | 'partially_delivered' | 'completed';
  totalUnits?: number;
  availableUnits?: number;
  priceRange?: { min: number; max: number };
  deliveryDate?: Date;
  media: Array<{ url: string; type: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertySearchFilters {
  propertyType?: PropertyType[];
  listingType?: PropertyListingType;
  roomsFrom?: number;
  roomsTo?: number;
  priceFrom?: number;
  priceTo?: number;
  sizeSqmFrom?: number;
  sizeSqmTo?: number;
  floorFrom?: number;
  floorTo?: number;
  city?: string[];
  neighborhood?: string[];
  condition?: PropertyCondition[];
  sellerType?: HomeSeller[];
  hasParking?: boolean;
  hasElevator?: boolean;
  hasSafeRoom?: boolean;
  isAccessible?: boolean;
  isImmediate?: boolean;
  bounds?: { north: number; south: number; east: number; west: number };
}
