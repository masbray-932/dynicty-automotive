# Dealer Settings Administration

`/admin/settings` and every settings mutation require admin authentication. Basic Dealer always reads/upserts the single row with fixed ID `default`.

Supported fields are dealer name, phone, WhatsApp, email, multiline address, Google Maps, Instagram, Facebook, primary/secondary color, and logo. Name is required/trimmed; email is canonicalized; links require HTTP/HTTPS; WhatsApp reuses Phase 4 normalization; colors accept only six-digit hex. Inputs are plain text and length-limited.

Logos accept verified PNG/JPEG/WEBP up to 4 MB under `dealer/logo/`. Replacement compensates storage if the database update fails and cleans the old object after success; removal clears the reference first and reports cleanup failure. Public Header, Footer, Homepage, detail/WhatsApp, metadata, and CSS branding tokens use the centralized reader. Actions revalidate `/`, `/cars`, detail pages, settings, and sitemap.
