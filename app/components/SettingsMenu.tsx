"use client";

import { useEffect, useRef, useState } from "react";
import {
  KEY_PATTERN,
  clearMagicHourKey,
  saveMagicHourKey,
  useMagicHourKey,
} from "../lib/apiKeys";

type Props = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  className?: string;
};

const font = { fontFamily: "var(--font-audiowide)" } as const;

/** Gear button in the header plus the floating card that opens under it. */
export default function SettingsMenu({ open, onToggle, onClose, className = "" }: Props) {
  const savedKey = useMagicHourKey();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const key = draft.trim();
    if (!KEY_PATTERN.test(key)) {
      setError("That doesn't look like an API key (8+ characters, no spaces).");
      return;
    }
    saveMagicHourKey(key);
    setDraft("");
    setError("");
  };

  const remove = () => {
    clearMagicHourKey();
    setDraft("");
    setError("");
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Settings"
        aria-expanded={open}
        title="Settings"
        className={`relative w-9 h-9 flex items-center justify-center border transition-colors ${
          open
            ? "border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan"
            : "border-neon-cyan/20 bg-black/40 text-neon-cyan/60 hover:text-neon-cyan hover:border-neon-cyan/40"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[18px] h-[18px]"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        {savedKey && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-green shadow-[0_0_6px_#39ff14]" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Settings"
          className="absolute right-0 top-full mt-2 z-50 w-[min(22rem,calc(100vw-1.5rem))] border border-neon-cyan/30 bg-[#0a0a1a]/95 backdrop-blur-md p-4 text-left"
          style={{ boxShadow: "0 0 24px rgba(0, 255, 255, 0.15), 0 12px 40px rgba(0, 0, 0, 0.6)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] tracking-[0.3em] uppercase text-neon-cyan/80" style={font}>
              Settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="text-neon-cyan/40 hover:text-neon-cyan transition-colors text-lg leading-none"
            >
              &times;
            </button>
          </div>

          <label className="block text-[10px] tracking-[0.2em] uppercase text-white/60 mb-1.5" style={font}>
            Magic Hour API key
          </label>
          <p className="text-[11px] leading-snug text-white/40 mb-2">
            Used by AI Generate to create videos. Saved only in this browser. If empty, the
            server&apos;s own key is used.
          </p>

          <p className={`text-[11px] mb-2 ${savedKey ? "text-neon-green/80" : "text-neon-yellow/80"}`}>
            {savedKey ? `Key saved (…${savedKey.slice(-4)})` : "No key saved in this browser"}
          </p>

          <form onSubmit={save} className="flex gap-2 items-center">
            <input
              type="password"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              placeholder={savedKey ? "paste a new key to replace it" : "paste your Magic Hour key"}
              autoComplete="off"
              spellCheck={false}
              className="neon-input flex-1 min-w-0 px-3 py-2 rounded-none text-sm"
              style={{ fontFamily: "var(--font-chakra-petch)" }}
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="neon-btn flex-shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] rounded-none disabled:opacity-50"
              style={font}
            >
              Save
            </button>
          </form>
          {error && <p className="mt-1.5 text-[11px] text-neon-red/80">{error}</p>}

          {savedKey && (
            <button
              type="button"
              onClick={remove}
              className="mt-3 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] border border-neon-red/40 text-neon-red/80 hover:bg-neon-red/10 transition-colors"
              style={font}
            >
              Remove saved key
            </button>
          )}

          <p className="mt-3 text-[10px] text-white/30">Get a key at magichour.ai/developer</p>
        </div>
      )}
    </div>
  );
}
