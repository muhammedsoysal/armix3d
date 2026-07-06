import { useStore } from "zustand";
import { audioStore } from "../audio/audioStore";

/** Ses anahtarı — sağ alt köşe. İlk tıklama AudioContext'i açar (tarayıcı jest kuralı). */
export function AudioToggle() {
  const enabled = useStore(audioStore, (s) => s.enabled);
  const toggle = useStore(audioStore, (s) => s.toggle);

  return (
    <button
      onClick={toggle}
      title={enabled ? "Sesi kapat" : "Fabrika sesini aç"}
      className={`pointer-events-auto absolute bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-md transition-all active:scale-95 ${
        enabled
          ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/20"
          : "border-white/10 bg-black/55 text-neutral-300 hover:bg-white/10"
      }`}
    >
      {enabled ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5zM16 9l5 6M21 9l-5 6" />
        </svg>
      )}
    </button>
  );
}
