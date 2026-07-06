import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";
import { machineStateStore } from "@metalnest/core";
import { simStore } from "../sim/simStore";
import { fxStore } from "../fx/fxStore";
import { directorStore } from "./directorStore";
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

  // Eski OrbitControls hedefiyle aynı başlangıç bakışı
  useEffect(() => {
    controlsRef.current?.setTarget(-0.8, 1, 0, false);
  }, []);

  // Olay abonelikleri: makine fazı + palet tamamlama + plan sonu
  useEffect(() => {
    const unsubMachine = machineStateStore.subscribe((s, prev) => {
      if (!directorStore.getState().active || s.state === prev.state) return;
      const sim = simStore.getState();
      cutTo(
        shotForEvent(s.state, {
          planCompleted: sim.isPlanCompleted,
          palletJustCompleted: false,
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
      window.removeEventListener("wheel", onAnyInput);
      window.removeEventListener("keydown", onAnyInput);
      clearInterval(idleTimer);
    };
  }, []);

  // Kadraj içinde yavaş yörünge kayması — durağan planı "canlı" tutar
  useFrame((_, dt) => {
    const { active, shotId } = directorStore.getState();
    const controls = controlsRef.current;
    if (!active || !shotId || !controls) return;
    controls.azimuthAngle += SHOTS[shotId].drift * Math.min(dt, 0.05);
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
