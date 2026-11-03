import { describe, it, expect } from "vitest";
import { formatMoney, formatAppointment } from "@/lib/format";
import { bookingSchema } from "@/lib/validation";
const valid = {
  serviceId: "11111111-1111-4111-8111-111111111111",
  professionalId: null,
  startsAt: "2026-11-04T15:00:00-03:00",
  customer: { name: "João Silva", phone: "11999998888" },
  consent: true,
};
describe("public booking boundary", () => {
  it("formats cents as BRL", () =>
    expect(formatMoney(4000).replace(/\s/g, " ")).toBe("R$ 40,00"));
  it("uses Sao Paulo on the previous UTC day", () =>
    expect(formatAppointment("2026-11-04T00:00:00Z")).toContain(
      "03/11/2026, 21:00",
    ));
  it("accepts a valid reservation without email", () =>
    expect(bookingSchema.safeParse(valid).success).toBe(true));
  for (const [label, patch] of Object.entries({
    consent: { consent: false },
    localTime: { startsAt: "2026-11-04T15:00:00" },
    price: { priceCents: 1 },
    status: { status: "completed" },
    name: { customer: { name: "", phone: "11999998888" } },
    phone: { customer: { name: "João", phone: "abc" } },
  }))
    it(`rejects ${label}`, () =>
      expect(bookingSchema.safeParse({ ...valid, ...patch }).success).toBe(
        false,
      ));
});
