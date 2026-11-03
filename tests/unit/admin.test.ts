import { expect, it } from "vitest";
import {
  settingsSchema,
  serviceSchema,
  bookingPatchSchema,
} from "@/lib/validation";
import { defaultSettings } from "@/lib/defaults";
it("rejects executable image and social URLs", () => {
  expect(
    settingsSchema.safeParse({
      ...defaultSettings,
      heroImage: "javascript:alert(1)",
    }).success,
  ).toBe(false);
  expect(
    settingsSchema.safeParse({
      ...defaultSettings,
      instagram: "javascript:alert(1)",
    }).success,
  ).toBe(false);
});
it("rejects invalid durations and mutable booking prices", () => {
  expect(
    serviceSchema.safeParse({
      name: "Corte",
      description: "",
      priceCents: 100,
      durationMinutes: 0,
      imageUrl: null,
      active: true,
      sortOrder: 0,
    }).success,
  ).toBe(false);
  expect(bookingPatchSchema.safeParse({ priceCents: 1 }).success).toBe(false);
});
