import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicConfig } from "./supabase/server";
import { defaultSettings, unconfiguredContent } from "./defaults";
import type { PublicContent, Service, Professional } from "./domain";
export function mapService(r: Record<string, unknown>): Service {
  return {
    id: String(r.id),
    name: String(r.name),
    description: String(r.description || ""),
    priceCents: Number(r.price_cents),
    durationMinutes: Number(r.duration_minutes),
    imageUrl: r.image_url ? String(r.image_url) : null,
    active: !!r.active,
    sortOrder: Number(r.sort_order),
  };
}
export async function getPublicContent(): Promise<PublicContent> {
  const { url, key } = publicConfig();
  if (!url || !key) return unconfiguredContent;
  try {
    const db = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
          }),
      },
    });
    const [settings, services, pros, links] = await Promise.all([
      db.from("site_settings").select("content").single(),
      db.from("services").select("*").eq("active", true).order("sort_order"),
      db
        .from("professionals")
        .select("*")
        .eq("active", true)
        .order("sort_order"),
      db.from("professional_services").select("*"),
    ]);
    if ([settings, services, pros, links].some((r) => r.error))
      return { ...unconfiguredContent, services: [] };
    return {
      configured: true,
      demo: ["127.0.0.1", "localhost"].includes(new URL(url).hostname),
      settings: { ...defaultSettings, ...settings.data?.content },
      services: (services.data || []).map(mapService),
      professionals: (pros.data || []).map((p): Professional => ({
        id: p.id,
        name: p.name,
        specialty: p.specialty,
        imageUrl: p.image_url,
        active: p.active,
        sortOrder: p.sort_order,
        serviceIds: (links.data || [])
          .filter((l) => l.professional_id === p.id)
          .map((l) => l.service_id),
      })),
    };
  } catch {
    return { ...unconfiguredContent, services: [] };
  }
}
