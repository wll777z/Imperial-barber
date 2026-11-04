import { describe, expect, it } from "vitest";
import { filterWorkPhotos, workPhotos } from "@/lib/portfolio";

const available = workPhotos;

describe("portfolio categories", () => {
  it("includes artistic cuts under Cortes without mixing in platinum work", () => {
    expect(
      filterWorkPhotos(available, "cortes").map((photo) => photo.sourceFile),
    ).toEqual(["IMG_3860.png", "IMG_3861.png"]);
    expect(
      filterWorkPhotos(available, "desenhos").map((photo) => photo.sourceFile),
    ).toEqual(["IMG_3861.png"]);
    expect(
      filterWorkPhotos(available, "luzes").map((photo) => photo.sourceFile),
    ).toEqual(["IMG_3862.png"]);
  });

  it("does not render missing files or insert fallback photographs", () => {
    const missing = available.map((photo) => ({ ...photo, src: null }));
    expect(filterWorkPhotos(missing, "todos")).toEqual([]);
    expect(
      filterWorkPhotos([available[0], missing[1], missing[2]], "todos"),
    ).toEqual([available[0]]);
    expect(
      filterWorkPhotos([available[0], missing[1], missing[2]], "luzes"),
    ).toEqual([]);
  });
});
