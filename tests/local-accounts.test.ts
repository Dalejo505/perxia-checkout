import { describe, expect, it } from "vitest";
import { authorizeLocalAccount } from "@/lib/local-accounts";

describe("local accounts", () => {
  it("registers and authenticates an isolated development account", async () => {
    process.env.AUTH_MODE = "local";
    const email = `person-${crypto.randomUUID()}@example.com`;
    const registered = await authorizeLocalAccount({ intent: "register", name: "Test Person", email, password: "secure-password" });
    expect(registered?.email).toBe(email);
    expect(registered?.tenantId).toContain("local-");
    const authenticated = await authorizeLocalAccount({ intent: "login", email, password: "secure-password" });
    expect(authenticated?.id).toBe(registered?.id);
  });

  it("rejects duplicate registration and invalid credentials", async () => {
    process.env.AUTH_MODE = "local";
    const email = `duplicate-${crypto.randomUUID()}@example.com`;
    await authorizeLocalAccount({ intent: "register", name: "Test Person", email, password: "secure-password" });
    await expect(authorizeLocalAccount({ intent: "register", name: "Other Person", email, password: "secure-password" })).resolves.toBeNull();
    await expect(authorizeLocalAccount({ intent: "login", email, password: "wrong-password" })).resolves.toBeNull();
  });
});
