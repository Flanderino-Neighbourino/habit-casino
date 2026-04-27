import type { AmountUnit, ClipColor } from "../types";
import { NON_GOLD_COLORS } from "../types";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function todayLocalDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function rollClipColor(): ClipColor {
  if (Math.random() < 0.03) return "gold";
  return NON_GOLD_COLORS[Math.floor(Math.random() * NON_GOLD_COLORS.length)];
}

export function pickRandomIndices(total: number, count: number): number[] {
  if (count >= total) return Array.from({ length: total }, (_, i) => i);
  const taken = new Set<number>();
  while (taken.size < count) {
    taken.add(Math.floor(Math.random() * total));
  }
  return Array.from(taken);
}

export function unitLabel(u: AmountUnit): string {
  if (typeof u === "string") return u;
  return u.custom;
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day} days ago`;
  const w = Math.floor(day / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString();
}

export function clipColorHex(c: ClipColor): string {
  switch (c) {
    case "red":
      return "#ef4444";
    case "blue":
      return "#3b82f6";
    case "green":
      return "#22c55e";
    case "yellow":
      return "#eab308";
    case "purple":
      return "#a855f7";
    case "orange":
      return "#f97316";
    case "gold":
      return "#fbbf24";
  }
}

export const AREA_ACCENTS = ["green", "blue", "purple", "orange", "pink"] as const;
export type AreaAccent = (typeof AREA_ACCENTS)[number];

export function areaAccentClasses(idx: number): {
  bg: string;
  text: string;
  ring: string;
  border: string;
  dot: string;
} {
  const accent = AREA_ACCENTS[idx] ?? "green";
  switch (accent) {
    case "green":
      return {
        bg: "bg-emerald-500",
        text: "text-emerald-500",
        ring: "ring-emerald-500",
        border: "border-emerald-500",
        dot: "bg-emerald-500",
      };
    case "blue":
      return {
        bg: "bg-blue-500",
        text: "text-blue-500",
        ring: "ring-blue-500",
        border: "border-blue-500",
        dot: "bg-blue-500",
      };
    case "purple":
      return {
        bg: "bg-purple-500",
        text: "text-purple-500",
        ring: "ring-purple-500",
        border: "border-purple-500",
        dot: "bg-purple-500",
      };
    case "orange":
      return {
        bg: "bg-orange-500",
        text: "text-orange-500",
        ring: "ring-orange-500",
        border: "border-orange-500",
        dot: "bg-orange-500",
      };
    case "pink":
      return {
        bg: "bg-pink-500",
        text: "text-pink-500",
        ring: "ring-pink-500",
        border: "border-pink-500",
        dot: "bg-pink-500",
      };
  }
}
