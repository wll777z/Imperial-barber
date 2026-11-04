import type { Service } from "./domain";

export const sitePhotos = {
  hero: "/images/barbearia/hero-degrade.webp",
  fade: "/images/barbearia/degrade-tradicional.webp",
  design: "/images/barbearia/corte-com-desenho.webp",
  platinum: "/images/barbearia/luzes-platinadas.webp",
};

// Remove only the old generated placeholders; preserve photos uploaded in the CMS.
export function publicPhoto(src: string | null | undefined): string | null {
  return src && !["/images/hero.jpg", "/images/services.jpg"].includes(src)
    ? src
    : null;
}

export function servicePhoto(
  service: Pick<Service, "name" | "imageUrl">,
): string | null {
  const custom = publicPhoto(service.imageUrl);
  if (custom) return custom;
  const name = service.name.toLocaleLowerCase("pt-BR").trim();
  // These clients illustrate haircut work, not beard services or staff portraits.
  if (name === "corte masculino") return sitePhotos.fade;
  return null;
}
