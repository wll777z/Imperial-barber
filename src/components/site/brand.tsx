import { Crown, Scissors } from "lucide-react";
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
      className={`brand ${small ? "brand-small" : ""}`}
      aria-label="Imperial Barber — início"
    >
      {logoUrl ? (
        <img src={logoUrl} alt="Imperial Barber" />
      ) : (
        <>
          <Crown strokeWidth={1.2} />
          <strong>IMPERIAL</strong>
          <span>— B A R B E R —</span>
          <Scissors className="brand-scissors" strokeWidth={1} />
        </>
      )}
    </a>
  );
}
