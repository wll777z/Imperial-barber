import "server-only";
import { sessionClient } from "./supabase/server";
import { ApiError } from "./api";
export async function requireAdmin() {
  const db = await sessionClient();
  if (!db) throw new ApiError("UNAUTHORIZED");
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new ApiError("UNAUTHORIZED");
  const r = await db.rpc("is_admin");
  if (r.error) throw new ApiError("UNAVAILABLE");
  if (!r.data) throw new ApiError("UNAUTHORIZED", 403);
  return { userId: user.id, email: user.email, db };
}
