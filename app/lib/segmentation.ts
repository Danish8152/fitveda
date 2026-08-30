type ProgressCallback = (status: string, progress?: number) => void;

export async function segmentVideo(
  videoId: string,
  onProgress?: ProgressCallback
): Promise<string> {
  onProgress?.("Starting segmentation...", 5);

  const res = await fetch("/api/segment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId }),
  });

  if (!res.ok) {
    let errorMessage = "Failed to segment video";
    try {
      const data = await res.json();
      errorMessage = data.error || errorMessage;
    } catch {
      // Body may not be valid JSON
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();

  if (!data.cached) {
    throw new Error("Unexpected response from segmentation API");
  }

  onProgress?.("Complete!", 100);
  return `/api/segment/video/${videoId}`;
}

export async function isSegmentationAvailable(): Promise<boolean> {
  try {
    const res = await fetch("/api/segment");
    if (!res.ok) return false;
    const data = await res.json();
    return data.configured === true;
  } catch {
    return false;
  }
}
