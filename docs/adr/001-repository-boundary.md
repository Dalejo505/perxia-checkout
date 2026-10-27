# ADR 001 — Transactional persistence boundary

Status: accepted for development; production adapter pending.

Checkout owns tenant-scoped catalog, quotes, orders and Stripe event identifiers through `CheckoutRepository`. The local process keeps data only in memory to allow testing without DB credentials. Production calls fail closed, including server-rendered checkout pages. No production DB is simulated or silently substituted.

Before production, implement a persistent repository with atomic unique event ID insertion and order status transition in the same transaction, durable quotes with expiry, catalog and price-version storage, auditability, and concurrency-safe order creation/session assignment. Use Stripe idempotency keys for checkout initiation. In-memory single-process event deduplication is not a production guarantee.
