type BauLogoSize = "nav" | "auth" | "landing" | "footer";

const SIZES: Record<BauLogoSize, { height: number; maxWidth: number }> = {
  nav: { height: 42, maxWidth: 190 },
  auth: { height: 72, maxWidth: 280 },
  landing: { height: 56, maxWidth: 220 },
  footer: { height: 48, maxWidth: 200 },
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
      className={`object-contain rounded-lg ${className}`}
      style={{ height, maxWidth, width: "auto" }}
    />
  );
}
