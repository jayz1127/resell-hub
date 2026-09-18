-- Resell Hub database setup.
-- Paste this whole file into Supabase's SQL Editor (project dashboard ->
-- SQL Editor -> New query) and click "Run" once. This creates every
-- table the app needs. You only need to do this one time.

create type "SourceType" as enum ('PURCHASED', 'HAND_ME_DOWN');
create type "ItemStatus" as enum ('ACTIVE', 'SOLD', 'ARCHIVED');
create type "Platform" as enum ('EBAY', 'POSHMARK', 'MERCARI', 'VINTED', 'DEPOP');
create type "ListingStatus" as enum ('ACTIVE', 'SOLD', 'DELISTED', 'ERROR');

create table "Item" (
  "id" text primary key,
  "name" text not null,
  "brand" text,
  "category" text,
  "sku" text unique,
  "sourceType" "SourceType" not null,
  "costBasis" double precision,
  "acquiredAt" timestamp(3),
  "notes" text,
  "description" text,
  "images" text[] not null default '{}',
  "status" "ItemStatus" not null default 'ACTIVE',
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);

create table "Listing" (
  "id" text primary key,
  "itemId" text not null references "Item"("id") on delete cascade,
  "platform" "Platform" not null,
  "externalId" text,
  "price" double precision not null,
  "status" "ListingStatus" not null default 'ACTIVE',
  "listedAt" timestamp(3) not null default now(),
  "delistedAt" timestamp(3),
  "lastError" text,
  unique ("itemId", "platform")
);

create table "Sale" (
  "id" text primary key,
  "itemId" text not null references "Item"("id") on delete cascade,
  "platform" "Platform" not null,
  "salePrice" double precision not null,
  "platformFee" double precision not null default 0,
  "shippingCost" double precision not null default 0,
  "soldAt" timestamp(3) not null,
  "createdAt" timestamp(3) not null default now(),
  "deletedAt" timestamp(3)
);

create table "PriceSnapshot" (
  "id" text primary key,
  "itemId" text not null references "Item"("id") on delete cascade,
  "platform" "Platform" not null,
  "price" double precision not null,
  "capturedAt" timestamp(3) not null default now()
);

create table "PlatformConnection" (
  "id" text primary key,
  "platform" "Platform" not null unique,
  "connected" boolean not null default false,
  "lastSyncAt" timestamp(3),
  "lastError" text
);

create index "Listing_platform_status_idx" on "Listing"("platform", "status");
create index "Sale_platform_idx" on "Sale"("platform");
create index "Sale_soldAt_idx" on "Sale"("soldAt");
create index "Sale_deletedAt_idx" on "Sale"("deletedAt");
create index "PriceSnapshot_itemId_capturedAt_idx" on "PriceSnapshot"("itemId", "capturedAt");
create index "Item_status_idx" on "Item"("status");
create index "Item_sourceType_idx" on "Item"("sourceType");
