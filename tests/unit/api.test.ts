import { expect, it } from "vitest";
import { ApiError, errorResponse, sameOrigin } from "@/lib/api";
it("does not leak backend error details", async () => {
  const r = errorResponse(Error("database password: secret"));
  expect(r.status).toBe(503);
  expect(JSON.stringify(await r.json())).not.toContain("secret");
});
it("conflict remains retryable and distinct", () =>
  expect(errorResponse({ message: "CONFLICT" }).status).toBe(409));
it("rejects missing and cross-site origins", () => {
  expect(() =>
    sameOrigin(
      new Request("https://barber.test/api", {
        headers: { origin: "https://evil.test" },
      }),
    ),
  ).toThrow(ApiError);
  expect(() => sameOrigin(new Request("https://barber.test/api"))).toThrow(
    ApiError,
  );
  expect(() =>
    sameOrigin(
      new Request("https://barber.test/api", {
        headers: { origin: "https://barber.test" },
      }),
    ),
  ).not.toThrow();
});
it("accepts the original Host when Next rewrites the internal URL host", () => {
  expect(() =>
    sameOrigin(
      new Request("http://localhost:3000/api", {
        headers: { origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" },
      }),
    ),
  ).not.toThrow();
});
