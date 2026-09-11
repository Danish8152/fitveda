/**
 * Sarvam AI TTS audio playback for the dance coach.
 * SHARED MODULE — used by both the YouTube app and the Zoom app.
 */

let isSpeaking = false;
let muted = false;
let currentAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

/** Call this once from a user-gesture handler (click/tap) to unlock browser autoplay. */
export function unlockAudio(): void {
  if (audioUnlocked) return;
  // Create + immediately suspend a silent AudioContext — this satisfies Chrome's
  // "user gesture required" autoplay policy for all subsequent audio.play() calls.
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    ctx.resume().then(() => { audioUnlocked = true; });
  } catch {
    audioUnlocked = true; // best-effort
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  if (value) cancelSpeech();
}

export function speak(audioBase64: string): void {
  if (typeof window === "undefined") return;
  console.log("[TTS] speak() called. isSpeaking:", isSpeaking, "muted:", muted, "base64 length:", audioBase64?.length);
  if (isSpeaking || muted) {
    console.log("[TTS] Blocked — isSpeaking:", isSpeaking, "muted:", muted);
    return;
  }

  const blob = new Blob(
    [Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))],
    { type: "audio/wav" }
  );
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  console.log("[TTS] Created Audio, blob size:", blob.size, "url:", url);

  isSpeaking = true;
  currentAudio = audio;

  audio.onended = () => {
    console.log("[TTS] Audio ended");
    isSpeaking = false;
    currentAudio = null;
    URL.revokeObjectURL(url);
  };
  audio.onerror = (e) => {
    console.error("[TTS] Audio error:", e);
    isSpeaking = false;
    currentAudio = null;
    URL.revokeObjectURL(url);
  };

  audio.play().then(() => {
    console.log("[TTS] play() started successfully");
  }).catch((err) => {
    console.error("[TTS] play() failed:", err);
    isSpeaking = false;
    currentAudio = null;
    URL.revokeObjectURL(url);
  });
}

export function isSpeechPlaying(): boolean {
  return isSpeaking;
}

export function cancelSpeech(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  isSpeaking = false;
}
