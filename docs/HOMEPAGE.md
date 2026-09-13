# Homepage

## Purpose and composition

The Homepage is the public entry point for a single automotive dealer. Its sequence is: responsive header, hero, quick search, new/used entries, featured cars, brands, latest available cars, trust benefits, dealer CTA, and footer. The existing dark automotive foundation and red accent remain the visual fallback.

## Data behavior

`server/homepage/service.ts` owns Homepage queries. Featured and latest inventory require `status = AVAILABLE`; featured additionally requires `featured = true`. DRAFT and SOLD records never enter Homepage inventory results. Featured results prefer records with an image, then deterministic update/id ordering. Latest results exclude featured IDs where possible. Inventory sections are limited to six cards and brands to twelve alphabetically ordered entries.

Car images resolve through `StorageProvider`. Relation ordering prefers the primary image and then the first ordered image. A local SVG placeholder prevents layout shift and avoids third-party runtime imagery. Prisma Decimal prices are converted to strings in the service and displayed with the shared Rupiah formatter.

## Resilience and rendering

The public layout and Homepage are dynamically server-rendered because they depend on current database content. No cache lifetime is declared in Phase 2, so administered vehicles are not intentionally delayed. Data failures return empty arrays or centralized DealerSettings fallbacks without exposing Prisma errors.

## Dealer integration

Dealer name, logo, WhatsApp, phone, email, address, and supported social values are read from the existing singleton `DealerSettings`. Missing values are omitted. Dynicty Automotive is the centralized identity fallback. The WhatsApp link is intentionally a basic `wa.me` entry without vehicle context.

## Deferred

`/cars` remains a Phase 3 foundation and `/cars/[slug]` remains a Phase 4 foundation. Structured business data is deferred until DealerSettings contains reliably configured business identity and address data. Phase 2 does not claim final filters, final detail behavior, tracked WhatsApp conversion, opening hours, ratings, warranties, or financing relationships.
