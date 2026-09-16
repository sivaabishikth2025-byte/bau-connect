type BauLogoSize = "nav" | "auth" | "landing" | "footer";
type BauLogoTone = "light" | "dark";

const SIZES: Record<BauLogoSize, { height: number; maxWidth: number; mobileHeight: number; mobileMaxWidth: number }> = {
  nav: { height: 64, maxWidth: 300, mobileHeight: 44, mobileMaxWidth: 200 },
  auth: { height: 100, maxWidth: 280, mobileHeight: 64, mobileMaxWidth: 220 },
  landing: { height: 80, maxWidth: 340, mobileHeight: 44, mobileMaxWidth: 180 },
  footer: { height: 88, maxWidth: 420, mobileHeight: 56, mobileMaxWidth: 260 },
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
  const { height, maxWidth, mobileHeight, mobileMaxWidth } = SIZES[size];
  const src = tone === "dark" ? "/bau-logo-dark.png" : "/bau-logo-light.png";

  return (
    <img
      src={src}
      alt={alt}
      className={`block object-contain object-left bau-logo bau-logo-${size} ${className}`}
      style={{
        height,
        maxHeight: height,
        width: "auto",
        maxWidth: `min(100%, ${maxWidth}px)`,
        ["--logo-h" as string]: `${height}px`,
        ["--logo-mw" as string]: `${maxWidth}px`,
        ["--logo-mh" as string]: `${mobileHeight}px`,
        ["--logo-mmw" as string]: `${mobileMaxWidth}px`,
      }}
    />
  );
}
