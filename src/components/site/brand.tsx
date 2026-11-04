export default function Brand({
  small = false,
  logoUrl = "",
}: {
  small?: boolean;
  logoUrl?: string;
}) {
  const official =
    !logoUrl ||
    ["/images/imperial-j-crest.png", "/images/barbearia/IMG_3863.png"].includes(
      logoUrl,
    );
  return (
    <a
      href="/"
      className={`brand brand-with-image ${official ? "brand-official" : ""} ${small ? "brand-small" : ""}`}
      aria-label="Imperial Barber — início"
    >
      <span className="brand-logo-frame">
        <img
          src={official ? "/images/barbearia/IMG_3863.png" : logoUrl}
          alt="Imperial Barber"
          width={1254}
          height={1254}
        />
      </span>
    </a>
  );
}
