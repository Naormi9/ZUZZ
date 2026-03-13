import type { Listing, ListingMedia, ListingDocument, TrustFactor, CarListing, PropertyListing, MarketListing, User } from '@zuzz/database';

type ListingWithRelations = Listing & {
  media?: ListingMedia[];
  documents?: ListingDocument[];
  trustFactors?: TrustFactor[];
  carDetails?: CarListing | null;
  propertyDetails?: PropertyListing | null;
  marketDetails?: MarketListing | null;
  user?: Pick<User, 'id' | 'name'> & { createdAt?: Date; profile?: any; _count?: any; organizationMembers?: any[] };
  isFavorited?: boolean;
};

export function serializeListingCard(listing: ListingWithRelations) {
  const media = listing.media ?? [];
  const trustFactors = listing.trustFactors ?? [];

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: { amount: listing.priceAmount, currency: listing.priceCurrency },
    isNegotiable: listing.isNegotiable,
    status: listing.status,
    location: { city: listing.city ?? '', area: listing.region ?? '' },
    trustScore: listing.trustScore ?? 0,
    completenessScore: listing.completenessScore,
    isFeatured: listing.isFeatured,
    isPromoted: listing.isPromoted,
    createdAt: listing.createdAt.toISOString(),
    publishedAt: listing.publishedAt?.toISOString() ?? null,
    vertical: listing.vertical,
    viewCount: listing.viewCount,
    favoriteCount: listing.favoriteCount,
    media: media.map((m: ListingMedia) => ({
      id: m.id,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
      type: m.type as 'image' | 'video',
      order: m.order,
    })),
    trustFactors: trustFactors.map((f: TrustFactor) => ({
      key: f.type,
      label: f.labelHe || f.label,
      status: f.status,
      description: f.description,
      category: f.category,
      score: f.score,
    })),
    car: listing.carDetails ? serializeCarBrief(listing.carDetails) : undefined,
    property: listing.propertyDetails ? {
      propertyType: listing.propertyDetails.propertyType,
      listingType: listing.propertyDetails.listingType,
      rooms: listing.propertyDetails.rooms,
      sizeSqm: listing.propertyDetails.sizeSqm,
      floor: listing.propertyDetails.floor,
    } : undefined,
    market: listing.marketDetails ? {
      category: listing.marketDetails.category,
      condition: listing.marketDetails.condition,
      brand: listing.marketDetails.brand,
    } : undefined,
  };
}

function serializeCarBrief(car: CarListing) {
  return {
    make: car.make,
    model: car.model,
    subModel: car.trim ?? '',
    year: car.year,
    mileage: car.mileage,
    hand: car.handCount,
    gearbox: car.gearbox,
    fuelType: car.fuelType,
    engineSize: car.engineVolume ?? 0,
    horsepower: car.horsepower ?? 0,
    seats: car.seats ?? 0,
    color: car.color ?? '',
    bodyType: car.bodyType ?? '',
    isEV: car.isElectric,
    sellerType: car.sellerType,
  };
}

export function serializeListingDetail(listing: ListingWithRelations) {
  const card = serializeListingCard(listing);
  const car = listing.carDetails;

  return {
    ...card,
    car: car ? {
      ...serializeCarBrief(car),
      trim: car.trim ?? '',
      licensePlate: car.licensePlate,
      vin: car.vin,
      firstRegistrationDate: car.firstRegistrationDate?.toISOString() ?? null,
      interiorColor: car.interiorColor ?? '',
      testUntil: car.testUntil?.toISOString() ?? null,
      ownershipType: car.ownershipType,
      evRange: car.rangeKm,
      batteryCapacity: car.batteryCapacity,
      batteryHealth: car.batteryHealth,
      batteryWarrantyUntil: car.batteryWarrantyUntil?.toISOString() ?? null,
      acChargeKw: car.acChargeKw,
      dcChargeKw: car.dcChargeKw,
      chargeConnectorType: car.chargeConnectorType,
      features: car.features,
    } : undefined,
    sellerStatements: car ? [
      { key: 'accidentDeclared', label: 'האם היו תאונות?', value: !car.accidentDeclared, note: car.accidentDetails ?? undefined },
      { key: 'engineReplaced', label: 'מנוע מקורי', value: !car.engineReplaced },
      { key: 'gearboxReplaced', label: 'תיבת הילוכים מקורית', value: !car.gearboxReplaced },
      { key: 'frameDamage', label: 'ללא נזק לשלדה', value: !car.frameDamage },
      { key: 'warrantyExists', label: 'אחריות בתוקף', value: car.warrantyExists, note: car.warrantyDetails ?? undefined },
      { key: 'personalImport', label: 'יבוא אישי', value: car.personalImport },
      ...(car.maintenanceHistory ? [{ key: 'maintenanceHistory', label: `טיפולים: ${getMaintenanceLabel(car.maintenanceHistory)}`, value: car.maintenanceHistory === 'full_agency' || car.maintenanceHistory === 'partial_agency' }] : []),
      ...(car.numKeys ? [{ key: 'numKeys', label: `${car.numKeys} מפתחות`, value: (car.numKeys ?? 0) >= 2 }] : []),
    ] : [],
    documents: (listing.documents ?? []).map((d: ListingDocument) => ({
      id: d.id,
      type: d.type,
      label: getDocumentLabel(d.type),
      name: d.name,
      url: d.url,
      verified: d.verificationStatus === 'verified',
      verificationStatus: d.verificationStatus,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
    seller: listing.user ? serializeSeller(listing.user) : undefined,
    isFavorited: listing.isFavorited ?? false,
  };
}

function serializeSeller(user: any) {
  const profile = user.profile;
  const orgMember = user.organizationMembers?.[0];
  return {
    id: user.id,
    name: user.name ?? profile?.displayName ?? 'משתמש',
    avatarUrl: user.avatarUrl ?? profile?.avatarUrl ?? null,
    isVerified: profile?.verificationStatus === 'verified',
    isDealer: !!orgMember?.organization?.type && ['dealer'].includes(orgMember.organization.type),
    memberSince: user.createdAt?.toISOString?.() ?? user.createdAt ?? '',
    listingsCount: profile?.listingsCount ?? user._count?.listings ?? 0,
    soldCount: profile?.soldCount ?? 0,
    trustScore: 0, // computed separately if needed
    responseTimeMinutes: profile?.responseTimeMinutes ?? null,
    responseRate: profile?.responseRate ?? null,
  };
}

function getMaintenanceLabel(value: string): string {
  const map: Record<string, string> = {
    full_agency: 'שירות מלא בסוכנות',
    partial_agency: 'חלקי בסוכנות',
    independent: 'מוסך עצמאי',
    none: 'אין היסטוריה',
  };
  return map[value] ?? value;
}

function getDocumentLabel(type: string): string {
  const map: Record<string, string> = {
    vehicle_license: 'רישיון רכב',
    vehicle_test: 'תעודת טסט',
    insurance: 'ביטוח',
    inspection_report: 'דו"ח בדיקה',
    ownership_proof: 'הוכחת בעלות',
    other: 'מסמך אחר',
  };
  return map[type] ?? type;
}

export function serializeSearchResults(
  listings: ListingWithRelations[],
  pagination: { total: number; page: number; pageSize: number },
  facets?: any[],
) {
  return {
    items: listings.map(serializeListingCard),
    total: pagination.total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(pagination.total / pagination.pageSize),
    hasMore: pagination.page * pagination.pageSize < pagination.total,
    facets: facets ?? [],
  };
}
