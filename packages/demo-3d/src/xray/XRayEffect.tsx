import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  DoubleSide,
  Mesh,
  ShaderMaterial,
  Vector3,
  type Material,
} from "three";
import { xrayStore } from "./xrayStore";
import { revealRadiusAt } from "./waveMath";

const WAVE_DURATION = 1.4; // s
const WAVE_MAX_RADIUS = 48; // m — tüm tesisi yutar

/** TRON-vari hologram: lacivert taban + cyan fresnel kenar + dünya-Y
 * tarama çizgileri. Rim değerleri >1 → bloom'da parlar (ShaderMaterial
 * tonemapping'e girmez). TEK paylaşılan instance tüm sahneye yeter. */
const HOLO_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const HOLO_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 N = normalize(vNormal);
    float fres = pow(1.0 - abs(dot(N, V)), 2.0);
    float scan = 0.5 + 0.5 * sin(vWorldPos.y * 26.0 - uTime * 2.5);
    vec3 base = vec3(0.010, 0.035, 0.075);
    vec3 rim = vec3(0.22, 0.74, 0.97); // #38bdf8
    vec3 col = base + rim * fres * 1.9 + rim * scan * 0.05;
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface WaveState {
  mode: "in" | "out" | null;
  t: number;
  origin: Vector3;
}

/** Genişleyen enerji küresiyle tüm sahneyi hologram malzemesine çeviren
 * (ve geri alan) katman. Orijinal malzemeler Map'te saklanır; x-ray
 * sırasında doğan yeni mesh'ler kare süpürmesiyle anında yakalanır. */
export function XRayEffect() {
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const shellRef = useRef<Mesh>(null!);
  const wave = useRef<WaveState>({ mode: null, t: 0, origin: new Vector3() });
  const swapped = useRef(new Map<Mesh, Material | Material[]>());
  const tmp = useMemo(() => new Vector3(), []);

  const holo = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: HOLO_VERTEX,
        fragmentShader: HOLO_FRAGMENT,
        uniforms: { uTime: { value: 0 } },
      }),
    [],
  );
  useEffect(() => () => holo.dispose(), [holo]);

  // Toggle → kameradan başlayan dalga
  useEffect(() => {
    return xrayStore.subscribe((s, prev) => {
      if (s.active === prev.active) return;
      wave.current = {
        mode: s.active ? "in" : "out",
        t: 0,
        origin: camera.position.clone(),
      };
    });
  }, [camera]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    holo.uniforms.uTime.value = clock.elapsedTime;
    const w = wave.current;
    const active = xrayStore.getState().active;

    // Dalga cephesi yarıçapı
    let radius = Infinity;
    if (w.mode) {
      w.t += dt;
      radius = revealRadiusAt(w.t, WAVE_DURATION, WAVE_MAX_RADIUS);
    }

    // Kabuk küre görseli
    if (shellRef.current) {
      shellRef.current.visible = w.mode !== null;
      if (w.mode) {
        shellRef.current.position.copy(w.origin);
        shellRef.current.scale.setScalar(Math.max(radius, 0.01));
      }
    }

    // Malzeme süpürmesi: cephe geçtikçe çevir / geri al
    if (w.mode === "in" || (active && w.mode === null)) {
      scene.traverse((obj) => {
        if (!(obj instanceof Mesh) || obj.userData.noXray || swapped.current.has(obj)) return;
        obj.getWorldPosition(tmp);
        if (tmp.distanceTo(w.origin) <= radius) {
          swapped.current.set(obj, obj.material);
          obj.material = holo;
        }
      });
    } else if (w.mode === "out") {
      for (const [mesh, original] of swapped.current) {
        mesh.getWorldPosition(tmp);
        if (tmp.distanceTo(w.origin) <= radius) {
          mesh.material = original;
          swapped.current.delete(mesh);
        }
      }
    }

    // Dalga bitti
    if (w.mode && w.t >= WAVE_DURATION) {
      if (w.mode === "out") {
        // Emniyet: sökülmüş/kaçmış mesh'ler dahil hepsini geri al
        for (const [mesh, original] of swapped.current) mesh.material = original;
        swapped.current.clear();
      }
      w.mode = null;
    }
  });

  return (
    <mesh ref={shellRef} visible={false} userData={{ noXray: true }}>
      <sphereGeometry args={[1, 40, 24]} />
      <meshBasicMaterial
        color="#38bdf8"
        transparent
        opacity={0.09}
        blending={AdditiveBlending}
        side={DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
