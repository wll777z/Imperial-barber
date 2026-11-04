import { it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultSettings, unconfiguredContent } from "@/lib/defaults";
vi.mock("@/lib/content", () => ({
  getPublicContent: async () => ({
    ...unconfiguredContent,
    settings: {
      ...defaultSettings,
      bookingImage: "/images/custom-booking.jpg",
      teamIntroImage: "/images/custom-team.jpg",
      stepsTitle: "CUSTOM_STEPS_TITLE",
      steps: [
        { title: "CUSTOM_STEP", description: "CUSTOM_STEP_DESCRIPTION" },
        { title: "Two", description: "Second" },
        { title: "Three", description: "Third" },
      ],
    },
  }),
}));
import Home from "@/app/page";
it("renders configured booking/team photos and booking explanation content", async () => {
  const html = renderToStaticMarkup(await Home());
  expect(html.includes("/images/custom-booking.jpg")).toBe(true);
  expect(html.includes("/images/custom-team.jpg")).toBe(true);
  expect(html.includes("CUSTOM_STEPS_TITLE")).toBe(true);
  expect(html.includes("CUSTOM_STEP_DESCRIPTION")).toBe(true);
});
