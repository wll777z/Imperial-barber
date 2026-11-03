import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { defaultSettings } from "../../src/lib/defaults";
process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url))
  throw Error("Live fixtures require local Supabase");
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const credentials = JSON.parse(
  readFileSync(".superpowers/local/admin.json", "utf8"),
);
const sid = randomUUID(),
  pid = randomUUID(),
  suffix = sid.slice(0, 5),
  serviceName = `Corte teste ${suffix}`;
const date = new Date(Date.now() + 2 * 86400000).toLocaleDateString("en-CA", {
  timeZone: "America/Sao_Paulo",
});
async function ensure(r: { error: unknown }) {
  if (r.error) throw r.error;
}
test.setTimeout(90000);
test.beforeAll(async () => {
  await ensure(await db.from("request_limits").delete().neq("key", ""));
  await ensure(
    await db.from("services").insert({
      id: sid,
      name: serviceName,
      description: "Serviço exclusivo de validação local",
      price_cents: 4000,
      duration_minutes: 30,
      image_url: "/images/services.jpg",
      sort_order: 100,
    }),
  );
  await ensure(
    await db.from("professionals").insert({
      id: pid,
      name: "Profissional de teste",
      specialty: "Validação local",
      image_url: "/images/hero.jpg",
    }),
  );
  await ensure(
    await db
      .from("professional_services")
      .insert({ professional_id: pid, service_id: sid }),
  );
  await ensure(
    await db.from("working_hours").insert(
      [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        professional_id: pid,
        weekday,
        opens: "09:00",
        closes: "20:00",
      })),
    ),
  );
  await ensure(
    await db
      .from("site_settings")
      .update({
        content: {
          ...defaultSettings,
          bookingEnabled: true,
          heroDescription:
            "Cuidado em cada detalhe. Ambiente de demonstração local.",
        },
      })
      .eq("id", true),
  );
});
test("customer books, sees persistence, reschedules and cancels", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Agendar online", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText(serviceName, { exact: true }).click();
  await dialog.getByRole("button", { name: "Próximo" }).click();
  await dialog.getByRole("button", { name: "Próximo" }).click();
  await dialog.getByLabel("Escolha a data").fill(date);
  await dialog.locator(".slot").first().click();
  await dialog.getByLabel("Seu nome").fill("Cliente validação local");
  await dialog.getByLabel("Telefone / WhatsApp").fill("11999998888");
  await dialog.getByRole("button", { name: "Próximo" }).click();
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Seu momento está reservado." }),
  ).toBeVisible();
  const persisted = await db.from("bookings").select("*").eq("service_id", sid);
  expect(persisted.error).toBeNull();
  expect(persisted.data).toHaveLength(1);
  expect(persisted.data![0].price_cents).toBe(4000);
  await dialog.getByRole("link", { name: "Acompanhar minha reserva" }).click();
  await expect(page.getByText("Confirmado", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remarcar horário" }).click();
  await page.getByLabel("Nova data").fill(date);
  await page.locator(".slot").nth(1).click();
  await page.getByRole("button", { name: "Confirmar remarcação" }).click();
  await expect(page.getByText("Seu horário foi atualizado.")).toBeVisible();
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Cancelar reserva" }).click();
  await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();
});
test("concurrent HTTP bookings occupy each interval only once", async ({
  request,
}) => {
  const slots = await request.get(
    `/api/slots?serviceId=${sid}&professionalId=${pid}&date=${date}`,
  );
  const list = (await slots.json()).data;
  expect(list.length).toBeGreaterThan(0);
  const body = {
    serviceId: sid,
    professionalId: pid,
    startsAt: list[0].startsAt,
    customer: { name: "Concorrência local", phone: "11988887777" },
    consent: true,
  };
  const r = await Promise.all([
    request.post("/api/bookings", {
      headers: { origin: "http://127.0.0.1:3000" },
      data: body,
    }),
    request.post("/api/bookings", {
      headers: { origin: "http://127.0.0.1:3000" },
      data: body,
    }),
  ]);
  expect(r.map((x) => x.status()).sort()).toEqual([200, 409]);
});
test("admin login, editable content and prices, uploads and schedule conflicts", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(credentials.email);
  await page.getByLabel("Senha", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Visão geral" }),
  ).toBeVisible();
  await expect(page.getByText("Agendamentos hoje", {exact:true})).toBeVisible();
  const manual = await page.request.post("/api/admin/booking-create", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {
      serviceId: sid,
      professionalId: pid,
      startsAt: date + "T12:00:00-03:00",
      customer: { name: "Manual teste", phone: "11977776666" },
      consent: true,
    },
  });
  expect(manual.status()).toBe(200);
  await page.screenshot({
    path: "test-results/imperial-admin.png",
    fullPage: true,
  });
  await page.goto("/admin/servicos");
  await page
    .locator("article")
    .filter({ hasText: serviceName })
    .getByRole("button", { name: "Editar detalhes" })
    .click();
  const editor = page.getByRole("dialog");
  await editor.getByLabel("Preço (R$)").fill("55");
  await editor.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(editor).not.toBeVisible();
  const existing = await db
    .from("bookings")
    .select("price_cents")
    .eq("service_id", sid);
  expect(existing.data!.every((b) => b.price_cents === 4000)).toBe(true);
  await page.goto("/admin/conteudo");
  await page
    .getByLabel("Título principal")
    .fill("Seu estilo merece um cuidado Imperial.");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toContainText("Alterações salvas");
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Seu estilo merece um cuidado Imperial.",
    }),
  ).toBeVisible();
  const forged = await page.request.post("/api/admin/upload", {
    headers: { origin: "http://127.0.0.1:3000" },
    multipart: {
      file: {
        name: "photo.png",
        mimeType: "image/png",
        buffer: Buffer.from("<html><script>unsafe</script>"),
      },
    },
  });
  expect(forged.status()).toBe(400);
  const upload = await page.request.post("/api/admin/upload", {
    headers: { origin: "http://127.0.0.1:3000" },
    multipart: {
      file: {
        name: "photo.jpg",
        mimeType: "image/jpeg",
        buffer: readFileSync("public/images/hero.jpg"),
      },
    },
  });
  expect(upload.status()).toBe(200);
  const image = (await upload.json()).data.url;
  expect((await page.request.get(image)).status()).toBe(200);
  const conflict = await page.request.post("/api/admin/schedule", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: { professionalId: pid, hours: [], blocks: [] },
  });
  expect(conflict.status()).toBe(409);
  for (const section of [
    "clientes",
    "equipe",
    "disponibilidade",
    "configuracoes",
    "agenda",
  ]) {
    await page.goto("/admin/" + section);
    await expect(page.locator(".admin-page-title h1")).toBeVisible();
  }
  await page.goto("/admin/equipe");
  await page.getByRole("button", { name: "Adicionar profissional" }).click();
  const proEditor = page.getByRole("dialog");
  await proEditor
    .getByLabel("Nome", { exact: true })
    .fill(`Novo profissional ${suffix}`);
  await proEditor.getByLabel("Especialidade").fill("Validação do painel");
  await proEditor.getByLabel(serviceName, { exact: true }).check();
  await proEditor.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(proEditor).not.toBeVisible();
  const allPros = await page.request.get("/api/admin/professionals");
  const newPro = (await allPros.json()).data.find(
    (p: { name: string }) => p.name === `Novo profissional ${suffix}`,
  );
  expect(newPro.serviceIds).toContain(sid);
  await page.goto("/admin/disponibilidade");
  await page
    .getByRole("combobox", { name: "Profissional", exact: true })
    .selectOption(newPro.id);
  await page
    .getByRole("button", { name: "Preencher segunda a sábado, 09h–20h" })
    .click();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Disponibilidade atualizada.", {exact:true})).toBeVisible();
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/admin\/login/);
  expect((await page.request.get("/api/admin/bookings")).status()).toBe(401);
});

test("ordinary Auth user cannot enter panel or read private data", async ({
  request,
}) => {
  const email = "ordinary-" + randomUUID() + "@imperial.local",
    password = randomUUID() + "Aa1";
  const u = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(u.error).toBeNull();
  try {
    const login = await request.post("/api/auth/login", {
      headers: { origin: "http://127.0.0.1:3000" },
      data: { email, password },
    });
    expect(login.status()).toBe(403);
    expect((await request.get("/api/admin/bookings")).status()).toBe(401);
    const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    for (const table of ["bookings", "customers", "admin_users"]) {
      const r = await anon.from(table).select("*");
      expect(r.error).toBeNull();
      expect(r.data).toEqual([]);
    }
  } finally {
    if (u.data.user) await db.auth.admin.deleteUser(u.data.user.id);
  }
});
