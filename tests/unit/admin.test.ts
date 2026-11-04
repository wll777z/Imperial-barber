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

it("accepts only the configured local Storage endpoint for uploaded local images", async () => {
  const { vi } = await import("vitest");
  const { imageUrlSchema } = await import("@/lib/validation");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  try {
    expect(
      imageUrlSchema.safeParse(
        "http://127.0.0.1:54321/storage/v1/object/public/site-images/photo.jpg",
      ).success,
    ).toBe(true);
    expect(
      imageUrlSchema.safeParse("http://127.0.0.1:9999/other.jpg").success,
    ).toBe(false);
    expect(imageUrlSchema.safeParse("http://evil.test/photo.jpg").success).toBe(
      false,
    );
  } finally {
    vi.unstubAllEnvs();
  }
});
