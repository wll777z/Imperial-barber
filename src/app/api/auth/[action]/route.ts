import { z } from "zod";
import { sessionClient } from "@/lib/supabase/server";
import { ok, errorResponse, readJson, sameOrigin, ApiError } from "@/lib/api";
import { limitRequest } from "@/lib/booking-service";
export async function POST(
  r: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    sameOrigin(r);
    const { action } = await params;
    const db = await sessionClient();
    if (!db) throw new ApiError("UNAVAILABLE");
    if (action === "logout") {
      const { error } = await db.auth.signOut();
      if (error) throw error;
      return ok(null);
    }
    if (action !== "login") throw new ApiError("NOT_FOUND");
    const body = z
      .object({ email: z.email(), password: z.string().min(8).max(200) })
      .strict()
      .parse(await readJson(r));
    await limitRequest(r, "login", 10);
    const { data, error } = await db.auth.signInWithPassword(body);
    if (error || !data.user) throw new ApiError("UNAUTHORIZED");
    const admin = await db.rpc("is_admin");
    if (!admin.data) {
      await db.auth.signOut();
      throw new ApiError("UNAUTHORIZED", 403);
    }
    return ok(null);
  } catch (e) {
    return errorResponse(e);
  }
}
