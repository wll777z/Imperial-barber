import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiErrorCode } from "./domain";
const messages: Record<ApiErrorCode, string> = {
  VALIDATION: "Confira os campos informados.",
  CONFLICT: "Este horário conflita com outra reserva. Escolha outro horário.",
  UNAUTHORIZED: "Acesso não autorizado.",
  RATE_LIMITED: "Muitas tentativas. Aguarde e tente novamente.",
  UNAVAILABLE:
    "O serviço está temporariamente indisponível. Tente novamente mais tarde.",
  TOO_LATE: "A alteração está fora do prazo permitido.",
  NOT_FOUND: "Reserva ou recurso não encontrado.",
};
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public status?: number,
  ) {
    super(code);
  }
}
export function errorResponse(e: unknown) {
  const text =
    e instanceof Error
      ? e.message
      : typeof e === "object" && e && "message" in e
        ? String(e.message)
        : "";
  const code: ApiErrorCode =
    e instanceof ZodError
      ? "VALIDATION"
      : e instanceof ApiError
        ? e.code
        : (Object.keys(messages) as ApiErrorCode[]).find((c) =>
            text.startsWith(c),
          ) || "UNAVAILABLE";
  const status =
    e instanceof ApiError && e.status
      ? e.status
      : {
          VALIDATION: 400,
          CONFLICT: 409,
          UNAUTHORIZED: 401,
          RATE_LIMITED: 429,
          UNAVAILABLE: 503,
          TOO_LATE: 422,
          NOT_FOUND: 404,
        }[code];
  return NextResponse.json(
    { ok: false, error: { code, message: messages[code] } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export const ok = (data: unknown) =>
  NextResponse.json(
    { ok: true, data },
    { headers: { "Cache-Control": "no-store" } },
  );
export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError("VALIDATION");
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    new URL(origin).host !==
      (request.headers.get("host") || new URL(request.url).host)
  )
    throw new ApiError("UNAUTHORIZED", 403);
}
