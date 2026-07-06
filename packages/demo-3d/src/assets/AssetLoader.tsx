import { Suspense, useEffect, type ReactNode } from "react";
import { useLoader, type GroupProps } from "@react-three/fiber";
import { GLTFLoader, STLLoader } from "three-stdlib";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

/**
 * Varlık kayıt defteri: /models/manifest.json içinde ad → dosya eşlemesi.
 * Gerçek model eklemek tek adımdır: dosyayı public/models/ altına koy,
 * manifest'e `"coil": "coil.glb"` satırı ekle — kod değişikliği gerekmez.
 * İndirilen modellerin ölçek/yönü sahneye uymayabilir; bunun için genişletilmiş
 * biçim: `"truck": { "file": "truck.glb", "scale": 1.2, "rotationY": -1.5708,
 * "position": [0, 0.1, 0] }`. Manifest yoksa sahne placeholder'larla çalışır.
 */
export interface AssetEntry {
  file: string;
  /** Tekdüze ölçek çarpanı (varsayılan 1) */
  scale?: number;
  /** Y ekseni dönüşü (radyan) — modelin baktığı yönü sahneye uydur */
  rotationY?: number;
  /** Yerel ofset [x,y,z] (m) */
  position?: [number, number, number];
}

interface AssetStoreState {
  manifest: Record<string, string | AssetEntry>;
  loaded: boolean;
}

export const assetStore = createStore<AssetStoreState>()(() => ({
  manifest: {},
  loaded: false,
}));

export function AssetManifestLoader() {
  useEffect(() => {
    fetch("/models/manifest.json")
      .then((res) => (res.ok ? res.json() : {}))
      .then((manifest: Record<string, string | AssetEntry>) => {
        const entries = Object.keys(manifest);
        if (entries.length > 0) {
          console.log(`[ASSET] ${entries.length} gerçek model bulundu: ${entries.join(", ")}`);
        }
        assetStore.setState({ manifest, loaded: true });
      })
      .catch(() => assetStore.setState({ loaded: true }));
  }, []);
  return null;
}

function StlModel({ url, color = "#9aa2ad" }: { url: string; color?: string }) {
  const geometry = useLoader(STLLoader, url);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} metalness={0.75} roughness={0.4} />
    </mesh>
  );
}

function GlbModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  return <primitive object={gltf.scene} />;
}

export interface OptionalModelProps extends GroupProps {
  /** manifest.json'daki anahtar */
  name: string;
  /** Model yokken (veya yüklenirken) gösterilen placeholder */
  children: ReactNode;
}

/** Placeholder → gerçek model geçişini tek noktada yöneten sarmalayıcı. */
export function OptionalModel({ name, children, ...groupProps }: OptionalModelProps) {
  const entry = useStore(assetStore, (s) => s.manifest[name]);
  if (!entry) return <group {...groupProps}>{children}</group>;
  const meta: AssetEntry = typeof entry === "string" ? { file: entry } : entry;
  const url = `/models/${meta.file}`;
  return (
    <group {...groupProps}>
      <Suspense fallback={children}>
        <group
          scale={meta.scale ?? 1}
          rotation={[0, meta.rotationY ?? 0, 0]}
          position={meta.position ?? [0, 0, 0]}
        >
          {meta.file.toLowerCase().endsWith(".stl") ? <StlModel url={url} /> : <GlbModel url={url} />}
        </group>
      </Suspense>
    </group>
  );
}
