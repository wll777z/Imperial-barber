import { test, expect } from "@playwright/test";
test("portfolio filters keep missing photos empty and booking accessible", async ({
  page,
}) => {
  await page.goto("/");
  const gallery = page.getByRole("region", { name: "Nossos Trabalhos" });
  await expect(gallery).toBeVisible();
  for (const name of [
    "Todos",
    "Cortes",
    "Cortes com Desenho",
    "Luzes e Platinados",
  ]) {
    const filter = gallery.getByRole("button", { name, exact: true });
    await filter.click();
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    await expect(
      gallery.getByText("Novas fotografias em breve."),
    ).toBeVisible();
    await expect(gallery.locator("img")).toHaveCount(0);
  }
  await gallery
    .getByRole("button", { name: "Agendar meu horário", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Fechar agendamento" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
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
