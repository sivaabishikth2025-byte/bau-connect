type BauLogoSize = "nav" | "auth" | "landing" | "footer";

const SIZES: Record<BauLogoSize, { height: number; maxWidth: number }> = {
  nav: { height: 56, maxWidth: 320 },
  auth: { height: 104, maxWidth: 420 },
  landing: { height: 80, maxWidth: 380 },
  footer: { height: 68, maxWidth: 340 },
};

interface BauLogoProps {
  size?: BauLogoSize;
  alt?: string;
  className?: string;
}

export default function BauLogo({
  size = "nav",
  alt = "Bay Atlantic University",
  className = "",
}: BauLogoProps) {
  const { height, maxWidth } = SIZES[size];
  return (
    <img
      src="/bau-logo.png"
      alt={alt}
      className={`object-contain ${className}`}
      style={{ height, maxWidth, width: "auto" }}
    />
  );
}
