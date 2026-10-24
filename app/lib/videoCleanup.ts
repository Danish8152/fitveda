import { readdir, stat, unlink, utimes } from "fs/promises";
import path from "path";
import { VIDEO_DIR } from "./constants";

/** Files in VIDEO_DIR untouched for this long are deleted. */
export const VIDEO_TTL_MS = 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

/** Delete every file in VIDEO_DIR whose last modification/use is older than the TTL. */
export async function sweepOldVideos(): Promise<void> {
  let names: string[];
  try {
    names = await readdir(VIDEO_DIR);
  } catch {
    return; // directory doesn't exist yet
  }

  const cutoff = Date.now() - VIDEO_TTL_MS;
  let removed = 0;

  for (const name of names) {
    const filePath = path.join(VIDEO_DIR, name);
    try {
      const info = await stat(filePath);
      if (info.isFile() && info.mtimeMs < cutoff) {
        await unlink(filePath);
        removed++;
      }
    } catch {
      // file vanished or is still in use; try again on the next sweep
    }
  }

  if (removed > 0) console.log(`[cleanup] removed ${removed} video file(s) older than 1h`);
}

/** Mark a video as just used so the 1-hour clock restarts while someone is watching it. */
export function touchVideo(filePath: string): void {
  const now = new Date();
  utimes(filePath, now, now).catch(() => {});
}

let started = false;

/** Start the periodic sweep (idempotent). Called once when the server boots. */
export function startVideoCleanup(): void {
  if (started) return;
  started = true;
  void sweepOldVideos();
  setInterval(() => void sweepOldVideos(), SWEEP_INTERVAL_MS).unref();
}
