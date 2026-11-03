import { it, expect } from "vitest";
import { validateUpload } from "@/lib/uploads";
it("rejects scripts and files disguised as photos", () => {
  expect(() =>
    validateUpload(
      new TextEncoder().encode("<html><script>alert(1)</script>"),
      "image/png",
    ),
  ).toThrow();
});
it("rejects an oversized photo", () => {
  expect(() => validateUpload(new Uint8Array(5242881), "image/jpeg")).toThrow();
});
it("accepts PNG signature but rejects mismatched claimed type", () => {
  const b = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  expect(validateUpload(b, "image/png").extension).toBe("png");
  expect(() => validateUpload(b, "image/jpeg")).toThrow();
});
