import { test, expect } from "@playwright/test";
test("portfolio shows original work in the correct filters and keeps booking accessible", async ({
  page,
}) => {
  await page.goto("/");
  const gallery = page.getByRole("region", { name: "Nossos Trabalhos" });
  await expect(gallery).toBeVisible();
  await expect(gallery.locator(".work-card")).toHaveCount(3);
  await expect
    .poll(() =>
      gallery
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.every(
            (img) =>
              img instanceof HTMLImageElement &&
              img.complete &&
              img.naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await gallery.screenshot({ path: "test-results/galeria-desktop.png" });
  for (const [name, count] of [
    ["Todos", 3],
    ["Cortes", 2],
    ["Cortes com Desenho", 1],
    ["Luzes e Platinados", 1],
  ] as const) {
    const filter = gallery.getByRole("button", { name, exact: true });
    await filter.click();
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    await expect(gallery.locator(".work-card")).toHaveCount(count);
  }
  const opener = gallery.getByRole("button", {
    name: "Ampliar Luzes platinadas",
  });
  await opener.click();
  const photoDialog = page.getByRole("dialog", { name: "Luzes platinadas" });
  await expect(photoDialog).toBeVisible();
  await expect(photoDialog.locator("img")).toHaveAttribute(
    "src",
    "/images/barbearia/luzes-platinadas.webp",
  );
  await page.keyboard.press("Escape");
  await expect(photoDialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(
    await page.evaluate(() =>
      [...document.images]
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src),
    ),
  ).toEqual([]);
  expect(await page.locator("main").innerHTML()).not.toMatch(
    /\/images\/(hero|services)\.jpg/,
  );
  await gallery
    .getByRole("button", { name: "Agendar meu horário", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Fechar agendamento" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await gallery.getByRole("button", { name: "Todos", exact: true }).click();
  await gallery.screenshot({ path: "test-results/galeria-mobile.png" });
  await gallery
    .getByRole("button", { name: "Ampliar Corte com desenho" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Corte com desenho" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar fotografia" }).click();
  await expect(
    gallery.getByRole("button", { name: "Luzes e Platinados", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("public site, mobile navigation and honest setup state", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Mais que um corte/i }),
  ).toBeVisible();
  await expect(
    page
      .locator("#inicio")
      .getByRole("link", { name: "Nossos serviços", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Agendar online", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText(/agendamento ainda não está disponível/i),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar agendamento" }).click();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Serviços", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/imperial-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/imperial-desktop.png",
    fullPage: true,
  });
});
test("private admin rejects unauthenticated access", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/admin\/login/);
  const r = await request.get("/api/admin/bookings");
  expect(r.status()).toBe(401);
});
