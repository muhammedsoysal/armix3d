import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";
import { machineStateStore } from "@metalnest/core";
import { simStore } from "../sim/simStore";
import { truckStore } from "../truck/truckStore";
import { fxStore } from "../fx/fxStore";
import { directorStore } from "./directorStore";
import { introStore } from "../hud/Splash";
import { SHOTS, shotForEvent, type ShotId } from "./shots";

/** Kullanıcı bu süre boyunca hiç dokunmazsa sunum modu kendiliğinden başlar. */
const IDLE_RESUME_MS = 60_000;
/** Sinematik geçiş yumuşaklığı (sn) — serbest gezinmede varsayılana döner. */
const CINEMATIC_SMOOTH = 1.4;
const DEFAULT_SMOOTH = 0.25;

/** OrbitControls'un yerini alan olay-güdümlü sinematik kamera.
 * Aktifken makinenin hikâyesini kadraj kadraj anlatır; kullanıcı
 * dokunduğu an kesintisiz olarak kontrolü geri verir (controlstart),
 * 60 sn hareketsizlikte kaldığı yerden devam eder. */
export function DirectorCamera() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  // IDLE her tekrarında raf kahramanı ↔ yarma hattı arasında dönüşümlü kadraj
  const idleCountRef = useRef(0);

  /** Kadraja kes: konum+hedef yumuşak geçiş, kadraja özel DoF. */
  const cutTo = (shotId: ShotId) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const shot = SHOTS[shotId];
    directorStore.getState().setShot(shotId);
    controls.smoothTime = CINEMATIC_SMOOTH;
    void controls.setLookAt(...shot.position, ...shot.target, true);
    fxStore.getState().setDof(shot.dof ?? false, shot.dofDistance);
  };

  /** Şu anki sim durumuna uyan kadraja hemen kes (aktivasyon anı için). */
  const cutToCurrent = () => {
    const sim = simStore.getState();
    cutTo(
      shotForEvent(machineStateStore.getState().state, {
        planCompleted: sim.isPlanCompleted,
        palletJustCompleted: false,
      }),
    );
  };

  // Açılış: kamera yüksekten başlar; splash bitince sinematik inişle
  // varsayılan kadraja süzülür (introStore fazlarını Splash yönetir)
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    c.setLookAt(18, 17, 28, -0.8, 1, 0, false); // yüksek açılış pozu
    const unsub = introStore.subscribe((s, prev) => {
      if (s.phase === "descending" && prev.phase === "loading") {
        c.smoothTime = 1.1;
        void c.setLookAt(4.5, 4, 9.5, -0.8, 1, 0, true);
        setTimeout(() => {
          c.smoothTime = DEFAULT_SMOOTH;
          introStore.setState({ phase: "done" });
        }, 2600);
      }
    });
    return unsub;
  }, []);

  // Olay abonelikleri: makine fazı + palet tamamlama + plan sonu
  useEffect(() => {
    const unsubMachine = machineStateStore.subscribe((s, prev) => {
      if (!directorStore.getState().active || s.state === prev.state) return;
      const sim = simStore.getState();
      if (s.state === "IDLE") idleCountRef.current++;
      cutTo(
        shotForEvent(s.state, {
          planCompleted: sim.isPlanCompleted,
          palletJustCompleted: false,
          idleAlt: idleCountRef.current % 2 === 1,
        }),
      );
    });
    const unsubSim = simStore.subscribe((s, prev) => {
      if (!directorStore.getState().active) return;
      if (s.isPlanCompleted && !prev.isPlanCompleted) {
        cutTo("finale");
      } else if (s.completedPallets.length > prev.completedPallets.length) {
        cutTo("palletYard");
      }
    });
    // Sevkiyat olayları: ilk yükleme ve kalkış → rampa kadrajı (büyük final)
    const unsubTruck = truckStore.subscribe((s, prev) => {
      if (!directorStore.getState().active) return;
      if (s.loadedIds.length > prev.loadedIds.length || (s.departing && !prev.departing)) {
        cutTo("truckDock");
      }
    });
    // Aktivasyonda beklemeden mevcut faza kes
    const unsubDirector = directorStore.subscribe((s, prev) => {
      if (s.active && !prev.active) cutToCurrent();
      if (!s.active && prev.active) {
        fxStore.getState().setDof(false);
        if (controlsRef.current) controlsRef.current.smoothTime = DEFAULT_SMOOTH;
      }
    });
    return () => {
      unsubMachine();
      unsubSim();
      unsubTruck();
      unsubDirector();
    };
  }, []);

  // Kesinti + hareketsizlikte devam: controlstart yalnızca KULLANICI
  // girdisinde tetiklenir (programatik setLookAt tetiklemez).
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    let lastInteraction = performance.now();
    const onControlStart = () => {
      lastInteraction = performance.now();
      if (directorStore.getState().active) directorStore.getState().deactivate();
    };
    const onAnyInput = () => {
      lastInteraction = performance.now();
    };
    controls.addEventListener("controlstart", onControlStart);
    window.addEventListener("pointerdown", onAnyInput);
    window.addEventListener("pointermove", onAnyInput);
    window.addEventListener("wheel", onAnyInput);
    window.addEventListener("keydown", onAnyInput);
    const idleTimer = setInterval(() => {
      if (!directorStore.getState().active && performance.now() - lastInteraction > IDLE_RESUME_MS) {
        directorStore.getState().activate();
      }
    }, 5_000);
    return () => {
      controls.removeEventListener("controlstart", onControlStart);
      window.removeEventListener("pointerdown", onAnyInput);
      window.removeEventListener("pointermove", onAnyInput);
      window.removeEventListener("wheel", onAnyInput);
      window.removeEventListener("keydown", onAnyInput);
      clearInterval(idleTimer);
    };
  }, []);

  // Kadraj içinde yavaş yörünge kayması — durağan planı "canlı" tutar.
  // Kayma dar bir yayda (±MAX_DRIFT_ARC) ping-pong yapar: sınırsız birikirse
  // kamera uzun planlarda yörüngeyi tamamlayıp modellerin İÇİNDEN geçer.
  const driftAccRef = useRef(0);
  const driftDirRef = useRef(1);
  const lastShotRef = useRef<string | null>(null);
  useFrame((_, dt) => {
    const { active, shotId } = directorStore.getState();
    const controls = controlsRef.current;
    if (!active || !shotId || !controls) return;
    if (lastShotRef.current !== shotId) {
      lastShotRef.current = shotId;
      driftAccRef.current = 0;
      driftDirRef.current = 1;
    }
    const MAX_DRIFT_ARC = 0.09; // rad — kadraj kompozisyonundan sapma sınırı
    const step = SHOTS[shotId].drift * driftDirRef.current * Math.min(dt, 0.05);
    driftAccRef.current += step;
    if (Math.abs(driftAccRef.current) >= MAX_DRIFT_ARC) driftDirRef.current *= -1;
    controls.azimuthAngle += step;
  });

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={4}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2.05}
      smoothTime={DEFAULT_SMOOTH}
    />
  );
}
