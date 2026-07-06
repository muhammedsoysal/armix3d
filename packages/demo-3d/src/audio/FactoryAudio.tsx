import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PositionalAudio } from "@react-three/drei";
import type { PositionalAudio as PositionalAudioImpl } from "three";
import { useStore } from "zustand";
import { machineStateStore } from "@metalnest/core";
import { LAYOUT } from "../sim/constants";
import { agvStore } from "../agv/agvStore";
import { audioStore } from "./audioStore";

/** Mekânsal fabrika sesi: makine uğultusu (sabit), kesim tıslaması (yalnız
 * CUTTING'te), AGV geri-vites bip'i (görevdeyken). Kamera yaklaştıkça sesler
 * doğal olarak yükselir (PositionalAudio). Kullanıcı jestiyle mount edilir. */
export function FactoryAudio() {
  const enabled = useStore(audioStore, (s) => s.enabled);
  const cuttingRef = useRef<PositionalAudioImpl>(null);
  const beepRef = useRef<PositionalAudioImpl>(null);

  useFrame(() => {
    const cutting = machineStateStore.getState().state === "CUTTING";
    if (cuttingRef.current) cuttingRef.current.setVolume(cutting ? 1.4 : 0);
    const onMission = agvStore.getState().phase !== "DOCKED";
    if (beepRef.current) beepRef.current.setVolume(onMission ? 0.9 : 0);
  });

  if (!enabled) return null;

  return (
    <group>
      {/* Tesis uğultusu — hat merkezinde geniş yayılım */}
      <group position={[LAYOUT.straightenerX, 1.2, 0]}>
        <PositionalAudio url="/audio/factory-hum.wav" distance={5} loop autoplay />
      </group>
      {/* Kesim tıslaması — kesim noktasında, dar yayılım */}
      <group position={[LAYOUT.cutX, LAYOUT.tableY, 0]}>
        <PositionalAudio ref={cuttingRef} url="/audio/cutting.wav" distance={2.5} loop autoplay />
      </group>
      {/* AGV bip'i — istasyon/koridor bölgesinde */}
      <group position={[LAYOUT.palletX + 1.5, 0.4, 1.6]}>
        <PositionalAudio ref={beepRef} url="/audio/agv-beep.wav" distance={2.5} loop autoplay />
      </group>
    </group>
  );
}
