import { prisma } from '@zuzz/database';
import { TrustEngine } from '@zuzz/trust-engine';
import type { ListingBase, ListingVertical, MediaItem } from '@zuzz/types';
import type {
  Listing,
  CarListing,
  ListingMedia,
  ListingDocument,
  UserProfile,
} from '@zuzz/database';

const engine = new TrustEngine();

type ListingWithRelations = Listing & {
  carDetails?: CarListing | null;
  media?: ListingMedia[];
  documents?: ListingDocument[];
  user?: { profile?: UserProfile | null } | null;
};

/**
 * Converts a Prisma listing record to the ListingBase shape expected by the trust engine.
 */
function toListingBase(listing: ListingWithRelations): ListingBase {
  const car = listing.carDetails;

  const base: ListingBase = {
    id: listing.id,
    userId: listing.userId,
    organizationId: listing.organizationId ?? undefined,
    vertical: listing.vertical as ListingVertical,
    status: listing.status as any,
    moderationStatus: listing.moderationStatus as any,
    title: listing.title,
    description: listing.description ?? undefined,
    price: { amount: listing.priceAmount, currency: listing.priceCurrency as any },
    isNegotiable: listing.isNegotiable,
    location: { city: listing.city ?? undefined, region: listing.region ?? undefined },
    media: (listing.media ?? []).map(
      (m: ListingMedia): MediaItem => ({
        id: m.id,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl ?? undefined,
        type: m.type as any,
        mimeType: m.mimeType ?? '',
        size: m.size ?? 0,
        width: m.width ?? undefined,
        height: m.height ?? undefined,
        order: m.order,
        alt: m.alt ?? undefined,
      }),
    ),
    viewCount: listing.viewCount,
    favoriteCount: listing.favoriteCount,
    completenessScore: listing.completenessScore,
    trustScore: listing.trustScore ?? undefined,
    isFeatured: listing.isFeatured,
    isPromoted: listing.isPromoted,
    publishedAt: listing.publishedAt ?? undefined,
    expiresAt: listing.expiresAt ?? undefined,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  };

  // Attach car-specific fields as extra properties for car rules to access
  if (car) {
    (base as any).car = {
      make: car.make,
      model: car.model,
      trim: car.trim,
      year: car.year,
      mileage: car.mileage,
      handCount: car.handCount,
      ownershipType: car.ownershipType,
      gearbox: car.gearbox,
      fuelType: car.fuelType,
      engineVolume: car.engineVolume,
      horsepower: car.horsepower,
      seats: car.seats,
      color: car.color,
      testUntil: car.testUntil,
      sellerType: car.sellerType,
      accidentDeclared: car.accidentDeclared,
      accidentDetails: car.accidentDetails,
      engineReplaced: car.engineReplaced,
      gearboxReplaced: car.gearboxReplaced,
      frameDamage: car.frameDamage,
      maintenanceHistory: car.maintenanceHistory,
      numKeys: car.numKeys,
      warrantyExists: car.warrantyExists,
      warrantyDetails: car.warrantyDetails,
      recallStatus: car.recallStatus,
      personalImport: car.personalImport,
      isElectric: car.isElectric,
      batteryCapacity: car.batteryCapacity,
      batteryHealth: car.batteryHealth,
      rangeKm: car.rangeKm,
      features: car.features,
    };
  }

  // Attach documents
  if (listing.documents) {
    (base as any).documents = listing.documents.map((d: ListingDocument) => ({
      id: d.id,
      type: d.type,
      name: d.name,
      url: d.url,
      verificationStatus: d.verificationStatus,
    }));
  }

  return base;
}

/**
 * Computes trust score and factors for a listing, then persists them to the DB.
 */
export async function computeAndPersistTrust(
  listingId: string,
): Promise<{ trustScore: number; completenessScore: number }> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      carDetails: true,
      media: true,
      documents: true,
      user: { include: { profile: true } },
    },
  });

  if (!listing) throw new Error('Listing not found');

  const listingBase = toListingBase(listing);

  // Compute trust score
  const trustResult = engine.computeScore(listingBase, {
    sellerProfile: listing.user?.profile
      ? ({
          id: listing.user.profile.id,
          userId: listing.user.profile.userId,
          displayName: listing.user.profile.displayName,
          bio: listing.user.profile.bio ?? undefined,
          avatarUrl: listing.user.profile.avatarUrl ?? undefined,
          city: listing.user.profile.city ?? undefined,
          region: listing.user.profile.region ?? undefined,
          responseTimeMinutes: listing.user.profile.responseTimeMinutes ?? undefined,
          responseRate: listing.user.profile.responseRate ?? undefined,
          listingsCount: listing.user.profile.listingsCount,
          soldCount: listing.user.profile.soldCount,
          verificationStatus: listing.user.profile.verificationStatus as any,
          badges: Array.isArray(listing.user.profile.badges)
            ? (listing.user.profile.badges as any[])
            : [],
          createdAt: listing.user.profile.createdAt,
          updatedAt: listing.user.profile.updatedAt,
        } as any)
      : undefined,
  });

  // Compute completeness
  const completeness = engine.computeCompleteness(listingBase);

  // Delete old trust factors and insert new ones
  await prisma.trustFactor.deleteMany({ where: { listingId } });

  if (trustResult.factors.length > 0) {
    await prisma.trustFactor.createMany({
      data: trustResult.factors.map((f) => ({
        listingId,
        type: f.type,
        category: f.category,
        status: f.status,
        weight: f.weight,
        score: f.score,
        label: f.label,
        labelHe: f.labelHe,
        description: f.description ?? '',
      })),
    });
  }

  // Update listing with scores
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      trustScore: trustResult.overall,
      completenessScore: completeness.score,
    },
  });

  return { trustScore: trustResult.overall, completenessScore: completeness.score };
}
