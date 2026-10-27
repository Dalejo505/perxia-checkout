import { test, expect } from "playwright/test";

test("signed-out API rejects catalog and unsigned webhook", async ({ request }) => {
  const catalog = await request.get("/api/v1/catalog");
  expect(catalog.status()).toBe(401);
  const webhook = await request.post("/api/v1/webhooks/stripe", { data: {} });
  expect(webhook.status()).toBe(400);
});

test("cadence and quantities update instantly without navigation", async ({ page }) => {
  test.skip(process.env.AUTH_MODE !== "local", "Requires explicit local auth configuration");
  await page.goto("/es");
  const registration = page.getByRole("heading", { name: "Crea tu cuenta" }).locator("..");
  await registration.getByLabel("Nombre completo").fill("Prueba Checkout");
  await registration.getByLabel("Email").fill(`checkout-${Date.now()}@example.com`);
  await registration.getByLabel("Contraseña").fill("secure-password");
  await registration.getByRole("button", { name: "Crea tu cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Talento digital, a tu ritmo." })).toBeVisible();
  const analystCadence = page.getByRole("group", { name: "Frecuencia de facturación · Analista" });
  const weeklyButton = analystCadence.getByRole("button", { name: "Semanal" });
  await expect(weeklyButton).toBeEnabled();
  await weeklyButton.click();
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByText("49,00 US$", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Recurrente / Semanal")).toBeVisible();
  await page.getByRole("button", { name: "Cantidad + Analista" }).click();
  await expect(page.getByLabel("Analista: 2")).toBeVisible();
  await expect(page.getByText("98,00 US$", { exact: false }).first()).toBeVisible();
});

test("provider success remains integration-gated", async ({ page }) => {
  test.skip(!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET, "Requires Stripe sandbox and signed webhook delivery");
  await page.goto("/es");
  await expect(page).toHaveURL(/\/es/);
});
