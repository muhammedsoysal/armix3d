import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import {
  AdditiveBlending,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type PointLight,
} from "three";
import { useStore } from "zustand";
import { simStore } from "../sim/simStore";
import { truckStore } from "../truck/truckStore";
import { TRUCK_LOAD_POINT } from "../truck/Truck";
import { OptionalModel } from "../assets/AssetLoader";
import { PalletWithStack } from "../scenes/Pallet";
import { AGV_PHASE_LABEL, agvStore, type AgvPhase } from "./agvStore";
import {
  DOCK,
  PATROL_LOOP,
  STAGING,
  dropSlotFor,
  missionLegs,
  pathLength,
  pointAlongPath,
  type FloorPath,
} from "./agvLogic";

const SPEED = 1.15; // m/s
const LIFT_DURATION = 1.2; // s
const DECK_LIFT = 0.12; // m
const WHEEL_R = 0.09;

/** Faz → durum ışık şeridi rengi */
const PHASE_COLOR: Record<AgvPhase, string> = {
  DOCKED: "#22c55e",
  TO_PICKUP: "#38bdf8",
  LIFT: "#f59e0b",
  TO_DROP: "#f59e0b",
  DROP: "#f59e0b",
  TO_HOME: "#38bdf8",
};

interface AgvFrame {
  leg: FloorPath | null;
  s: number;
  pauseT: number;
  yaw: number;
  deck: number;
  battery: number;
}

/** Fütüristik hover kartı — koil kartlarıyla aynı glassmorphism ailesi. */
function AgvHoverCard({ id }: { id: string }) {
  const phase = useStore(agvStore, (s) => s.phase);
  const battery = useStore(agvStore, (s) => s.battery);
  const carrying = useStore(agvStore, (s) => s.carrying);
  const pending = useStore(agvStore, (s) => s.pending);
  const batteryColor = battery > 50 ? "bg-emerald-400" : battery > 25 ? "bg-amber-400" : "bg-red-500";

  return (
    <Html position={[0, 1.15, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
      <div className="w-64 rounded-xl border border-sky-400/30 bg-gradient-to-br from-slate-900/90 to-sky-950/80 p-4 shadow-[0_0_30px_rgba(56,189,248,0.25)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs font-bold tracking-[0.25em] text-sky-300">{id}</span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            OTONOM
          </span>
        </div>
        <div className="space-y-2 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Görev:</span>
            <span className="font-mono font-semibold text-sky-200">{AGV_PHASE_LABEL[phase]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Yük:</span>
            <span className="font-mono text-slate-200">
              {carrying ? `${carrying.stack.length} parça · Palet #${carrying.slotIdx + 1}` : "Boş"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Kuyruk:</span>
            <span className="font-mono text-slate-200">{pending.length} palet</span>
          </div>
          <div>
            <div className="mb-1 flex justify-between">
              <span className="text-slate-400">Batarya:</span>
              <span className="font-mono font-bold text-white">%{battery}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${batteryColor}`}
                style={{ width: `${battery}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Html>
  );
}

/** Yüksek detaylı prosedürel AGV gövdesi. `OptionalModel name="agv"` ile
 * sarılıdır: /models/manifest.json'a "agv": "agv.glb" eklenirse satın
 * alınmış bir model kod değişikliği olmadan bunun yerine geçer. */
function AgvBody({
  bodyColor,
  lightBarRef,
  beaconRef,
  beaconLightRef,
  glowRef,
  wheelRefs,
}: {
  bodyColor: string;
  lightBarRef: React.RefObject<Mesh>;
  beaconRef: React.RefObject<Mesh>;
  beaconLightRef: React.RefObject<PointLight>;
  glowRef: React.RefObject<Mesh>;
  wheelRefs: React.MutableRefObject<Mesh[]>;
}) {
  return (
    <OptionalModel name="agv">
      {/* Gövde: pahlı kenarlı düşük şasi */}
      <RoundedBox args={[1.1, 0.22, 0.78]} radius={0.05} smoothness={3} position={[0, 0.16, 0]} castShadow>
        <meshStandardMaterial color={bodyColor} metalness={0.55} roughness={0.35} />
      </RoundedBox>
      {/* Durum ışık şeridi — gövdeyi çevreler, bloom'a girer.
          noXray: materyali her kare mutasyona uğrar, hologram swap'ı dışında
          tutulur (robotlar veri katmanında da durum ışığını korur). */}
      <mesh ref={lightBarRef} position={[0, 0.16, 0]} userData={{ noXray: true }}>
        <boxGeometry args={[1.12, 0.03, 0.8]} />
        <meshStandardMaterial color="#0a0f14" emissive="#38bdf8" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      {/* LiDAR kubbesi */}
      <mesh position={[0.38, 0.32, 0]} castShadow>
        <sphereGeometry args={[0.07, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#10151c" metalness={0.3} roughness={0.25} />
      </mesh>
      <mesh position={[0.38, 0.335, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 16]} />
        <meshStandardMaterial color="#000000" emissive="#ef4444" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      {/* İkaz feneri (döner lamba) */}
      <mesh ref={beaconRef} position={[-0.42, 0.36, 0]} userData={{ noXray: true }}>
        <cylinderGeometry args={[0.035, 0.045, 0.09, 12]} />
        <meshStandardMaterial color="#331a00" emissive="#ff8c00" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight ref={beaconLightRef} position={[-0.42, 0.5, 0]} color="#ff9a2e" intensity={2} distance={3.5} />
      {/* Kaldırma platformu (deck) çerçevesi */}
      <mesh position={[0, 0.285, 0]} castShadow>
        <boxGeometry args={[0.95, 0.035, 0.66]} />
        <meshStandardMaterial color="#1c2530" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Tekerlekler */}
      {([[-0.38, 0.28], [-0.38, -0.28], [0.38, 0.28], [0.38, -0.28]] as const).map(([x, z], i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) wheelRefs.current[i] = m;
          }}
          position={[x, WHEEL_R, z]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.06, 18]} />
          <meshStandardMaterial color="#14181e" metalness={0.2} roughness={0.7} />
        </mesh>
      ))}
      {/* Zemin altı holografik halka (underglow) */}
      <mesh ref={glowRef} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noXray: true }}>
        <ringGeometry args={[0.55, 0.78, 40]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </OptionalModel>
  );
}

/** AGV-01: dolan paletleri istasyondan stok grid'ine taşıyan lojistik robot. */
export function AGV() {
  const rootRef = useRef<Group>(null!);
  const deckRef = useRef<Group>(null!);
  const lightBarRef = useRef<Mesh>(null!);
  const beaconRef = useRef<Mesh>(null!);
  const beaconLightRef = useRef<PointLight>(null!);
  const glowRef = useRef<Mesh>(null!);
  const wheelRefs = useRef<Mesh[]>([]);
  const carrying = useStore(agvStore, (s) => s.carrying);
  const phase = useStore(agvStore, (s) => s.phase);
  const [hovered, setHovered] = useState(false);

  const frame = useRef<AgvFrame>({ leg: null, s: 0, pauseT: 0, yaw: Math.PI, deck: 0, battery: 100 });
  const legsRef = useRef<ReturnType<typeof missionLegs> | null>(null);

  // Dolan paletleri görev kuyruğuna al (slotIdx = append-stabil grid indeksi)
  useEffect(() => {
    return simStore.subscribe((s, prev) => {
      if (s.completedPallets.length > prev.completedPallets.length) {
        const idx = s.completedPallets.length - 1;
        const cp = s.completedPallets[idx];
        // readyAt: bantlama istasyonu paletle ~3.2 sn ilgilenir, AGV bekler
        agvStore.getState().enqueue({ id: cp.id, stack: cp.stack, slotIdx: idx, readyAt: Date.now() + 3200 });
      }
    });
  }, []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const store = agvStore.getState();
    const f = frame.current;
    let moving = false;

    switch (store.phase) {
      case "DOCKED": {
        f.battery = Math.min(100, f.battery + 1.6 * dt);
        if (store.pending.length > 0 && Date.now() >= store.pending[0].readyAt) {
          // Depolama görevi: bantlanmış paleti istasyondan grid'e taşı
          const first = store.pending[0];
          legsRef.current = missionLegs(STAGING, dropSlotFor(first.slotIdx));
          f.leg = legsRef.current.toPickup;
          f.s = 0;
          store.startMission({ kind: "store", pallet: first });
          break;
        }
        // Plan bitti: grid'deki paletleri sırayla kamyona yükle, sonra uğurla
        const sim = simStore.getState();
        if (sim.isPlanCompleted && store.pending.length === 0) {
          const loaded = truckStore.getState().loadedIds;
          const nextId = store.deliveredIds.find((id) => !loaded.includes(id));
          if (nextId !== undefined) {
            const idx = sim.completedPallets.findIndex((cp) => cp.id === nextId);
            const cp = sim.completedPallets[idx];
            if (cp) {
              legsRef.current = missionLegs(dropSlotFor(idx), TRUCK_LOAD_POINT);
              f.leg = legsRef.current.toPickup;
              f.s = 0;
              store.startMission({
                kind: "load",
                pallet: { id: cp.id, stack: cp.stack, slotIdx: idx, readyAt: 0 },
              });
            }
          } else if (loaded.length > 0 && !truckStore.getState().departing) {
            truckStore.getState().depart();
          }
        }
        break;
      }
      case "TO_PICKUP":
      case "TO_DROP":
      case "TO_HOME": {
        if (!f.leg) break;
        moving = true;
        f.s += SPEED * dt;
        f.battery = Math.max(5, f.battery - 0.45 * dt);
        const p = pointAlongPath(f.leg, f.s);
        rootRef.current.position.set(p.x, 0, p.z);
        // En kısa yay üzerinden yumuşak dönüş
        const dYaw = ((p.heading - f.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        f.yaw += dYaw * Math.min(1, dt * 6);
        rootRef.current.rotation.y = f.yaw;
        if (p.done && f.s >= pathLength(f.leg)) {
          if (store.phase === "TO_PICKUP") {
            f.pauseT = 0;
            store.beginLift();
          } else if (store.phase === "TO_DROP") {
            f.pauseT = 0;
            store.beginDrop();
          } else {
            f.leg = null;
            store.dock();
          }
        }
        break;
      }
      case "LIFT": {
        f.pauseT += dt;
        f.deck = Math.min(1, f.pauseT / LIFT_DURATION);
        if (f.pauseT >= LIFT_DURATION) {
          store.pickUp();
          f.leg = legsRef.current?.toDrop ?? null;
          f.s = 0;
        }
        break;
      }
      case "DROP": {
        f.pauseT += dt;
        f.deck = Math.max(0, 1 - f.pauseT / LIFT_DURATION);
        if (f.pauseT >= LIFT_DURATION) {
          store.deliver();
          f.leg = legsRef.current?.toHome ?? null;
          f.s = 0;
        }
        break;
      }
    }

    // Görsel canlılık: deck, tekerlek, fener, underglow
    deckRef.current.position.y = f.deck * DECK_LIFT;
    for (const w of wheelRefs.current) if (moving) w.rotation.x += (SPEED * dt) / WHEEL_R;
    const onMission = store.phase !== "DOCKED";
    if (beaconRef.current) {
      const mat = beaconRef.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = onMission ? 3.5 + 2.5 * Math.sin(t * 9) : 1.2;
    }
    if (beaconLightRef.current) beaconLightRef.current.intensity = onMission ? 2.5 + 2 * Math.sin(t * 9) : 0.6;
    if (glowRef.current) {
      const mat = glowRef.current.material as MeshBasicMaterial;
      mat.opacity = 0.25 + 0.15 * Math.sin(t * 3);
    }
    if (lightBarRef.current) {
      const mat = lightBarRef.current.material as MeshStandardMaterial;
      mat.emissive.set(PHASE_COLOR[store.phase]);
    }
    // Batarya store'a saniyede ~1 kez yazılır (HUD aboneleri için)
    if (Math.abs(store.battery - f.battery) >= 1) store.setBattery(Math.round(f.battery));
  });

  return (
    <group
      ref={rootRef}
      position={[DOCK.x, 0, DOCK.z]}
      rotation={[0, Math.PI, 0]}
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
      {hovered && <AgvHoverCard id="AGV-01" />}
      <AgvBody
        bodyColor="#2563eb"
        lightBarRef={lightBarRef}
        beaconRef={beaconRef}
        beaconLightRef={beaconLightRef}
        glowRef={glowRef}
        wheelRefs={wheelRefs}
      />
      {/* Taşınan palet deck üzerinde */}
      <group ref={deckRef}>
        {carrying && (
          <group position={[0, 0.3, 0]} scale={0.82}>
            <PalletWithStack stack={carrying.stack} banded />
          </group>
        )}
      </group>
      {/* Şarj istasyonu işareti (dock'ta sabit durur, AGV ile taşınmaz) */}
      {phase === "DOCKED" && (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 0.95, 40]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** AGV-02: tesis çevresinde sonsuz devriye — zemini "yaşayan" hale getirir. */
export function PatrolAGV() {
  const rootRef = useRef<Group>(null!);
  const lightBarRef = useRef<Mesh>(null!);
  const beaconRef = useRef<Mesh>(null!);
  const beaconLightRef = useRef<PointLight>(null!);
  const glowRef = useRef<Mesh>(null!);
  const wheelRefs = useRef<Mesh[]>([]);
  const yawRef = useRef(0);
  const sRef = useRef(0);
  const total = useMemo(() => pathLength(PATROL_LOOP), []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    sRef.current = (sRef.current + 0.9 * dt) % total;
    const p = pointAlongPath(PATROL_LOOP, sRef.current);
    rootRef.current.position.set(p.x, 0, p.z);
    const dYaw = ((p.heading - yawRef.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    yawRef.current += dYaw * Math.min(1, dt * 6);
    rootRef.current.rotation.y = yawRef.current;
    for (const w of wheelRefs.current) w.rotation.x += (0.9 * dt) / WHEEL_R;
    const t = clock.elapsedTime;
    if (beaconRef.current) {
      (beaconRef.current.material as MeshStandardMaterial).emissiveIntensity = 3 + 2 * Math.sin(t * 7 + 1.7);
    }
    if (beaconLightRef.current) beaconLightRef.current.intensity = 2 + 1.6 * Math.sin(t * 7 + 1.7);
    if (glowRef.current) (glowRef.current.material as MeshBasicMaterial).opacity = 0.22 + 0.12 * Math.sin(t * 3 + 2);
  });

  return (
    <group ref={rootRef} position={[PATROL_LOOP[0][0], 0, PATROL_LOOP[0][1]]}>
      <AgvBody
        bodyColor="#475569"
        lightBarRef={lightBarRef}
        beaconRef={beaconRef}
        beaconLightRef={beaconLightRef}
        glowRef={glowRef}
        wheelRefs={wheelRefs}
      />
    </group>
  );
}
