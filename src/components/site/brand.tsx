export default function Brand({
  small = false,
  logoUrl = "",
}: {
  small?: boolean;
  logoUrl?: string;
}) {
  return (
    <a
      href="/"
      className={`brand brand-with-image ${small ? "brand-small" : ""}`}
      aria-label="Imperial Barber — início"
    >
      <img
        src={logoUrl || "/images/imperial-j-crest.png"}
        alt="Imperial Barber — brasão com J e coroa"
        width={1254}
        height={1254}
      />
    </a>
  );
}
