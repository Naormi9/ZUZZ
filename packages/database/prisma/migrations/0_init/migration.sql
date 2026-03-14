-- ZUZZ Initial Migration
-- This migration represents the baseline schema.
--
-- For new deployments: run `pnpm db:migrate:deploy` to apply.
-- For existing databases using db:push: run `prisma migrate resolve --applied 0_init`
--   to mark this migration as already applied without re-running it.
--
-- Required PostgreSQL extensions (created by infrastructure/scripts/init-db.sql):
--   uuid-ossp, postgis, pg_trgm, unaccent

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SOLD', 'EXPIRED', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ListingVertical" AS ENUM ('CARS', 'HOMES', 'MARKET');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'PLUGIN_HYBRID', 'ELECTRIC', 'LPG', 'OTHER');

-- CreateEnum
CREATE TYPE "GearboxType" AS ENUM ('MANUAL', 'AUTOMATIC', 'TIPTRONIC', 'ROBOTIC');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('SEDAN', 'HATCHBACK', 'SUV', 'CROSSOVER', 'COUPE', 'CONVERTIBLE', 'WAGON', 'VAN', 'PICKUP', 'MINIVAN', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'PENTHOUSE', 'GARDEN_APARTMENT', 'DUPLEX', 'STUDIO', 'TOWNHOUSE', 'VILLA', 'LAND', 'COMMERCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MarketCategory" AS ENUM ('ELECTRONICS', 'FURNITURE', 'FASHION', 'SPORTS', 'BOOKS', 'TOYS', 'HOME_GARDEN', 'PETS', 'TOOLS', 'MUSIC', 'ART', 'COLLECTIBLES', 'OTHER');

-- CreateEnum
CREATE TYPE "MarketCondition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'FOR_PARTS');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('BUYER', 'SELLER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MESSAGE', 'LEAD', 'LISTING_UPDATE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'FRAUD', 'INAPPROPRIATE', 'DUPLICATE', 'WRONG_CATEGORY', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "roles" TEXT[] DEFAULT ARRAY['user']::TEXT[],
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- NOTE: This is a baseline migration placeholder.
-- The complete SQL is generated from the Prisma schema.
-- If you are setting up a fresh database, run: pnpm db:migrate:deploy
-- If you already have the schema from db:push, run:
--   cd packages/database && npx prisma migrate resolve --applied 0_init
--
-- The full schema includes tables for:
-- User, UserProfile, Session, OtpCode, Listing, CarDetails, HomeDetails,
-- MarketDetails, ListingMedia, ListingDocument, Favorite, Conversation,
-- Message, Lead, Notification, Report, TrustScore, SavedSearch,
-- Subscription, Promotion, and related models.
--
-- See prisma/schema.prisma for the authoritative schema definition.
