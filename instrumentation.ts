export async function register() {
  // Runs once when the Next.js server starts (Node runtime only)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startVideoCleanup } = await import("./app/lib/videoCleanup");
    startVideoCleanup();
  }
}
