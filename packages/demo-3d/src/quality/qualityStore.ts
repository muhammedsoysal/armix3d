import { createStore } from "zustand/vanilla";

export type QualityLevel = "low" | "medium" | "ultra";

export interface QualityParams {
  /** GPU kıvılcım partikül sayısı */
  sparkCount: number;
  smokeCount: number;
  shadowsEnabled: boolean;
  shadowMapSize: number;
  /** Canvas dpr üst sınırı */
  dprMax: number;
  bloom: boolean;
  vignette: boolean;
  envResolution: number;
  /** Sahte volümetrik ışık hüzmeleri + toz partikülleri */
  volumetrics: boolean;
  /** Composer içi kenar yumuşatma */
  smaa: boolean;
  /** Filmsi renk sapması (çok hafif) */
  chromaticAberration: boolean;
}

export const QUALITY_PARAMS: Record<QualityLevel, QualityParams> = {
  low: {
    sparkCount: 600,
    smokeCount: 0,
    shadowsEnabled: false,
    shadowMapSize: 512,
    dprMax: 1,
    bloom: false,
    vignette: false,
    envResolution: 64,
    volumetrics: false,
    smaa: false,
    chromaticAberration: false,
  },
  medium: {
    sparkCount: 2500,
    smokeCount: 48,
    shadowsEnabled: true,
    shadowMapSize: 1024,
    dprMax: 1.5,
    bloom: true,
    vignette: true,
    envResolution: 128,
    volumetrics: true,
    smaa: true,
    chromaticAberration: false,
  },
  ultra: {
    sparkCount: 8000,
    smokeCount: 96,
    shadowsEnabled: true,
    shadowMapSize: 2048,
    dprMax: 2,
    bloom: true,
    vignette: true,
    envResolution: 256,
    volumetrics: true,
    smaa: true,
    chromaticAberration: true,
  },
};

const LEVEL_ORDER: QualityLevel[] = ["low", "medium", "ultra"];

/** Bir alt kalite seviyesi; 'low' tabandır. Saf fonksiyon — test edilir. */
export function lowerQualityLevel(level: QualityLevel): QualityLevel {
  const i = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[Math.max(i - 1, 0)];
}

const STORAGE_KEY = "metalnest-quality";

function loadInitial(): QualityLevel {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "low" || saved === "medium" || saved === "ultra") return saved;
  } catch {
    /* kiosk'ta storage kapalıysa varsayılan */
  }
  return "medium";
}

export interface QualityStoreState {
  level: QualityLevel;
  params: QualityParams;
  setLevel: (level: QualityLevel) => void;
  /** Performans düşünce bir seviye aşağı in — localStorage'a YAZMAZ:
   * anlık bir yavaşlama kiosk'u kalıcı olarak düşürmesin. */
  stepDown: () => void;
}

export const qualityStore = createStore<QualityStoreState>()((set) => ({
  level: loadInitial(),
  params: QUALITY_PARAMS[loadInitial()],
  setLevel: (level) => {
    try {
      localStorage.setItem(STORAGE_KEY, level);
    } catch {
      /* yok say */
    }
    console.log(`[QUALITY] Kalite ayarı: ${level}`);
    set({ level, params: QUALITY_PARAMS[level] });
  },
  stepDown: () =>
    set((s) => {
      const next = lowerQualityLevel(s.level);
      if (next === s.level) return s;
      console.log(`[QUALITY] Otomatik düşürme: ${s.level} → ${next}`);
      return { level: next, params: QUALITY_PARAMS[next] };
    }),
}));
