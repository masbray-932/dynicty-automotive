# Basic Dealer Master Specification

## Product boundary

Dynicty Automotive Basic Dealer is a responsive single-dealer website for presenting new and used cars and converting interest into direct dealer contact. Temporary Dynicty Automotive branding is a fallback; dealer identity must ultimately come from `DealerSettings`.

## Final public scope

- Homepage
- Car catalog
- New cars and used cars views
- Car detail
- Basic search and filters
- WhatsApp sales CTA
- Dealer contact information

## Final admin scope

- Admin login and logout
- Dashboard
- Add, edit, and delete car records
- Manage ordered car images and cover image
- Change car status
- Dealer settings

## Technical scope

- Responsive design
- Basic SEO
- Production deployment readiness

## Explicitly out of scope

Shopping cart, checkout, payment gateway, marketplace, multi-seller operation, seller registration, customer accounts, financing application workflow, loan approval, trade-in workflow, test-drive booking, CRM, sales assignment, car comparison, 360-degree vehicle viewer, multi-showroom operation, mobile applications, and push notifications.

Public catalog filtering and vehicle detail remain later-phase foundations and do not claim final behavior.

## Current delivery status

Phase 1 implements authenticated inventory administration. Phase 2 adds the production Homepage and reusable public vehicle card. Phase 3 delivers the `/cars` catalog with AVAILABLE-only database queries, validated URL filters, database-derived options, deterministic sorting, server pagination, result counts, filter summaries, and canonical/noindex handling. Final vehicle detail and contextual WhatsApp sales behavior remain deferred.
