import { useSyncExternalStore } from "react";

/**
 * API keys typed into the browser (Settings card). Stored in this browser's localStorage only
 * and sent to our own server with each request that needs them.
 */

const MAGICHOUR_KEY = "fitveda.magichourKey";

/** Printable ASCII, no spaces, 8-200 characters (matches what the server accepts). */
export const KEY_PATTERN = /^[!-~]{8,200}$/;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getMagicHourKey(): string {
  try {
    return localStorage.getItem(MAGICHOUR_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveMagicHourKey(key: string): void {
  try {
    localStorage.setItem(MAGICHOUR_KEY, key);
  } catch {
    // storage blocked (private window etc.)
  }
  emit();
}

export function clearMagicHourKey(): void {
  try {
    localStorage.removeItem(MAGICHOUR_KEY);
  } catch {
    // ignore
  }
  emit();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === MAGICHOUR_KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The saved Magic Hour key ("" when none). Safe during server rendering. */
export function useMagicHourKey(): string {
  return useSyncExternalStore(subscribe, getMagicHourKey, () => "");
}
