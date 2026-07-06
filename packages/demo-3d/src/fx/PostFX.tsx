import { Vector2 } from "three";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  SMAA,
  Vignette,
} from "@react-three/postprocessing";
import { useStore } from "zustand";
import { qualityStore } from "../quality/qualityStore";
import { fxStore } from "./fxStore";

const CA_OFFSET = new Vector2(0.0005, 0.0005);

/** Sinematik post-processing yığını. Hangi efektin var olacağını kalite
 * ayarı (yapabilirlik), DoF'un o an açık olmasını fxStore (istek) belirler.
 * Efektler JSX sırasıyla uygulanır: SMAA → DoF → Bloom → CA → Vignette. */
export function PostFX() {
  const params = useStore(qualityStore, (s) => s.params);
  const dofEnabled = useStore(fxStore, (s) => s.dofEnabled);
  const dofFocusDistance = useStore(fxStore, (s) => s.dofFocusDistance);

  // Low kalite: composer hiç kurulmaz (MSAA yeterli, GPU'ya dokunma)
  if (!params.bloom && !params.smaa) return null;

  return (
    <EffectComposer>
      {params.smaa ? <SMAA /> : <></>}
      {dofEnabled ? (
        <DepthOfField focusDistance={dofFocusDistance} focalLength={0.06} bokehScale={3.5} />
      ) : (
        <></>
      )}
      {params.bloom ? (
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
      ) : (
        <></>
      )}
      {params.chromaticAberration ? (
        <ChromaticAberration offset={CA_OFFSET} radialModulation modulationOffset={0.4} />
      ) : (
        <></>
      )}
      {params.vignette ? <Vignette offset={0.25} darkness={0.65} /> : <></>}
    </EffectComposer>
  );
}
