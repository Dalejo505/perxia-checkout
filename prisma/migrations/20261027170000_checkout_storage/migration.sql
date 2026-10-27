CREATE TABLE "CheckoutQuote" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CheckoutQuote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CheckoutQuote_tenantId_expiresAt_idx" ON "CheckoutQuote"("tenantId", "expiresAt");

CREATE TABLE "CheckoutOrder" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "providerSessionId" TEXT,
  "providerCustomerId" TEXT,
  "providerSubscriptionId" TEXT,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CheckoutOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CheckoutOrder_providerSessionId_key" ON "CheckoutOrder"("providerSessionId");
CREATE INDEX "CheckoutOrder_tenantId_createdAt_idx" ON "CheckoutOrder"("tenantId", "createdAt");
CREATE INDEX "CheckoutOrder_providerSubscriptionId_idx" ON "CheckoutOrder"("providerSubscriptionId");

CREATE TABLE "StripeEvent" (
  "id" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);
