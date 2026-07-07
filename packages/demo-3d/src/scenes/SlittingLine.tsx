import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { DoubleSide, type Group, type Mesh } from "three";
import { useStore } from "zustand";
import { OptionalModel } from "../assets/AssetLoader";
import { SLIT_TRIM_PROOF, telemetryStore } from "../telemetry/telemetryStore";

/**
 * Yarma Hattı (Slitting Line) — rulo servis merkezlerinin imza makinesi:
 * geniş rulo açılır, dairesel bıçaklardan geçer ve N dar şeride (mult)
 * ayrılıp ayrı kafalara sarılır. Tamamen prosedürel + döngüsel animasyon:
 * ana rulo incelir, şerit ruloları kalınlaşır, sonra döngü başa döner.
 */

// Hat yerleşimi (dünya koordinatı): ön-sol boş saha, ana hatta paralel —
// varsayılan kameradan görünür, devriye AGV'si önünden geçer
const LINE_Z = 3.5;
const UNCOILER_X = -8.0;
const SLITTER_X = -5.3;
const RECOILER_X = -2.9;
const PASS_Y = 1.05; // şerit geçiş yüksekliği
const STRIP_W = 1.1; // ana şerit eni (m)
const N_RIBBONS = 5;
const RIBBON_W = 0.19;
const RIBBON_GAP = 0.065; // sarıcıda şeritler arası boşluk
const CYCLE_S = 75; // ana rulonun boşalma süresi (sn)

const R_MAIN_MAX = 0.72;
const R_MAIN_MIN = 0.3;
const R_TAKEUP_MIN = 0.16;
const R_TAKEUP_MAX = 0.52;

/** Döngü ilerlemesi 0..1 — ana rulo boşalır, sarıcılar dolar. */
function cycleT(elapsed: number): number {
  return (elapsed % CYCLE_S) / CYCLE_S;
}

function SteelStand({ x, z, h }: { x: number; z: number; h: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[0.28, h, 0.22]} />
        <meshStandardMaterial color="#31527d" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.55, 0.08, 0.45]} />
        <meshStandardMaterial color="#232a33" metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function SlittingLine() {
  const mainCoilRef = useRef<Mesh>(null!);
  const takeupsRef = useRef<Group>(null!);
  const knivesRef = useRef<Group>(null!);
  const [hovered, setHovered] = useState(false);
  const lastTRef = useRef(0);
  const activeJob = useStore(telemetryStore, (s) => s.slitQueue[s.slitActiveIdx]);

  useFrame(({ clock }, dt) => {
    const t = cycleT(clock.elapsedTime);
    // Döngü başa sardı → iş tamamlandı, kuyruktan sıradakine geç + sayaç
    if (t < lastTRef.current) {
      const tel = telemetryStore.getState();
      tel.advanceSlitJob();
      tel.updateMachine("SLT-1", { partsToday: tel.machines["SLT-1"].partsToday + 1 });
    }
    lastTRef.current = t;
    // İlerleme HUD/dashboard için ~saniyede bir yazılır
    if (Math.abs(t - telemetryStore.getState().slitProgress) > 0.015) {
      telemetryStore.getState().setSlitProgress(t);
    }
    const spin = Math.min(dt, 0.05) * 1.6;

    // Ana rulo: incelir + döner
    const rMain = R_MAIN_MAX - (R_MAIN_MAX - R_MAIN_MIN) * t;
    mainCoilRef.current.scale.set(rMain / R_MAIN_MAX, 1, rMain / R_MAIN_MAX);
    mainCoilRef.current.rotation.z += spin / rMain;

    // Sarıcılar: kalınlaşır + döner
    const rTake = R_TAKEUP_MIN + (R_TAKEUP_MAX - R_TAKEUP_MIN) * t;
    for (const child of takeupsRef.current.children) {
      child.scale.set(rTake / R_TAKEUP_MAX, 1, rTake / R_TAKEUP_MAX);
      child.rotation.z += spin / rTake;
    }

    // Bıçaklar hızlı döner
    knivesRef.current.rotation.z -= spin * 6;
  });

  // Sarıcıdaki şerit merkezleri (hat eksenine göre ±z)
  const slots = Array.from({ length: N_RIBBONS }, (_, k) => {
    const total = N_RIBBONS * RIBBON_W + (N_RIBBONS - 1) * RIBBON_GAP;
    return -total / 2 + RIBBON_W / 2 + k * (RIBBON_W + RIBBON_GAP);
  });

  return (
    <group
      position={[0, 0, LINE_Z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <OptionalModel name="slitting-line">
        {/* ANA RULO AÇICI */}
        <SteelStand x={UNCOILER_X} z={0.35} h={PASS_Y} />
        <SteelStand x={UNCOILER_X} z={-0.35} h={PASS_Y} />
        <mesh ref={mainCoilRef} position={[UNCOILER_X, PASS_Y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[R_MAIN_MAX, R_MAIN_MAX, STRIP_W, 40]} />
          <meshStandardMaterial color="#b9bfc7" metalness={0.9} roughness={0.32} />
        </mesh>

        {/* Ana şerit: açıcı → yarıcı */}
        <mesh position={[(UNCOILER_X + SLITTER_X) / 2, PASS_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[SLITTER_X - UNCOILER_X, STRIP_W]} />
          <meshStandardMaterial color="#cdd2d9" metalness={0.85} roughness={0.3} side={DoubleSide} />
        </mesh>

        {/* YARICI GÖVDE + DAİRESEL BIÇAKLAR */}
        <mesh position={[SLITTER_X, PASS_Y, 0]} castShadow>
          <boxGeometry args={[0.5, 0.66, STRIP_W + 0.36]} />
          <meshStandardMaterial color="#20406b" metalness={0.55} roughness={0.42} />
        </mesh>
        <group ref={knivesRef} position={[SLITTER_X, PASS_Y + 0.36, 0]}>
          {slots.slice(0, -1).map((z, i) => (
            <mesh key={i} position={[0, 0, z + (RIBBON_W + RIBBON_GAP) / 2]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.02, 28]} />
              <meshStandardMaterial color="#e8edf2" metalness={0.95} roughness={0.15} />
            </mesh>
          ))}
        </group>
        {/* Durum lambası */}
        <mesh position={[SLITTER_X, PASS_Y + 0.62, (STRIP_W + 0.36) / 2 - 0.06]}>
          <sphereGeometry args={[0.045, 12, 8]} />
          <meshStandardMaterial color="#052e12" emissive="#22c55e" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>

        {/* ŞERİTLER: bıçak çıkışında bitişik, sarıcıda aralıklı — yelpaze.
            Düz yat (Rx -90) + Y ekseni etrafında hedefe döndürme grubu. */}
        {slots.map((z1, k) => {
          const x0 = SLITTER_X + 0.26;
          const x1 = RECOILER_X;
          // Bıçak çıkışı: şeritler boşluksuz yan yana
          const z0 = (k - (N_RIBBONS - 1) / 2) * RIBBON_W;
          const dx = x1 - x0;
          const dz = z1 - z0;
          const len = Math.hypot(dx, dz);
          return (
            <group
              key={k}
              position={[(x0 + x1) / 2, PASS_Y + 0.001 * k, (z0 + z1) / 2]}
              rotation={[0, -Math.atan2(dz, dx), 0]}
            >
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[len, RIBBON_W]} />
                <meshStandardMaterial color="#d5dae0" metalness={0.85} roughness={0.28} side={DoubleSide} />
              </mesh>
            </group>
          );
        })}

        {/* SARICI: her şeride bir dar rulo */}
        <SteelStand x={RECOILER_X} z={0.5} h={PASS_Y} />
        <SteelStand x={RECOILER_X} z={-0.5} h={PASS_Y} />
        <group ref={takeupsRef}>
          {slots.map((z, k) => (
            <mesh key={k} position={[RECOILER_X, PASS_Y, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[R_TAKEUP_MAX, R_TAKEUP_MAX, RIBBON_W, 32]} />
              <meshStandardMaterial color="#c7ccd3" metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </OptionalModel>

      {hovered && (
        <Html position={[SLITTER_X, 2.3, 0]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
          <div className="w-64 rounded-xl border border-sky-400/30 bg-gradient-to-br from-slate-900/90 to-sky-950/80 p-4 shadow-[0_0_30px_rgba(56,189,248,0.25)] backdrop-blur-xl">
            <div className="mb-2 border-b border-white/10 pb-2 text-xs font-bold tracking-[0.2em] text-sky-300">
              YARMA HATTI (SLITTING)
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Aktif İş:</span>
                <span className="font-bold text-sky-200">{activeJob.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Program:</span>
                <span className="text-slate-200">{activeJob.program}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Malzeme:</span>
                <span className="text-slate-200">{activeJob.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Desen trim:</span>
                <span className="text-slate-200">{activeJob.trimMm}mm · {activeJob.runs} rulo</span>
              </div>
              <div className="mt-1 rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-1">
                <span className="text-slate-400">1D-CSP: </span>
                <span className="font-bold text-emerald-400">%{SLIT_TRIM_PROOF.optimizedPct}</span>
                <span className="text-slate-500"> (naif </span>
                <span className="text-red-400 line-through">%{SLIT_TRIM_PROOF.naivePct}</span>
                <span className="text-slate-500">)</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
