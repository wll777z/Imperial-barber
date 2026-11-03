import { ok, errorResponse, readJson, sameOrigin } from "@/lib/api";
import { bookingSchema } from "@/lib/validation";
import { limitRequest, rpc, newToken, hashToken } from "@/lib/booking-service";
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const p = bookingSchema.parse(await readJson(r));
    await limitRequest(r, "create", 10);
    await limitRequest(r, "phone", 5, hashToken(p.customer.phone));
    const token = newToken();
    const b = await rpc("create_booking", {
      p_input: p,
      p_token_hash: hashToken(token),
    });
    return ok({ ...b, managementToken: token });
  } catch (e) {
    return errorResponse(e);
  }
}
