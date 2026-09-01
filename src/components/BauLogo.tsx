type BauLogoSize = "nav" | "auth" | "landing" | "footer";
type BauLogoTone = "light" | "dark";

const SIZES: Record<BauLogoSize, { height: number; maxWidth: number }> = {
  nav: { height: 72, maxWidth: 400 },
  auth: { height: 132, maxWidth: 520 },
  landing: { height: 120, maxWidth: 520 },
  footer: { height: 88, maxWidth: 420 },
};

interface BauLogoProps {
  size?: BauLogoSize;
  /** Use "light" on white backgrounds (navy logo). Use "dark" on navy backgrounds (white logo). */
  tone?: BauLogoTone;
  alt?: string;
  className?: string;
}

export default function BauLogo({
  size = "nav",
  tone = "light",
  alt = "Bay Atlantic University",
  className = "",
}: BauLogoProps) {
  const { height, maxWidth } = SIZES[size];
  const src = tone === "dark" ? "/bau-logo-dark.png" : "/bau-logo-light.png";

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain ${className}`}
      style={{ height, maxWidth, width: "auto" }}
    />
  );
}
