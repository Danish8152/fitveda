import { writeFileSync, unlink } from "fs";
import { randomUUID } from "crypto";
import os from "os";
import path from "path";

/**
 * Extra yt-dlp args that get past YouTube's "confirm you're not a bot" check on server IPs.
 *
 * - YTDLP_COOKIES_B64: base64 of a Netscape-format cookies.txt exported from a logged-in YouTube session.
 * - YTDLP_PROXY: proxy URL, e.g. http://user:pass@host:port (a residential proxy is the most reliable).
 *
 * Both are optional. yt-dlp rewrites its cookie file on exit, so every call gets its own copy
 * and must call `cleanup()` when the process is done.
 */
export function ytdlpAuthArgs(): { args: string[]; cleanup: () => void } {
  const args: string[] = [];
  let cookiePath: string | null = null;

  const b64 = process.env.YTDLP_COOKIES_B64?.trim();
  if (b64) {
    cookiePath = path.join(os.tmpdir(), `fitveda-cookies-${randomUUID()}.txt`);
    writeFileSync(cookiePath, Buffer.from(b64, "base64"), { mode: 0o600 });
    args.push("--cookies", cookiePath);
  }

  const proxy = process.env.YTDLP_PROXY?.trim();
  if (proxy) args.push("--proxy", proxy);

  return {
    args,
    cleanup: () => {
      if (cookiePath) unlink(cookiePath, () => {});
    },
  };
}
