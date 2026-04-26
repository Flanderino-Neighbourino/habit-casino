import type { ClipColor } from "../types";
import { clipColorHex } from "../lib/util";

export function ClipDot({
  color,
  size = 14,
  className = "",
}: {
  color: ClipColor;
  size?: number;
  className?: string;
}) {
  const isGold = color === "gold";
  return (
    <span
      className={[
        "inline-block rounded-full",
        isGold ? "animate-sparkle gold-glow" : "",
        className,
      ].join(" ")}
      style={{
        width: size,
        height: size,
        backgroundColor: clipColorHex(color),
      }}
      aria-label={`${color} clip`}
    />
  );
}
