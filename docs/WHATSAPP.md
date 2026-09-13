# WhatsApp Vehicle Contact

## Number normalization

DealerSettings is the only number source. Common Indonesian forms (`08…`, `8…`, `62…`, and `+62…`) normalize to digits suitable for `wa.me`. Spaces, parentheses, dots, and hyphens are removed. Unexpected letters, fewer than 10 digits, or more than 15 digits are rejected. No production number is hardcoded.

## Contextual message and URL

The message identifies the real vehicle title, shared formatted Rupiah price, public detail URL, and asks whether the unit remains available. `URLSearchParams` encodes the complete message into `https://wa.me/<number>?text=...`; raw visitor input is never concatenated into the query string.

## Fallback behavior

An invalid or absent WhatsApp number removes both WhatsApp buttons. The contact panel falls back to a configured telephone link, otherwise a link to dealer contact information. Missing values are not rendered as null. The mobile bottom CTA exists only with a valid number and the page adds bottom spacing so content is not covered.

## Privacy and security

Opening WhatsApp is an explicit user action in a new tab. The application sends no message automatically, stores no visitor contact data, and adds no tracking SDK. Vehicle context contains only already-public fields.
