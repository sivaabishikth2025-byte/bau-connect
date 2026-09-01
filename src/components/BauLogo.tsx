type BauLogoSize = "nav" | "auth" | "landing" | "footer";
type BauLogoTone = "light" | "dark";

const SIZES: Record<BauLogoSize, { height: number; maxWidth: number }> = {
  nav: { height: 56, maxWidth: 320 },
  auth: { height: 104, maxWidth: 420 },
  landing: { height: 80, maxWidth: 380 },
  footer: { height: 68, maxWidth: 340 },
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
