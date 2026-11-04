export type WorkCategory = "cortes" | "desenhos" | "luzes";
export type WorkFilter = "todos" | WorkCategory;

export type WorkPhoto = {
  id: string;
  sourceFile: string;
  title: string;
  description: string;
  category: WorkCategory;
  src: string | null;
};

export const workFilters: { id: WorkFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "cortes", label: "Cortes" },
  { id: "desenhos", label: "Cortes com Desenho" },
  { id: "luzes", label: "Luzes e Platinados" },
];

// Fill src only after importing and cropping the corresponding original file.
// An unavailable photo must never fall back to generated or unrelated imagery.
export const workPhotos: WorkPhoto[] = [
  {
    id: "degrade-tradicional",
    sourceFile: "IMG_3860.png",
    title: "Degradê tradicional",
    description:
      "Corte masculino com degradê bem executado e acabamento natural.",
    category: "cortes",
    src: null,
  },
  {
    id: "corte-com-desenho",
    sourceFile: "IMG_3861.png",
    title: "Corte com desenho",
    description:
      "Corte masculino com degradê e desenhos artísticos nas laterais.",
    category: "desenhos",
    src: null,
  },
  {
    id: "luzes-platinadas",
    sourceFile: "IMG_3862.png",
    title: "Luzes platinadas",
    description:
      "Cabelo masculino cacheado com luzes platinadas e degradê nas laterais.",
    category: "luzes",
    src: null,
  },
];

export function filterWorkPhotos(photos: WorkPhoto[], filter: WorkFilter) {
  return photos.filter(
    (photo) =>
      photo.src &&
      (filter === "todos" ||
        photo.category === filter ||
        (filter === "cortes" && photo.category === "desenhos")),
  );
}
