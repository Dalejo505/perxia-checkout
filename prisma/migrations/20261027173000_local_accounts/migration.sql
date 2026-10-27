CREATE TABLE "LocalAccount" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LocalAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocalAccount_tenantId_key" ON "LocalAccount"("tenantId");
CREATE UNIQUE INDEX "LocalAccount_email_key" ON "LocalAccount"("email");
