import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, ShaderMaterial, type Group, type Mesh, type PointLight } from "three";
import { machineStateStore, type MachineState } from "@metalnest/core";
import { LAYOUT, easeInOut, simFrame } from "../sim/constants";
import { OptionalModel } from "../assets/AssetLoader";

const CUT_HALF_SPAN = 0.64; // kafa, emniyet için sacın biraz dışından başlar/biter
const HEAD_PARK_Z = -0.95;
const HALF_SHEET = LAYOUT.sheetWidth / 2;

export function cuttingHeadZ(state: MachineState, progress: number): number {
  if (state !== "CUTTING") return HEAD_PARK_Z;
  return -CUT_HALF_SPAN + easeInOut(progress) * CUT_HALF_SPAN * 2;
}

/**
 * Isı bölgesi (HAZ) shader'ı: sıcaklık, kafanın gerisindeki mesafeden
 * (kesim sürerken) ve kesim bittikten sonra geçen süreden (soğuma) hesaplanır.
 * Kafanın önü henüz kesilmediği için discard edilir — iz kafayla birlikte uzar.
 */
const SEAM_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SEAM_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uHeadZ;
  uniform float uCutEnd; // kesim bitiş anı; kesim sürerken -1
  varying vec2 vUv;

  void main() {
    // Plane -PI/2 X-rotasyonlu: uv.y=0 -> +z kenarı, uv.y=1 -> -z kenarı
    float z = mix(${HALF_SHEET}, ${-HALF_SHEET}, vUv.y);
    float behind = uHeadZ - z;
    if (behind < 0.0) discard; // henüz kesilmedi

    // Kafadan uzaklaştıkça soğur; kesim bitince tüm iz zamanla söner
    float temp = exp(-behind * 2.6);
    if (uCutEnd >= 0.0) temp *= exp(-(uTime - uCutEnd) * 1.35);

    vec3 white = vec3(1.0, 0.96, 0.82);
    vec3 orange = vec3(1.0, 0.42, 0.1);
    vec3 charred = vec3(0.07, 0.05, 0.045);
    vec3 hot = mix(orange, white, smoothstep(0.55, 1.0, temp));
    vec3 col = mix(charred, hot * (1.0 + 3.5 * temp), smoothstep(0.02, 0.3, temp));

    float across = smoothstep(0.5, 0.38, abs(vUv.x - 0.5)); // enine yumuşak kenar
    float alpha = across * (0.4 + 0.6 * smoothstep(0.0, 0.1, temp));
    gl_FragColor = vec4(col, alpha);
  }
`;

export function CuttingGantry() {
  const headRef = useRef<Group>(null!);
  const beamRef = useRef<Mesh>(null!);
  const lightRef = useRef<PointLight>(null!);
  const seamRef = useRef<Mesh>(null!);
  const lastStateRef = useRef<MachineState>("IDLE");

  const seamMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: SEAM_VERTEX,
        fragmentShader: SEAM_FRAGMENT,
        uniforms: { uTime: { value: 0 }, uHeadZ: { value: -HALF_SHEET }, uCutEnd: { value: -1 } },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      }),
    [],
  );
  useEffect(() => () => seamMaterial.dispose(), [seamMaterial]);

  useFrame(({ clock }) => {
    const state = machineStateStore.getState().state;
    const cutting = state === "CUTTING";
    const headZ = cuttingHeadZ(state, simFrame.progress);
    const time = clock.elapsedTime;

    headRef.current.position.z = headZ;
    beamRef.current.visible = cutting;
    lightRef.current.visible = cutting;
    lightRef.current.position.z = headZ;
    lightRef.current.intensity = cutting ? 10 + Math.random() * 5 : 0;

    seamMaterial.uniforms.uTime.value = time;
    if (cutting) {
      seamRef.current.visible = true;
      seamMaterial.uniforms.uHeadZ.value = Math.min(headZ, HALF_SHEET);
      seamMaterial.uniforms.uCutEnd.value = -1;
    } else {
      if (lastStateRef.current === "CUTTING") {
        seamMaterial.uniforms.uCutEnd.value = time; // soğuma başlasın
      }
      if (state === "FEEDING") {
        seamRef.current.visible = false; // yeni sac izi örter
      }
    }
    lastStateRef.current = state;
  });

  return (
    <group position={[LAYOUT.cutX, 0, 0]}>
      {/* Portal kolonları ve köprü */}
      <OptionalModel name="cutting-gantry">
        {([-1, 1] as const).map((side) => (
          <mesh key={side} position={[0, 0.95, side * 1.08]} castShadow>
            <boxGeometry args={[0.34, 1.9, 0.3]} />
            <meshStandardMaterial color="#27548f" metalness={0.45} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 1.86, 0]} castShadow>
          <boxGeometry args={[0.4, 0.26, 2.5]} />
          <meshStandardMaterial color="#2e5f9e" metalness={0.5} roughness={0.45} />
        </mesh>
      </OptionalModel>

      {/* Kesim kafası */}
      <group ref={headRef} position={[0, 0, HEAD_PARK_Z]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[0.26, 0.34, 0.26]} />
          <meshStandardMaterial color="#d8dde3" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.32, 0]}>
          <coneGeometry args={[0.06, 0.22, 20]} />
          <meshStandardMaterial color="#8b939d" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Lazer ışını */}
        <mesh ref={beamRef} position={[0, 1.05, 0]} visible={false}>
          <cylinderGeometry args={[0.016, 0.028, 0.42, 10]} />
          {/* toneMapped=false + doygun renk → bloom'da gerçek lazer koru */}
          <meshBasicMaterial color="#ffdf9e" toneMapped={false} transparent opacity={0.98} />
        </mesh>
      </group>
      <pointLight ref={lightRef} position={[0, 1.05, 0]} color="#ff9040" distance={4} visible={false} />

      {/* Isı bölgesi izi — sabit geometri, sıcaklık tamamen shader'da */}
      <mesh
        ref={seamRef}
        position={[0, LAYOUT.tableY + LAYOUT.sheetThickness + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[0.05, LAYOUT.sheetWidth]} />
        <primitive object={seamMaterial} attach="material" />
      </mesh>
    </group>
  );
}
