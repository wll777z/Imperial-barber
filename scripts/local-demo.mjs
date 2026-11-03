// Optional LOCAL sample catalog. Never runs automatically during production setup.
import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url || ""))
  throw Error("Demo is restricted to local Supabase");
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
async function check(r) {
  if (r.error) throw r.error;
  return r.data;
}
// Archive only explicitly named fixtures from this project's live test suite.
await check(
  await db
    .from("services")
    .update({ active: false })
    .like("name", "Corte teste %"),
);
await check(
  await db
    .from("professionals")
    .update({ active: false })
    .or("name.eq.Profissional de teste,name.like.Novo profissional%"),
);
const rows = [
  [
    "Corte masculino",
    "Do clássico ao moderno. Um corte com a sua assinatura.",
    4000,
    30,
  ],
  ["Barba", "Desenho preciso e acabamento impecável.", 3000, 20],
  ["Corte + barba", "O cuidado completo para renovar o seu visual.", 6000, 50],
  ["Corte infantil", "Cuidado e estilo para os pequenos.", 3500, 30],
  ["Tratamento capilar", "Um ritual de cuidado para seus fios.", 5000, 40],
].map(([name, description, price_cents, duration_minutes], i) => ({
  id: `00000000-0000-4000-8000-00000000000${i + 1}`,
  name,
  description,
  price_cents,
  duration_minutes,
  image_url: "/images/services.jpg",
  active: true,
  sort_order: i,
}));
await check(await db.from("services").upsert(rows));
const pid = "00000000-0000-4000-8000-000000000100";
await check(
  await db
    .from("professionals")
    .upsert({
      id: pid,
      name: "Profissional de demonstração",
      specialty: "Agenda de exemplo · não representa equipe real",
      image_url: "/images/hero.jpg",
      active: true,
      sort_order: 0,
    }),
);
await check(
  await db
    .from("professional_services")
    .upsert(rows.map((s) => ({ professional_id: pid, service_id: s.id }))),
);
const existing = await check(
  await db.from("working_hours").select("id").eq("professional_id", pid),
);
if (!existing.length)
  await check(
    await db
      .from("working_hours")
      .insert(
        [1, 2, 3, 4, 5, 6].map((weekday) => ({
          professional_id: pid,
          weekday,
          opens: "09:00",
          closes: "20:00",
        })),
      ),
  );
const r = await check(
  await db.from("site_settings").select("content").single(),
);
await check(
  await db
    .from("site_settings")
    .update({
      content: {
        ...r.content,
        bookingEnabled: true,
        heroTitle: "Mais que um corte, um estilo Imperial.",
        heroDescription:
          "Cortes modernos, barba impecável e uma experiência à altura do seu estilo.",
      },
    })
    .eq("id", true),
);
console.log(
  "Local demonstration catalog configured. Test fixtures archived; history preserved. No production data changed.",
);
