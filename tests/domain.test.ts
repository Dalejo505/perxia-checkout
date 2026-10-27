import { describe, expect, it } from "vitest";
import { cartSchema, computeQuote } from "@/lib/domain";
import { developmentCatalog } from "@/lib/fixture";

describe("server quote", () => {
  it("sums versioned recurring and one-time items independently", () => {
    const quote = computeQuote(developmentCatalog, { workers: [{ priceId: "analyst-month-v1", quantity: 2 }, { priceId: "builder-week-v1", quantity: 1 }], credits: [{ priceId: "credit-100-v1", quantity: 3 }] }, "tenant");
    expect(quote.monthly).toBe(35800);
    expect(quote.weekly).toBe(7900);
    expect(quote.dueNow).toBe(51200);
    expect(quote.lines[0].priceVersion).toBe(1);
  });
  it("refuses mismatched or duplicate prices", () => {
    expect(() => computeQuote(developmentCatalog, { workers: [{ priceId: "credit-100-v1", quantity: 1 }], credits: [] }, "tenant")).toThrow();
    expect(() => computeQuote(developmentCatalog, { workers: [{ priceId: "analyst-month-v1", quantity: 1 }, { priceId: "analyst-month-v1", quantity: 1 }], credits: [] }, "tenant")).toThrow();
  });
  it("rejects invalid quantities and empty worker carts", () => {
    expect(cartSchema.safeParse({ workers: [], credits: [] }).success).toBe(false);
    expect(cartSchema.safeParse({ workers: [{ priceId: "analyst-month-v1", quantity: 0 }] }).success).toBe(false);
  });
});
