// Cross-device sync via the habit-casino-sync Cloudflare Worker.
//
// Data is stored under sha256(passphrase). The passphrase itself never
// leaves the device — only its hex-encoded hash is used as the key.

import type { AppState } from "../types";

const SYNC_PASSPHRASE_KEY = "habitCasino.syncPassphrase";
const SYNC_LAST_AT_KEY = "habitCasino.syncLastAt";

// Set by the build pipeline / hardcoded after Cloudflare deploy.
// Empty string disables sync UI.
export const SYNC_BASE_URL: string =
  (import.meta.env.VITE_SYNC_URL as string | undefined)?.trim() ?? "";

export function isSyncConfigured(): boolean {
  return SYNC_BASE_URL.length > 0;
}

export function loadPassphrase(): string | null {
  try {
    return localStorage.getItem(SYNC_PASSPHRASE_KEY);
  } catch {
    return null;
  }
}

export function savePassphrase(p: string): void {
  try {
    localStorage.setItem(SYNC_PASSPHRASE_KEY, p);
  } catch {
    /* ignore */
  }
}

export function clearPassphrase(): void {
  try {
    localStorage.removeItem(SYNC_PASSPHRASE_KEY);
    localStorage.removeItem(SYNC_LAST_AT_KEY);
  } catch {
    /* ignore */
  }
}

export function getLastSyncedAt(): string | null {
  try {
    return localStorage.getItem(SYNC_LAST_AT_KEY);
  } catch {
    return null;
  }
}

function setLastSyncedAt(iso: string): void {
  try {
    localStorage.setItem(SYNC_LAST_AT_KEY, iso);
  } catch {
    /* ignore */
  }
}

async function passphraseToKey(p: string): Promise<string> {
  const enc = new TextEncoder().encode(p);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type RemoteRecord = { data: string; updatedAt: string };

export async function pushToCloud(
  passphrase: string,
  state: AppState
): Promise<{ updatedAt: string }> {
  const key = await passphraseToKey(passphrase);
  const body = JSON.stringify({ data: JSON.stringify(state) });
  const res = await fetch(`${SYNC_BASE_URL}/sync/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Push failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const json = (await res.json()) as { updatedAt: string };
  setLastSyncedAt(json.updatedAt);
  return json;
}

export async function pullFromCloud(
  passphrase: string
): Promise<{ state: AppState; updatedAt: string } | null> {
  const key = await passphraseToKey(passphrase);
  const res = await fetch(`${SYNC_BASE_URL}/sync/${key}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Pull failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const record = (await res.json()) as RemoteRecord;
  let parsed: AppState;
  try {
    parsed = JSON.parse(record.data) as AppState;
  } catch {
    throw new Error("Cloud data is corrupted (couldn't parse JSON).");
  }
  setLastSyncedAt(record.updatedAt);
  return { state: parsed, updatedAt: record.updatedAt };
}
