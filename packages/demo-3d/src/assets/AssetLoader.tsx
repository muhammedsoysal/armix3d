import { Suspense, useEffect, type ReactNode } from "react";
import { useLoader, type GroupProps } from "@react-three/fiber";
import { GLTFLoader, STLLoader } from "three-stdlib";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

/**
 * Varlık kayıt defteri: /models/manifest.json içinde ad → dosya eşlemesi.
 * Gerçek model eklemek tek adımdır: dosyayı public/models/ altına koy,
 * manifest'e `"coil": "coil.glb"` satırı ekle — kod değişikliği gerekmez.
 * Manifest yoksa/boşsa tüm sahne placeholder primitiflerle çalışır.
 */
interface AssetStoreState {
  manifest: Record<string, string>;
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
      .then((manifest: Record<string, string>) => {
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
  const file = useStore(assetStore, (s) => s.manifest[name]);
  if (!file) return <group {...groupProps}>{children}</group>;
  const url = `/models/${file}`;
  return (
    <group {...groupProps}>
      <Suspense fallback={children}>
        {file.toLowerCase().endsWith(".stl") ? <StlModel url={url} /> : <GlbModel url={url} />}
      </Suspense>
    </group>
  );
}
