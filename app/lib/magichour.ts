/**
 * Magic Hour text-to-video client (https://docs.magichour.ai).
 * Same shape as lib/grok.ts: submit a job, poll until it finishes, get a download URL.
 *
 * Env:
 *   MAGICHOUR_API_KEY  required, create one at https://magichour.ai/developer
 *   MAGICHOUR_MODEL    optional, defaults to "default" (kling-3.0 on paid plans, ltx-2.5 on free).
 *                      Cheaper e.g. "ltx-2.5"; see the Magic Hour docs for the model list.
 */

const BASE = "https://api.magichour.ai/v1";

interface GenerateOptions {
  duration?: number;
  aspect_ratio?: string; // "16:9" | "9:16" | "1:1"
  resolution?: string; // "480p" | "720p" | "1080p"
}

interface VideoProject {
  id: string;
  status: "draft" | "queued" | "rendering" | "complete" | "error" | "canceled";
  error?: { message?: string; code?: string } | null;
  downloads?: { url: string; expires_at?: string }[];
}

function authHeaders(): Record<string, string> {
  const key = process.env.MAGICHOUR_API_KEY;
  if (!key) throw new Error("MAGICHOUR_API_KEY is not set");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" };
}

/** Submit a text-to-video job. Returns the video project ID. */
export async function generateVideo(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const body = {
    name: `FITVEDA ${new Date().toISOString()}`,
    end_seconds: options.duration ?? 10,
    aspect_ratio: options.aspect_ratio ?? "16:9",
    resolution: options.resolution ?? "480p",
    model: process.env.MAGICHOUR_MODEL || "default",
    style: { prompt: prompt.slice(0, 20_000) },
  };
  console.log("[magichour] Submitting text-to-video:", JSON.stringify({ ...body, style: undefined }));

  const res = await fetch(`${BASE}/text-to-video`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[magichour] Generation request failed:", res.status, text.slice(0, 300));
    throw new Error(`Magic Hour video generation failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as { id: string; credits_charged?: number };
  console.log("[magichour] Job queued:", data.id, "credits:", data.credits_charged);
  return data.id;
}

/** Poll until the video is rendered and return its download URL. */
export async function waitForVideo(
  id: string,
  onProgress?: (status: string) => void,
  maxWaitMs = 600_000
): Promise<string> {
  const start = Date.now();
  const interval = 5_000;
  let pollCount = 0;

  while (Date.now() - start < maxWaitMs) {
    pollCount++;
    const res = await fetch(`${BASE}/video-projects/${id}`, { headers: authHeaders() });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Magic Hour status check failed (${res.status}): ${text.slice(0, 300)}`);
    }

    const project = (await res.json()) as VideoProject;
    console.log(`[magichour] Poll #${pollCount} (${Math.round((Date.now() - start) / 1000)}s): status=${project.status}`);

    if (project.status === "complete") {
      const url = project.downloads?.[0]?.url;
      if (!url) throw new Error("Magic Hour finished but returned no download URL");
      return url;
    }
    if (project.status === "error") {
      throw new Error(`Magic Hour could not render the video: ${project.error?.message ?? project.error?.code ?? "unknown error"}`);
    }
    if (project.status === "canceled") {
      throw new Error("Magic Hour video was canceled");
    }

    onProgress?.(project.status);
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error("Video generation timed out");
}
