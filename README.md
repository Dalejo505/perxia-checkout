# PERXIA Checkout

Next.js 16 checkout for configurable worker subscriptions and one-time credit packs. API and UI support es, en and pt-BR. The catalog is an explicitly non-commercial development fixture: USD cent amounts, immutable price IDs and versions are defined server-side in `src/lib/fixture.ts`, never in visual components.

## Local development

1. `npm install`
2. Copy `.env.example` to `.env.local` and set a random `AUTH_SECRET`. Keep `AUTH_MODE=local` for development-only registration and login.
3. `npm run dev`; open the app's `/es`, `/en`, or `/pt-BR` route and create a local account. Accounts and password hashes live only in process memory and disappear when the server restarts.
4. For real sandbox checkout, set `STRIPE_SECRET_KEY=sk_test_...` and `STRIPE_WEBHOOK_SECRET=whsec_...`; forward signed Stripe `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `invoice.payment_failed` and `customer.subscription.deleted` events to `/api/v1/webhooks/stripe`. Return from Checkout does **not** activate an order. A verified event and a fetched, paid, complete Stripe session do.

No Stripe key means the catalog, quotes, orders and empty billing view work, but checkout returns `PAYMENTS_UNAVAILABLE` (503). No fake payments are offered. Mixed weekly and monthly recurring items are represented as separate subscription items; Stripe handles the first invoice. The quote's `dueNow` is an indicative sum of listed line prices, not a guarantee of the final Stripe invoice (tax/proration not included).

## Authentication and deployment

Auth.js uses Microsoft Entra ID unless `AUTH_MODE=local` is set in a non-production environment. Local mode exposes registration/login with per-user salted password hashes in volatile process memory; it never uses or reveals a shared access key. For Entra configure `AUTH_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`, and the tenant-specific `AUTH_MICROSOFT_ENTRA_ID_ISSUER`. Register the callback `/api/auth/callback/microsoft-entra-id` at your deployment origin. Tenant and account IDs come from validated identity claims, never the client. Local auth is blocked in production. No wildcard/multitenant Entra issuer is recommended.

**Production is deliberately blocked by default.** For a review deployment only, set `PERXIA_DEMO_MODE=true` together with `AUTH_MODE=local` and `AUTH_SECRET`: it enables the volatile in-memory catalog, local registration/login and checkout demonstration. Quotes, accounts, orders and webhook deduplication can disappear on restart; demo mode must never process real money. Implement a durable transactional `CheckoutRepository` and use a production catalog/configuration source before enabling real production use. Event reservation, order mutation and deduplication must be atomic in the DB. Stripe test credentials are the only payment mode currently supported; live mode requires a separate approved integration.

## Contracts and verification

`GET /api/v1/openapi` serves OpenAPI 3.1 for authorized users. All app API endpoints except the Stripe webhook require a signed Auth.js session. State-changing browser requests also require a matching `Origin`; webhook verification instead uses raw body and `Stripe-Signature`. All money is integer USD cents. Quotes expire after 15 minutes. Fetch the order status again after returning from Stripe; only webhook-confirmed status is authoritative.

Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`. `npm run test:e2e` expects a running app at `E2E_BASE_URL` (default localhost:3000); authenticated E2E scenarios require explicit `AUTH_MODE=local` and `LOCAL_DEV_ACCESS_KEY`, while provider success is skipped without Stripe sandbox credentials. Run E2E in a separate terminal against `npm run dev`.
