# ADR 002 — Verified payments and server identity

Status: accepted.

The payment boundary is `PaymentGateway`; only a Stripe **test-mode** adapter exists. The browser never supplies amount, tenant or account. The server creates an expiring versioned USD-cent quote from its catalog; an order copies the quote snapshot. Checkout receives line-item prices from that snapshot. One-time credit packages are charged on the initial subscription invoice, recurring workers retain their own weekly/monthly intervals. Credit fulfillment outside this checkout application remains a separate integration.

Orders stay pending after a browser return. The webhook verifies Stripe's signature on the raw request body and fetches the session again; activation requires a matching order/tenant/session and paid, complete session with customer and subscription IDs. Event identifiers are deduplicated only in development memory. Subsequent failure/deletion events update order states. Stripe owns cards, invoices and subscription changes through its billing portal; no card data is stored locally.

Auth.js accepts tenant-scoped Microsoft Entra tokens or an explicit local-only credentials provider. Tenant/account identifiers are derived from signed server sessions. API routes scope every read/write by tenant. Local credentials are forbidden in production; the production repository block independently prevents deployment until durable persistence is implemented.
