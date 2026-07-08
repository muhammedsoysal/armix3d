import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";
import { simStore } from "../sim/simStore";
import { truckStore } from "../truck/truckStore";
import { fxStore } from "../fx/fxStore";
import { directorStore } from "./directorStore";
import { introStore } from "../hud/Splash";
import { SHOTS, type ShotId } from "./shots";
import { sampleTour } from "./dronePath";

/** Kullanıcı bu süre boyunca hiç dokunmazsa sunum modu kendiliğinden başlar. */
const IDLE_RESUME_MS = 60_000;
/** Olay kadrajı ekranda bu kadar kalır, sonra dron turu kaldığı yerden sürer. */
const EVENT_HOLD_MS = 8_000;
/** Sinematik kesme yumuşaklığı (sn). */
const CINEMATIC_SMOOTH = 1.4;
/** Dron turu takip yumuşaklığı: hareketli hedefi damper ile kovalar —
 * spline'daki köşeler doğal "drone ataleti"yle yuvarlanır. */
const TOUR_SMOOTH = 0.9;
const DEFAULT_SMOOTH = 0.25;

/** OrbitControls'un yerini alan sinematik kamera.
 * Katman 1 — FPV DRON TURU: kapalı Catmull-Rom spline üzerinde kesintisiz
 * süzülüş (dronePath). Katman 2 — OLAY KADRAJLARI: palet/kamyon/final gibi
 * anlar dip-to-black ile araya girer, 8 sn sonra tur kaldığı yerden sürer.
 * Kullanıcı dokunduğu an kontrol kesintisiz geri verilir (controlstart),
 * 60 sn hareketsizlikte tur kaldığı yerden devam eder. */
export function DirectorCamera() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Olay kadrajına kes: konum+hedef yumuşak geçiş, kadraja özel DoF,
   * süre dolunca dron turuna otomatik dönüş. */
  const cutTo = (shotId: ShotId) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const shot = SHOTS[shotId];
    directorStore.getState().setShot(shotId);
    controls.smoothTime = CINEMATIC_SMOOTH;
    void controls.setLookAt(...shot.position, ...shot.target, true);
    fxStore.getState().setDof(shot.dof ?? false, shot.dofDistance);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      const d = directorStore.getState();
      if (d.active && d.shotId === shotId) d.clearShot(); // tura geri süzül
    }, EVENT_HOLD_MS);
  };

  // Açılış: kamera yüksekten başlar; splash bitince sinematik inişle
  // varsayılan kadraja süzülür (introStore fazlarını Splash yönetir)
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    c.setLookAt(58, 44, 80, -0.8, 1, 0, false); // yüksek açılış pozu — mega-fabrika ölçeği
    // ?cam=px,py,pz,tx,ty,tz — sabit kadraj (fuar açılış açısı / doğrulama)
    const camParam = new URLSearchParams(window.location.search).get("cam");
    const fixed = camParam?.split(",").map(Number).filter((n) => Number.isFinite(n));
    const unsub = introStore.subscribe((s, prev) => {
      if (s.phase === "descending" && prev.phase === "loading") {
        c.smoothTime = 1.1;
        if (fixed?.length === 6) {
          void c.setLookAt(fixed[0], fixed[1], fixed[2], fixed[3], fixed[4], fixed[5], true);
        } else void c.setLookAt(4.5, 4, 9.5, -0.8, 1, 0, true);
        setTimeout(() => {
          c.smoothTime = DEFAULT_SMOOTH;
          introStore.setState({ phase: "done" });
        }, 2600);
      }
    });
    return unsub;
  }, []);

  // Yüksek öncelikli olay abonelikleri — makine fazı kesmeleri KALDIRILDI:
  // dron turu zaten hattın önünden geçiyor; sürekli kesme sarsıntı yaratıyordu
  useEffect(() => {
    const unsubSim = simStore.subscribe((s, prev) => {
      if (!directorStore.getState().active) return;
      if (s.isPlanCompleted && !prev.isPlanCompleted) {
        cutTo("finale");
      } else if (s.completedPallets.length > prev.completedPallets.length) {
        cutTo("palletYard");
      }
    });
    // Sevkiyat olayları: yükleme ve kalkış → rampa kadrajı (büyük final)
    const unsubTruck = truckStore.subscribe((s, prev) => {
      if (!directorStore.getState().active) return;
      if (s.loadedIds.length > prev.loadedIds.length || (s.departing && !prev.departing)) {
        cutTo("truckDock");
      }
    });
    const unsubDirector = directorStore.subscribe((s, prev) => {
      if (!s.active && prev.active) {
        fxStore.getState().setDof(false);
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        if (controlsRef.current) controlsRef.current.smoothTime = DEFAULT_SMOOTH;
      }
    });
    return () => {
      unsubSim();
      unsubTruck();
      unsubDirector();
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
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

  // KARE DÖNGÜSÜ — Katman 1: dron turu takibi; Katman 2: olay kadrajı drifti
  // ?tourt=SANİYE — turu belirli sahneden başlat (fuar açılışı / doğrulama)
  const tourTRef = useRef(
    (() => {
      const t0 = Number(new URLSearchParams(window.location.search).get("tourt"));
      return Number.isFinite(t0) && t0 > 0 ? t0 : 0;
    })(),
  ); // tur saati — deaktivasyonda korunur (kaldığı yerden)
  const tourLabelRef = useRef<string | null>(null);
  const driftAccRef = useRef(0);
  const driftDirRef = useRef(1);
  const lastShotRef = useRef<string | null>(null);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { active, shotId } = directorStore.getState();
    const controls = controlsRef.current;
    if (!active || !controls || introStore.getState().phase !== "done") return;

    if (!shotId) {
      // DRON TURU: spline üzerindeki hareketli setpoint'i damper ile kovala.
      // İlk kareler dahil geçişler bu damperden geçer → tereyağı yumuşaklığı.
      if (lastShotRef.current !== null) {
        lastShotRef.current = null;
        fxStore.getState().setDof(false); // gezici kamerada bokeh olmaz
      }
      tourTRef.current += dt;
      const s = sampleTour(tourTRef.current);
      controls.smoothTime = TOUR_SMOOTH;
      void controls.setLookAt(s.pos.x, s.pos.y, s.pos.z, s.target.x, s.target.y, s.target.z, true);
      if (tourLabelRef.current !== s.label) {
        tourLabelRef.current = s.label;
        directorStore.getState().setTourSegment(s.label, s.segIndex, s.segCount);
      }
      return;
    }

    // OLAY KADRAJI: dar yayda ping-pong yörünge kayması (canlı el kamerası)
    if (lastShotRef.current !== shotId) {
      lastShotRef.current = shotId;
      driftAccRef.current = 0;
      driftDirRef.current = 1;
    }
    const MAX_DRIFT_ARC = 0.09; // rad — kadraj kompozisyonundan sapma sınırı
    const step = SHOTS[shotId].drift * driftDirRef.current * dt;
    driftAccRef.current += step;
    if (Math.abs(driftAccRef.current) >= MAX_DRIFT_ARC) driftDirRef.current *= -1;
    controls.azimuthAngle += step;
  });

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={3}
      maxDistance={82}
      maxPolarAngle={Math.PI / 2.05}
      smoothTime={DEFAULT_SMOOTH}
    />
  );
}
