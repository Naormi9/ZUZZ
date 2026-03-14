import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ZUZZ database...');

  // Clean existing data
  await prisma.analyticsEvent.deleteMany();
  await prisma.moderationAction.deleteMany();
  await prisma.moderationNote.deleteMany();
  await prisma.moderationCase.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.cannedReply.deleteMany();
  await prisma.trustFactor.deleteMany();
  await prisma.verificationRecord.deleteMany();
  await prisma.listingDocument.deleteMany();
  await prisma.listingMedia.deleteMany();
  await prisma.listingStatusHistory.deleteMany();
  await prisma.listingReport.deleteMany();
  await prisma.carListing.deleteMany();
  await prisma.propertyListing.deleteMany();
  await prisma.marketListing.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.dealerProfile.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.article.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──
  const admin = await prisma.user.create({
    data: {
      email: 'admin@zuzz.co.il',
      name: 'מנהל ראשי',
      roles: ['admin', 'moderator'],
      isEmailVerified: true,
      isActive: true,
      profile: {
        create: {
          displayName: 'מנהל ZUZZ',
          verificationStatus: 'verified',
          badges: JSON.stringify([]),
        },
      },
    },
  });

  const seller1 = await prisma.user.create({
    data: {
      email: 'yossi@example.com',
      name: 'יוסי כהן',
      phone: '0541234567',
      roles: ['user', 'private_seller'],
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      profile: {
        create: {
          displayName: 'יוסי כהן',
          city: 'תל אביב-יפו',
          region: 'tel_aviv',
          verificationStatus: 'verified',
          listingsCount: 2,
          soldCount: 1,
          responseTimeMinutes: 30,
          responseRate: 95,
          badges: JSON.stringify([
            { type: 'verified_identity', label: 'זהות מאומתת', earnedAt: new Date().toISOString() },
            { type: 'verified_phone', label: 'טלפון מאומת', earnedAt: new Date().toISOString() },
            { type: 'fast_responder', label: 'מגיב מהיר', earnedAt: new Date().toISOString() },
          ]),
        },
      },
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: 'dana@example.com',
      name: 'דנה לוי',
      phone: '0529876543',
      roles: ['user', 'private_seller'],
      isEmailVerified: true,
      isActive: true,
      profile: {
        create: {
          displayName: 'דנה לוי',
          city: 'הרצליה',
          region: 'sharon',
          verificationStatus: 'verified',
          listingsCount: 1,
          badges: JSON.stringify([]),
        },
      },
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@example.com',
      name: 'אבי ישראלי',
      roles: ['user', 'buyer'],
      isEmailVerified: true,
      isActive: true,
      profile: {
        create: {
          displayName: 'אבי ישראלי',
          city: 'ירושלים',
          region: 'jerusalem',
          verificationStatus: 'pending',
          badges: JSON.stringify([]),
        },
      },
    },
  });

  const dealerUser = await prisma.user.create({
    data: {
      email: 'dealer@carzone.co.il',
      name: 'רון מכוניות',
      roles: ['user', 'dealer'],
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      profile: {
        create: {
          displayName: 'רון - CarZone',
          city: 'ראשון לציון',
          region: 'center',
          verificationStatus: 'verified',
          listingsCount: 5,
          soldCount: 15,
          responseTimeMinutes: 15,
          responseRate: 98,
          badges: JSON.stringify([
            { type: 'verified_dealer', label: 'סוחר מאומת', earnedAt: new Date().toISOString() },
            { type: 'top_seller', label: 'מוכר מוביל', earnedAt: new Date().toISOString() },
          ]),
        },
      },
    },
  });

  // ── Organization ──
  const dealerOrg = await prisma.organization.create({
    data: {
      name: 'CarZone — רכבים באמון',
      type: 'dealer',
      description: 'סוכנות רכב מובילה עם 20 שנות ניסיון. מתמחים ברכבי פרימיום ורכבים חשמליים.',
      phone: '03-1234567',
      email: 'info@carzone.co.il',
      website: 'https://carzone.co.il',
      city: 'ראשון לציון',
      region: 'center',
      licenseNumber: '51-234567',
      verificationStatus: 'verified',
      isActive: true,
      members: {
        create: { userId: dealerUser.id, role: 'owner' },
      },
      dealerProfile: {
        create: {
          specialties: ['premium', 'electric', 'hybrid'],
          avgResponseTime: 15,
          avgResponseRate: 98,
          rating: 4.7,
          reviewCount: 89,
          openingHours: {
            sun: { open: '08:00', close: '18:00' },
            mon: { open: '08:00', close: '18:00' },
            tue: { open: '08:00', close: '18:00' },
            wed: { open: '08:00', close: '18:00' },
            thu: { open: '08:00', close: '18:00' },
            fri: { open: '08:00', close: '13:00' },
          },
        },
      },
    },
  });

  // ── Car Listings ──
  const carListing1 = await prisma.listing.create({
    data: {
      userId: seller1.id,
      vertical: 'cars',
      status: 'active',
      moderationStatus: 'approved',
      title: 'טויוטה קורולה Cross 2023 – יד ראשונה, מצב מעולה',
      description: 'רכב שמור מאוד, יד ראשונה מ-0. טסט עד 08/2025. ללא תאונות. שירות מלא בסוכנות.',
      priceAmount: 165000,
      priceCurrency: 'ILS',
      isNegotiable: true,
      city: 'תל אביב-יפו',
      region: 'tel_aviv',
      viewCount: 234,
      favoriteCount: 18,
      completenessScore: 92,
      trustScore: 88,
      publishedAt: new Date('2024-02-15'),
      carDetails: {
        create: {
          make: 'Toyota',
          model: 'Corolla Cross',
          trim: 'Luxury',
          year: 2023,
          mileage: 25000,
          handCount: 1,
          ownershipType: 'private',
          gearbox: 'automatic',
          fuelType: 'hybrid',
          engineVolume: 1800,
          horsepower: 140,
          seats: 5,
          color: 'לבן פנינה',
          testUntil: new Date('2025-08-01'),
          sellerType: 'private',
          accidentDeclared: false,
          engineReplaced: false,
          gearboxReplaced: false,
          frameDamage: false,
          maintenanceHistory: 'full_agency',
          numKeys: 2,
          warrantyExists: true,
          warrantyDetails: 'אחריות יצרן עד 100,000 ק"מ',
          recallStatus: 'none',
          personalImport: false,
          isElectric: false,
          bodyType: 'crossover',
          features: [
            'מולטימדיה',
            'מצלמה אחורית',
            'חיישני חניה',
            'שליטה מרחוק',
            'בקרת שיוט אדפטיבית',
          ],
        },
      },
      trustFactors: {
        create: [
          {
            type: 'verified_owner',
            category: 'identity',
            status: 'positive',
            weight: 1.5,
            score: 15,
            label: 'Verified Owner',
            labelHe: 'בעלות מאומתת',
          },
          {
            type: 'no_accident',
            category: 'history',
            status: 'positive',
            weight: 1.2,
            score: 12,
            label: 'No Accidents',
            labelHe: 'ללא תאונות',
          },
          {
            type: 'full_maintenance',
            category: 'history',
            status: 'positive',
            weight: 1.0,
            score: 10,
            label: 'Full Service History',
            labelHe: 'שירות מלא בסוכנות',
          },
          {
            type: 'test_valid',
            category: 'documentation',
            status: 'positive',
            weight: 1.0,
            score: 10,
            label: 'Valid Test',
            labelHe: 'טסט בתוקף',
          },
          {
            type: 'high_completeness',
            category: 'completeness',
            status: 'positive',
            weight: 0.8,
            score: 8,
            label: 'High Completeness',
            labelHe: 'מודעה מפורטת',
          },
          {
            type: 'single_owner',
            category: 'history',
            status: 'positive',
            weight: 1.0,
            score: 10,
            label: 'Single Owner',
            labelHe: 'יד ראשונה',
          },
        ],
      },
    },
  });

  const carListing2 = await prisma.listing.create({
    data: {
      userId: dealerUser.id,
      organizationId: dealerOrg.id,
      vertical: 'cars',
      status: 'active',
      moderationStatus: 'approved',
      title: 'טסלה Model 3 2024 Long Range — חדש מהיבואן',
      description:
        'טסלה מודל 3 Long Range, גרסה חדשה (Highland). Full Self-Driving. סוללה 100%. אחריות מלאה.',
      priceAmount: 219000,
      priceCurrency: 'ILS',
      isNegotiable: false,
      city: 'ראשון לציון',
      region: 'center',
      viewCount: 567,
      favoriteCount: 45,
      completenessScore: 95,
      trustScore: 92,
      publishedAt: new Date('2024-03-01'),
      carDetails: {
        create: {
          make: 'Tesla',
          model: 'Model 3',
          trim: 'Long Range',
          year: 2024,
          mileage: 3500,
          handCount: 0,
          ownershipType: 'company',
          gearbox: 'automatic',
          fuelType: 'electric',
          horsepower: 346,
          seats: 5,
          color: 'שחור',
          testUntil: new Date('2027-01-01'),
          sellerType: 'dealer',
          accidentDeclared: false,
          engineReplaced: false,
          gearboxReplaced: false,
          frameDamage: false,
          maintenanceHistory: 'full_agency',
          numKeys: 2,
          warrantyExists: true,
          warrantyDetails: 'אחריות יצרן 4 שנים / 80,000 ק"מ. סוללה 8 שנים.',
          recallStatus: 'none',
          personalImport: false,
          isElectric: true,
          batteryCapacity: 75,
          batteryHealth: 100,
          batteryWarrantyUntil: new Date('2032-01-01'),
          rangeKm: 629,
          acChargeKw: 11,
          dcChargeKw: 250,
          chargeConnectorType: 'ccs',
          bodyType: 'sedan',
          features: [
            'Full Self-Driving',
            'Premium Audio',
            'חימום מושבים',
            'גג זכוכית',
            'Autopilot',
          ],
        },
      },
      trustFactors: {
        create: [
          {
            type: 'verified_dealer',
            category: 'identity',
            status: 'positive',
            weight: 1.5,
            score: 15,
            label: 'Verified Dealer',
            labelHe: 'סוחר מאומת',
          },
          {
            type: 'no_accident',
            category: 'history',
            status: 'positive',
            weight: 1.2,
            score: 12,
            label: 'No Accidents',
            labelHe: 'ללא תאונות',
          },
          {
            type: 'warranty_active',
            category: 'documentation',
            status: 'positive',
            weight: 1.0,
            score: 10,
            label: 'Active Warranty',
            labelHe: 'אחריות בתוקף',
          },
          {
            type: 'high_completeness',
            category: 'completeness',
            status: 'positive',
            weight: 0.8,
            score: 8,
            label: 'Complete Listing',
            labelHe: 'מודעה מלאה',
          },
          {
            type: 'docs_uploaded',
            category: 'documentation',
            status: 'positive',
            weight: 1.0,
            score: 10,
            label: 'Documents',
            labelHe: 'מסמכים הועלו',
          },
        ],
      },
    },
  });

  const carListing3 = await prisma.listing.create({
    data: {
      userId: seller2.id,
      vertical: 'cars',
      status: 'active',
      moderationStatus: 'approved',
      title: 'מאזדה 3 2021 – יד שנייה, מחיר מציאה',
      description: 'מאזדה 3 במצב טוב מאוד. יד שנייה מ-0 ק"מ. שירות סדיר.',
      priceAmount: 98000,
      priceCurrency: 'ILS',
      isNegotiable: true,
      city: 'הרצליה',
      region: 'sharon',
      viewCount: 89,
      favoriteCount: 7,
      completenessScore: 75,
      trustScore: 72,
      publishedAt: new Date('2024-03-05'),
      carDetails: {
        create: {
          make: 'Mazda',
          model: '3',
          year: 2021,
          mileage: 62000,
          handCount: 2,
          ownershipType: 'private',
          gearbox: 'automatic',
          fuelType: 'petrol',
          engineVolume: 1500,
          horsepower: 120,
          seats: 5,
          color: 'אדום',
          testUntil: new Date('2025-06-01'),
          sellerType: 'private',
          accidentDeclared: true,
          accidentDetails: 'תאונה קלה בפגוש אחורי, תוקן בסוכנות',
          engineReplaced: false,
          gearboxReplaced: false,
          frameDamage: false,
          maintenanceHistory: 'partial_agency',
          warrantyExists: false,
          personalImport: false,
          isElectric: false,
          bodyType: 'hatchback',
          features: ['מולטימדיה', 'חיישני חניה'],
        },
      },
      trustFactors: {
        create: [
          {
            type: 'accident_declared',
            category: 'history',
            status: 'warning',
            weight: 1.2,
            score: -8,
            label: 'Accident Declared',
            labelHe: 'דווחה תאונה',
          },
          {
            type: 'test_valid',
            category: 'documentation',
            status: 'positive',
            weight: 1.0,
            score: 10,
            label: 'Valid Test',
            labelHe: 'טסט בתוקף',
          },
        ],
      },
    },
  });

  // More dealer cars
  const dealerCars = [
    {
      title: 'יונדאי טוסון 2023 — N Line, פול אקסטרה',
      price: 189000,
      make: 'Hyundai',
      model: 'Tucson',
      trim: 'N Line',
      year: 2023,
      mileage: 18000,
      gearbox: 'automatic',
      fuelType: 'hybrid',
      engineVolume: 1600,
      hp: 230,
      color: 'כחול',
      bodyType: 'suv',
    },
    {
      title: 'BYD Atto 3 2024 — חשמלי מלא, 0 ק"מ',
      price: 159000,
      make: 'BYD',
      model: 'Atto 3',
      year: 2024,
      mileage: 50,
      gearbox: 'automatic',
      fuelType: 'electric',
      hp: 204,
      color: 'לבן',
      bodyType: 'suv',
      isElectric: true,
      batteryCapacity: 60.5,
      rangeKm: 420,
      acChargeKw: 7,
      dcChargeKw: 80,
      connector: 'ccs',
    },
  ];

  for (const c of dealerCars) {
    await prisma.listing.create({
      data: {
        userId: dealerUser.id,
        organizationId: dealerOrg.id,
        vertical: 'cars',
        status: 'active',
        moderationStatus: 'approved',
        title: c.title,
        priceAmount: c.price,
        priceCurrency: 'ILS',
        city: 'ראשון לציון',
        region: 'center',
        viewCount: Math.floor(Math.random() * 300),
        favoriteCount: Math.floor(Math.random() * 30),
        completenessScore: 85,
        trustScore: 85,
        publishedAt: new Date(),
        carDetails: {
          create: {
            make: c.make,
            model: c.model,
            trim: c.trim || null,
            year: c.year,
            mileage: c.mileage,
            handCount: 0,
            ownershipType: 'company',
            gearbox: c.gearbox as string,
            fuelType: c.fuelType as string,
            engineVolume: c.engineVolume || null,
            horsepower: c.hp,
            seats: 5,
            color: c.color,
            sellerType: 'dealer',
            accidentDeclared: false,
            engineReplaced: false,
            gearboxReplaced: false,
            frameDamage: false,
            warrantyExists: true,
            personalImport: false,
            isElectric: (c as any).isElectric || false,
            batteryCapacity: (c as any).batteryCapacity || null,
            rangeKm: (c as any).rangeKm || null,
            acChargeKw: (c as any).acChargeKw || null,
            dcChargeKw: (c as any).dcChargeKw || null,
            chargeConnectorType: (c as any).connector || null,
            bodyType: c.bodyType,
          },
        },
        trustFactors: {
          create: [
            {
              type: 'verified_dealer',
              category: 'identity',
              status: 'positive',
              weight: 1.5,
              score: 15,
              label: 'Verified Dealer',
              labelHe: 'סוחר מאומת',
            },
          ],
        },
      },
    });
  }

  // ── Property Listings ──
  await prisma.listing.create({
    data: {
      userId: seller2.id,
      vertical: 'homes',
      status: 'active',
      moderationStatus: 'approved',
      title: 'דירת 4 חדרים בהרצליה פיתוח – נוף לים',
      description: 'דירה מרווחת עם מרפסת שמש ונוף מרהיב לים. קומה 8, מעלית, חניה, ממ"ד.',
      priceAmount: 3800000,
      priceCurrency: 'ILS',
      city: 'הרצליה',
      region: 'sharon',
      viewCount: 156,
      favoriteCount: 22,
      completenessScore: 88,
      publishedAt: new Date(),
      propertyDetails: {
        create: {
          propertyType: 'apartment',
          listingType: 'sale',
          rooms: 4,
          bathrooms: 2,
          floor: 8,
          totalFloors: 12,
          sizeSqm: 120,
          balconySqm: 14,
          parkingSpots: 1,
          condition: 'renovated',
          yearBuilt: 2015,
          hasElevator: true,
          hasSafeRoom: true,
          hasAirConditioning: true,
          sellerType: 'owner',
          features: ['נוף לים', 'מרפסת שמש', 'מטבח מעוצב'],
        },
      },
    },
  });

  await prisma.listing.create({
    data: {
      userId: seller1.id,
      vertical: 'homes',
      status: 'active',
      moderationStatus: 'approved',
      title: 'דירת 3 חדרים להשכרה בתל אביב',
      description: 'דירה מרוהטת חלקית, קרובה לים ולתחבורה ציבורית.',
      priceAmount: 6500,
      priceCurrency: 'ILS',
      isNegotiable: false,
      city: 'תל אביב-יפו',
      region: 'tel_aviv',
      viewCount: 89,
      favoriteCount: 11,
      completenessScore: 78,
      publishedAt: new Date(),
      propertyDetails: {
        create: {
          propertyType: 'apartment',
          listingType: 'rent',
          rooms: 3,
          bathrooms: 1,
          floor: 3,
          totalFloors: 5,
          sizeSqm: 75,
          balconySqm: 8,
          condition: 'good',
          yearBuilt: 2005,
          hasElevator: false,
          hasSafeRoom: false,
          hasAirConditioning: true,
          furniture: 'partial',
          isImmediate: true,
          sellerType: 'owner',
          arnona: 350,
          vaadBait: 180,
        },
      },
    },
  });

  // ── Market Listings ──
  await prisma.listing.create({
    data: {
      userId: buyer.id,
      vertical: 'market',
      status: 'active',
      moderationStatus: 'approved',
      title: 'אייפון 15 פרו מקס 256GB — כמו חדש',
      description: 'נרכש לפני 3 חודשים. כולל קופסה מקורית ומגן מסך.',
      priceAmount: 3800,
      priceCurrency: 'ILS',
      isNegotiable: true,
      city: 'ירושלים',
      region: 'jerusalem',
      viewCount: 45,
      favoriteCount: 8,
      completenessScore: 80,
      publishedAt: new Date(),
      marketDetails: {
        create: {
          category: 'electronics',
          condition: 'like_new',
          brand: 'Apple',
          attributes: { storage: '256GB', color: 'Natural Titanium' },
        },
      },
    },
  });

  await prisma.listing.create({
    data: {
      userId: seller1.id,
      vertical: 'market',
      status: 'active',
      moderationStatus: 'approved',
      title: 'ספה תלת-מושבית IKEA — מצב מעולה',
      description: 'ספה נוחה מאוד, צבע אפור. נרכשה לפני שנה. ניתן לפרק להובלה.',
      priceAmount: 1200,
      priceCurrency: 'ILS',
      isNegotiable: true,
      city: 'תל אביב-יפו',
      region: 'tel_aviv',
      viewCount: 23,
      favoriteCount: 3,
      completenessScore: 70,
      publishedAt: new Date(),
      marketDetails: {
        create: {
          category: 'furniture',
          condition: 'good',
          brand: 'IKEA',
        },
      },
    },
  });

  // ── Favorites ──
  await prisma.favorite.create({
    data: { userId: buyer.id, listingId: carListing1.id },
  });
  await prisma.favorite.create({
    data: { userId: buyer.id, listingId: carListing2.id },
  });

  // ── Conversations ──
  const conv = await prisma.conversation.create({
    data: {
      listingId: carListing1.id,
      buyerId: buyer.id,
      sellerId: seller1.id,
      lastMessagePreview: 'היי, הרכב עדיין זמין?',
      buyerUnreadCount: 0,
      sellerUnreadCount: 1,
      messages: {
        create: [
          {
            senderId: buyer.id,
            content: 'שלום, ראיתי את הטויוטה קורולה. האם ניתן לראות את הרכב?',
            type: 'text',
          },
          { senderId: seller1.id, content: 'בוודאי! מתי נוח לך?', type: 'text', isRead: true },
          { senderId: buyer.id, content: 'היי, הרכב עדיין זמין?', type: 'text' },
        ],
      },
    },
  });

  // ── Leads ──
  await prisma.lead.create({
    data: {
      listingId: carListing2.id,
      buyerId: buyer.id,
      sellerId: dealerUser.id,
      type: 'test_drive',
      status: 'new',
      message: 'מעוניין בנסיעת מבחן בטסלה מודל 3',
      phone: '0501234567',
    },
  });

  // ── Feature Flags ──
  await prisma.featureFlag.createMany({
    data: [
      {
        key: 'cars_enabled',
        name: 'Cars Vertical',
        description: 'Enable cars vertical',
        isEnabled: true,
      },
      {
        key: 'homes_enabled',
        name: 'Homes Vertical',
        description: 'Enable homes vertical',
        isEnabled: true,
      },
      {
        key: 'market_enabled',
        name: 'Market Vertical',
        description: 'Enable market vertical',
        isEnabled: true,
      },
      {
        key: 'messaging_enabled',
        name: 'Messaging',
        description: 'Enable in-app messaging',
        isEnabled: true,
      },
      {
        key: 'promotions_enabled',
        name: 'Promotions',
        description: 'Enable paid promotions',
        isEnabled: false,
      },
      {
        key: 'ev_features',
        name: 'EV Features',
        description: 'Show EV-specific fields',
        isEnabled: true,
      },
      {
        key: 'dealer_portal',
        name: 'Dealer Portal',
        description: 'Enable dealer portal',
        isEnabled: true,
      },
      {
        key: 'trust_score_visible',
        name: 'Trust Score Display',
        description: 'Show trust scores publicly',
        isEnabled: true,
      },
    ],
  });

  // ── Articles ──
  await prisma.article.create({
    data: {
      slug: 'about',
      type: 'page',
      title: 'About ZUZZ',
      titleHe: 'אודות ZUZZ',
      content: 'ZUZZ is a trust-first classifieds platform for Israel.',
      contentHe: 'ZUZZ היא פלטפורמת מודעות מבוססת אמון לישראל. המקום שבו עסקאות זזות באמת.',
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await prisma.article.create({
    data: {
      slug: 'buying-guide-cars',
      type: 'guide',
      title: 'Car Buying Guide',
      titleHe: 'מדריך קניית רכב',
      content: 'Everything you need to know before buying a car in Israel.',
      contentHe: 'כל מה שצריך לדעת לפני שקונים רכב בישראל.',
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`   Users: 5 (admin, 2 sellers, buyer, dealer)`);
  console.log(`   Organizations: 1 dealer`);
  console.log(`   Car listings: 5`);
  console.log(`   Property listings: 2`);
  console.log(`   Market listings: 2`);
  console.log(`   Conversations: 1`);
  console.log(`   Feature flags: 8`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
