# Stage 4B.2 — Admin mutation audit

Date: 29 October 2026 (UTC+07:00). Audited baseline: `cdd537cae5d8d61f36563ab5d97a3b7cdca2d5ab`.

The repository exposes 17 Admin Server Actions: 15 authenticated business mutation actions plus login and logout. Existing modules are dashboard, vehicles/images, brands/models, dealer settings/logo and website content. Dashboard is read-only. The only Route Handler is public `GET /healthz`; no separate upload/API mutation endpoint exists.

## Complete entry-point inventory

| Module | Action | Source | Impact | Classification | Confirmation | Implementation | Test coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Vehicles | Create | `server/cars/actions.ts:createCarAction` → `createCar` | New listing; AVAILABLE immediately publishes | Routine for new draft/SOLD; Critical for AVAILABLE publication | Required only when publishing | Added: `CarForm` / `vehicleConfirmation` | policy test new draft/publication; existing car validation/auth |
| Vehicles | Update | `updateCarAction` → `updateCar` | Price, status, identity/specifications and featured visibility | Critical when price/status/condition/brand/model/variant/year/mileage/transmission/fuel/color/featured changes; Routine description-only | Conditional, one combined summary | Added shared form; controlled draft retained | policy field matrix, SOLD reversal, description/formatting no-op; prior draft regression |
| Vehicles | Delete | `deleteCarAction` → `deleteCarWithMedia` | Removes vehicle and cleans image objects | Critical | Required | Reused protection, replaced native confirm with shared destructive dialog | form cancel/confirm/double-submit; SSR wiring; existing auth |
| Vehicle images | Upload additional image | `uploadImageAction` → `uploadCarImage` | Adds validated media; first image automatically becomes initial cover | Routine; does not replace an existing primary image | Not required | Existing routine upload unchanged | existing decoder, storage compensation and authorization tests |
| Vehicle images | Set primary | `setPrimaryImageAction` → `setPrimaryImage` | Replaces public cover selection | Critical | Required | Added shared dialog identifying image order | shared form tests; SSR action wiring; existing action auth |
| Vehicle images | Reorder | `reorderImageAction` → `reorderCarImage` | Changes gallery order, preserves primary flag | Routine | Not required | Existing path unchanged | existing image-domain and authorization tests |
| Vehicle images | Delete primary/non-primary | `deleteImageAction` → `deleteCarImage` | Removes object/reference; primary removal can select fallback cover | Critical | Required | Reused native protection as shared dialog; primary warning explains fallback | form deletion gate, destructive configuration, existing auth |
| Brands | Create or rename | `server/master-data/actions.ts:saveBrandAction` | Rename changes catalog name/slug; IDs and linked relations retained | Create Routine; existing rename Critical | Rename only; no prompt for unchanged trimmed name | Reused Stage 4B.1 protection via `brandConfirmation`, replaces window.confirm | D-001 old/new summary, creation/no-op policy; form gate tests |
| Models | Create, rename or change parent brand | `saveModelAction` | Catalog identity/relationship; existing server rejects changing brand for an in-use model | Create/no-op Routine; rename/parent change Critical | Conditional | Added `modelConfirmation`; server rule unchanged | model rename/brand/no-op policy; existing action auth |
| Dealer settings | Save identity/contact/colors | `server/settings/actions.ts:saveDealerSettingsAction` → `upsertDealerSettings` | Dealer name, contact, location, social contact destinations | Identity/contact/location/social changes Critical; colors Routine | Conditional, one combined summary | Added `settingsConfirmation`; required address validation and notification retained | settings field matrix/cosmetic no-op; Stage 4B.1 validation/draft tests |
| Dealer logo | Upload/replace | `uploadDealerLogoAction` → `replaceDealerLogo` | Business visual identity; replacement cleans old object | Initial upload Routine; replacement Critical | Existing logo replacement only | Added shared dialog | shared form behavior and source wiring; existing upload/auth tests |
| Dealer logo | Remove | `removeDealerLogoAction` → `removeDealerLogo` | Removes public identity image | Critical | Required | Added destructive dialog | shared form behavior; existing authorization |
| CMS profile | Save welcome/about/showroom/hours | `server/content/actions.ts:saveDealerContentAction` | Section publication, showroom image and business hours | Publish/unpublish, existing showroom replace/remove and visible hours changes Critical; routine text editing Routine | Conditional | Added `profileConfirmation`; one summary for combined changes | profile toggles/hours/media policy; existing CMS transactions/auth |
| CMS items | Create/update main/promo banners, FAQ, advantages, leasing partners | `saveContentItemAction` | Public visibility/media/destination links | New inactive item, text/order edits Routine; publish/unpublish and active media/link change Critical | Conditional | Added `contentConfirmation`; owner lock/5-active rule retained | item draft/order/text/publication/media/link policies; existing CMS regressions |
| CMS items | Delete any existing kind | `deleteContentItemAction` | Removes content and media, including active banners/promotions | Critical | Required | Reused checkbox protection as one shared destructive dialog; existing `confirm=on` field supplied by form | form gate; SSR wiring; existing CMS delete/auth tests |
| Authentication | Login | `server/auth/actions.ts:loginAction` | Creates authenticated admin session, expires old sessions and maintains limiter | Routine authentication operation | Not required | Existing; unchanged | existing session/limiter/env tests; Stage 3C authorization regressions |
| Authentication | Logout | `logoutAction` → `destroyAdminSession` | Invalidates session and returns to login | Routine; explicit exemption | NEVER required | Existing direct form in `AdminNav`; unchanged byte-for-byte | SSR exemption test plus baseline byte comparison |

## Internal services and operations

| Boundary | Assessment |
| --- | --- |
| `server/cars/service.ts` | Seven mutation services are reached through vehicle/image actions above; `assertModelBelongsToBrand` and private `carData` are validation/query helpers, not additional UI mutation entry points. No new authorization logic introduced |
| `server/settings/service.ts` | Settings upsert and logo replace/remove mapped above; admin settings read remains guarded. No service changes in this stage |
| `server/content/actions.ts` | Profile/item transactions, owner-row lock, upload and cleanup helpers mapped to the three CMS entry points; no additional route or mutation service |
| `server/master-data/actions.ts` | Brand/model queries and create/update calls remain in the two audited actions |
| `server/auth/session.ts` | Session creation/invalidation/expired-session cleanup are internal authentication maintenance. No new human confirmation or changes to their behavior |
| Storage provider `put/delete` | Internal persistence behind authenticated actions. Confirmation is before the normal UI action request; upload validation and path defenses remain authoritative |
| Prisma seed scripts | Operator CLI provisioning, not an Admin UI workflow; not invoked or modified |
| Public routes and catalog/search forms | Read-only presentation/navigation, outside critical mutation scope; unchanged |

## Unsupported operations

| Operation | Result |
| --- | --- |
| Delete brand/model | No supported action or UI; not implemented or invented |
| Edit existing brand/model IDs | IDs are hidden identifiers; no user-facing identifier-edit operation |
| Replace image file in place | No such vehicle operation; adding media is separate from setting cover and deleting old media |
| Tenant administration, billing, users/roles | Not present; no features added |
| Logout confirmation | Explicitly prohibited; no wrapper applied |

## Shared confirmation contract

| Aspect | Implementation |
| --- | --- |
| Component / policy | `components/admin/confirmation-form.tsx`; `features/admin/confirmation-policy.ts` |
| Normal UI gate | Prevents submit and opens a styled modal when policy returns a critical change; only explicit Confirm resubmits the existing form/action |
| Routine path | Null policy permits immediate existing form submission without a dialog |
| Cancel/Escape | Closes dialog, preserves form values and selected file, sends no request, restores focus when trigger remains connected |
| Accessibility | Labelled/described HTML dialog, aria-modal, initial Cancel focus, Tab/Shift+Tab cycling, visible focus, browser modal background inertness |
| Pending / duplicate prevention | Immediate submission lock plus React form pending observer; controls disabled while pending; close/unlock when completed |
| Changed data | Critical summary fingerprint is recomputed on confirmed submit; changed critical values require a fresh confirmation |
| Before hydration | Wrapped forms' fieldsets remain disabled until hydration; critical mutation cannot accidentally proceed via the pre-hydration normal UI |
| Server trust | Confirmation is UX accident protection, not authorization. Direct Server Action calls still rely on existing auth, validation and transaction rules; no security claim is based on a client-confirm flag |
| Duplicate dialogs | Existing native prompts/checkbox are replaced in the UI, not stacked. The legacy pure rename helper remains for compatibility with earlier tests but is no longer used by production forms |

Unit/adapter/SSR verification is recorded in the implementation report. No live database, staging or browser certification is implied by this source audit.
