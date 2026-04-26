import { useEffect, useRef } from "react";

export type WheelSegment = "t1" | "t2" | "t3" | "bonus" | "jackpot";

const SEGMENT_ORDER: WheelSegment[] = [
  "t1",
  "t2",
  "t3",
  "bonus",
  "t1",
  "t2",
  "t3",
  "jackpot",
];

function segmentColors(dark: boolean) {
  const dim = (c: string, isActive: boolean) => (isActive ? c : dark ? "#1e293b" : "#cbd5e1");
  return {
    t1: (a: boolean) => dim("#fbbf24", a),
    t2: (a: boolean) => dim("#f97316", a),
    t3: (a: boolean) => dim("#ef4444", a),
    bonus: () => "#a855f7",
    jackpot: () => "#22c55e",
  };
}

export function Wheel({
  size = 360,
  rotation,
  active,
  highlightSegment,
}: {
  size?: number;
  rotation: number;
  active: ("t1" | "t2" | "t3")[];
  highlightSegment?: WheelSegment | null;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const colors = segmentColors(dark);

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    const segCount = SEGMENT_ORDER.length;
    const segAngle = (Math.PI * 2) / segCount;

    SEGMENT_ORDER.forEach((seg, i) => {
      const start = i * segAngle - Math.PI / 2 - segAngle / 2;
      const end = start + segAngle;

      let isActive = true;
      if (seg === "t2") isActive = active.includes("t2");
      else if (seg === "t3") isActive = active.includes("t3");

      const fill =
        seg === "bonus"
          ? colors.bonus()
          : seg === "jackpot"
          ? colors.jackpot()
          : seg === "t1"
          ? colors.t1(true)
          : seg === "t2"
          ? colors.t2(isActive)
          : colors.t3(isActive);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      if (seg === "jackpot" || seg === "bonus" || highlightSegment === seg) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#fde68a";
        ctx.stroke();
      }

      ctx.save();
      ctx.rotate(start + segAngle / 2);
      ctx.translate(radius * 0.62, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${size / 24}px ui-sans-serif, system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label =
        seg === "jackpot" ? "JACKPOT" : seg === "bonus" ? "BONUS" : seg.toUpperCase();
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = dark ? "#0f172a" : "#f8fafc";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#fbbf24";
    ctx.stroke();

    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.lineTo(cx - 12, 28);
    ctx.lineTo(cx + 12, 28);
    ctx.closePath();
    ctx.fillStyle = "#fbbf24";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();
  }, [size, rotation, active, highlightSegment]);

  return <canvas ref={ref} className="mx-auto block" />;
}

export function rollSegment(): WheelSegment {
  const r = Math.random();
  if (r < 0.4) return "t1";
  if (r < 0.7) return "t2";
  if (r < 0.9) return "t3";
  if (r < 0.98) return "bonus";
  return "jackpot";
}

export function targetRotationForSegment(seg: WheelSegment): number {
  const indices = SEGMENT_ORDER.map((s, i) => (s === seg ? i : -1)).filter(
    (i) => i >= 0
  );
  const idx = indices[Math.floor(Math.random() * indices.length)];
  const segCount = SEGMENT_ORDER.length;
  const segAngle = (Math.PI * 2) / segCount;
  const targetAngle = idx * segAngle;
  const spins = 5 + Math.floor(Math.random() * 2);
  return Math.PI * 2 * spins - targetAngle;
}
