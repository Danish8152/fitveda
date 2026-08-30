import path from "path";
import os from "os";

/**
 * Shared directory path for downloaded, generated, and segmented video files.
 * Defaults to OS temp directory + /fitveda (e.g. C:\Users\...\AppData\Local\Temp\fitveda on Windows, /tmp/fitveda on Linux).
 */
export const VIDEO_DIR = process.env.VIDEO_DIR || path.join(os.tmpdir(), "fitveda");
