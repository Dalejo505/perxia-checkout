const error = { description: "Error", content: { "application/json": { schema: { type: "object", properties: { error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" } } } } } } } };
const response = (description: string, schema: object) => ({ description, content: { "application/json": { schema } } });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const security = [{ authSession: [] }];

export const spec = {
  openapi: "3.1.0",
  info: { title: "PERXIA Checkout API", version: "1.0.0", description: "Development-only server-backed checkout. Prices are non-commercial fixtures. Tenant identity is always derived from the signed Auth.js session." },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: { authSession: { type: "apiKey", in: "cookie", name: "authjs.session-token", description: "Auth.js session cookie; name may differ with secure cookies" } },
    schemas: {
      Selection: { type: "object", required: ["priceId", "quantity"], properties: { priceId: { type: "string" }, quantity: { type: "integer", minimum: 1, maximum: 100 } } },
      Cart: { type: "object", required: ["workers"], properties: { workers: { type: "array", minItems: 1, items: ref("Selection") }, credits: { type: "array", items: ref("Selection") } } },
      Price: { type: "object", properties: { id: { type: "string" }, version: { type: "integer" }, amount: { type: "integer", description: "USD cents" }, currency: { const: "usd" }, cadence: { enum: ["week", "month", "once"] }, active: { type: "boolean" } } },
      Product: { type: "object", properties: { id: { type: "string" }, kind: { enum: ["worker", "credit"] }, name: { type: "object" }, description: { type: "object" }, prices: { type: "array", items: ref("Price") } } },
      Quote: { type: "object", properties: { id: { type: "string" }, tenantId: { type: "string" }, currency: { const: "usd" }, lines: { type: "array", items: { type: "object" } }, dueNow: { type: "integer" }, weekly: { type: "integer" }, monthly: { type: "integer" }, expiresAt: { type: "string", format: "date-time" } } },
      Order: { type: "object", properties: { id: { type: "string" }, tenantId: { type: "string" }, quote: ref("Quote"), status: { enum: ["pending", "checkout_open", "active", "payment_failed", "canceled"] }, providerSessionId: { type: "string" } } },
      Billing: { type: "object", properties: { orders: { type: "array", items: ref("Order") }, records: { type: "array", items: { type: "object" } } } },
    },
  },
  paths: {
    "/catalog": { get: { security, summary: "List active and versioned server catalog", responses: { "200": response("Catalog", { type: "object", properties: { products: { type: "array", items: ref("Product") }, commercial: { const: false } } }), "401": error, "503": error } } },
    "/quotes": { post: { security, summary: "Calculate and persist server-side quote", requestBody: { required: true, content: { "application/json": { schema: ref("Cart") } } }, responses: { "201": response("Quote", { type: "object", properties: { quote: ref("Quote") } }), "400": error, "401": error } } },
    "/orders": { get: { security, summary: "List tenant orders", responses: { "200": response("Orders", { type: "object", properties: { orders: { type: "array", items: ref("Order") } } }), "401": error } }, post: { security, summary: "Create order from unexpired quote", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["quoteId"], properties: { quoteId: { type: "string", format: "uuid" } } } } } }, responses: { "201": response("Order", { type: "object", properties: { order: ref("Order") } }), "409": error } } },
    "/orders/{id}": { get: { security, summary: "Read tenant order", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { "200": response("Order", { type: "object", properties: { order: ref("Order") } }), "404": error } } },
    "/orders/{id}/checkout": { post: { security, summary: "Start Stripe test Checkout; no payment success is inferred from redirect", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { "200": response("Stripe URL", { type: "object", properties: { url: { type: "string", format: "uri" } } }), "409": error, "503": error } } },
    "/billing": { get: { security, summary: "Read tenant billing from Stripe", responses: { "200": response("Billing", ref("Billing")), "503": error } } },
    "/billing/portal": { post: { security, summary: "Open Stripe billing portal for tenant-owned customer", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["customerId"], properties: { customerId: { type: "string" } } } } } }, responses: { "200": response("Portal URL", { type: "object", properties: { url: { type: "string", format: "uri" } } }), "404": error } } },
    "/webhooks/stripe": { post: { summary: "Verify raw Stripe-Signature and idempotently apply confirmed event", parameters: [{ in: "header", name: "stripe-signature", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } }, responses: { "200": response("Receipt", { type: "object", properties: { received: { type: "boolean" } } }), "400": error } } },
    "/openapi": { get: { security, summary: "This specification", responses: { "200": response("OpenAPI", { type: "object" }) } } },
  },
};
