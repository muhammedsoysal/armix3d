import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { AdditiveBlending, type Group, type Mesh, type MeshBasicMaterial, type PointLight } from "three";

/** Robotik Kaynak Hücresi — 6 eksenli robot kolu (taban→omuz→dirsek→bilek),
 * çit + cam güvenlik panelleri, ve kaynak anında patlayan mavi-beyaz ark
 * flaşı (PointLight + additive çekirdek). İki hücre faz farklı çalışır. */

const ARM = "#e8890c"; // ABB turuncusu
const DARK = "#1c1f24";
const STEEL = "#39424e";

function Fence({ w, d }: { w: number; d: number }) {
  const posts: [number, number][] = [];
  const nx = Math.round(w / 1.4);
  const nz = Math.round(d / 1.4);
  for (let i = 0; i <= nx; i++) posts.push([-w / 2 + (i * w) / nx, -d / 2], [-w / 2 + (i * w) / nx, d / 2]);
  for (let j = 1; j < nz; j++) posts.push([-w / 2, -d / 2 + (j * d) / nz], [w / 2, -d / 2 + (j * d) / nz]);
  return (
    <group>
      {posts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.65, z]} castShadow={false}>
          <boxGeometry args={[0.06, 1.3, 0.06]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.55} />
        </mesh>
      ))}
      {/* Cam güvenlik panelleri (koyu kaynak camı — yeşilimsi) */}
      {([[0, -d / 2, w, 0], [0, d / 2, w, 0], [-w / 2, 0, d, Math.PI / 2], [w / 2, 0, d, Math.PI / 2]] as const).map(
        ([x, z, len, rot], i) => (
          <mesh key={`g${i}`} position={[x, 0.72, z]} rotation={[0, rot, 0]}>
            <planeGeometry args={[len, 1.0]} />
            <meshStandardMaterial
              color="#1a3a2e"
              transparent
              opacity={0.38}
              metalness={0.1}
              roughness={0.05}
              depthWrite={false}
            />
          </mesh>
        ),
      )}
    </group>
  );
}

/** Tek robot kolu + döner pozisyoner masa + ark flaşı. `phase`: hücreler
 * arası zaman kayması (senkron robotlar sahte görünür). */
function RobotArm({ phase }: { phase: number }) {
  const shoulderRef = useRef<Group>(null!);
  const elbowRef = useRef<Group>(null!);
  const wristRef = useRef<Group>(null!);
  const baseRef = useRef<Group>(null!);
  const arcRef = useRef<Mesh>(null!);
  const lightRef = useRef<PointLight>(null!);
  const tableRef = useRef<Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    // 8 sn'lik çevrim: 0-5.5 kaynak (küçük hızlı gezinme), 5.5-8 yeniden konumlanma
    const cyc = t % 8;
    const welding = cyc < 5.5;
    const sweep = welding ? Math.sin(t * 1.7) * 0.35 : Math.sin(cyc * 1.2) * 1.1;
    baseRef.current.rotation.y = sweep * 0.5 + 0.4;
    shoulderRef.current.rotation.z = -0.55 + (welding ? Math.sin(t * 2.3) * 0.08 : 0.25);
    elbowRef.current.rotation.z = 1.05 + (welding ? Math.cos(t * 2.1) * 0.12 : -0.35);
    wristRef.current.rotation.z = 0.6 + Math.sin(t * 3.1) * 0.15;
    tableRef.current.rotation.y = t * 0.12;
    // Ark: kaynak sırasında sert rastgele flaş (50 Hz titrek his — sin karışımı)
    const flick = Math.max(0, Math.sin(t * 31) * Math.sin(t * 17.3) * Math.sin(t * 7.7));
    const on = welding ? flick : 0;
    (arcRef.current.material as MeshBasicMaterial).opacity = on * 0.95;
    lightRef.current.intensity = on * 26;
  });

  return (
    <group>
      {/* Robot kaidesi */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.42, 0.44, 18]} />
        <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.4} />
      </mesh>
      <group ref={baseRef} position={[0, 0.44, 0]}>
        {/* Omuz gövdesi */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.3, 0.36, 16]} />
          <meshStandardMaterial color={ARM} metalness={0.45} roughness={0.35} />
        </mesh>
        <group ref={shoulderRef} position={[0, 0.36, 0]}>
          {/* Üst kol */}
          <RoundedBox args={[0.3, 1.15, 0.34]} radius={0.06} smoothness={3} position={[0, 0.55, 0]} castShadow>
            <meshStandardMaterial color={ARM} metalness={0.45} roughness={0.35} />
          </RoundedBox>
          <group ref={elbowRef} position={[0, 1.12, 0]}>
            {/* Dirsek eklemi */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.19, 0.19, 0.42, 14]} />
              <meshStandardMaterial color={DARK} metalness={0.55} roughness={0.4} />
            </mesh>
            {/* Ön kol */}
            <RoundedBox args={[0.24, 0.95, 0.26]} radius={0.05} smoothness={3} position={[0, 0.46, 0]} castShadow>
              <meshStandardMaterial color={ARM} metalness={0.45} roughness={0.35} />
            </RoundedBox>
            <group ref={wristRef} position={[0, 0.92, 0]}>
              {/* Bilek + tork kaynak tabancası */}
              <mesh castShadow>
                <sphereGeometry args={[0.13, 12, 10]} />
                <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.35} />
              </mesh>
              <mesh position={[0.16, 0.1, 0]} rotation={[0, 0, -0.9]} castShadow>
                <cylinderGeometry args={[0.045, 0.028, 0.42, 10]} />
                <meshStandardMaterial color="#8a94a2" metalness={0.75} roughness={0.25} />
              </mesh>
              {/* ARK — additive çekirdek + gerçek ışık */}
              <mesh ref={arcRef} position={[0.32, 0.22, 0]} userData={{ noXray: true }}>
                <sphereGeometry args={[0.09, 10, 8]} />
                <meshBasicMaterial color="#dbeafe" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>
              <pointLight ref={lightRef} position={[0.32, 0.22, 0]} color="#9db8ff" intensity={0} distance={9} decay={2} />
            </group>
          </group>
        </group>
      </group>
      {/* Döner pozisyoner masa + iş parçası */}
      <group ref={tableRef} position={[1.15, 0, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.52, 0.6, 0.6, 18]} />
          <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.68, 0]} castShadow>
          <boxGeometry args={[0.75, 0.16, 0.45]} />
          <meshStandardMaterial color="#aeb6c2" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.82, 0]} castShadow>
          <boxGeometry args={[0.4, 0.14, 0.3]} />
          <meshStandardMaterial color="#8a94a2" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/** İki hücreli robotik kaynak departmanı (doğu kanadı). */
export function WeldingCells({ position = [29, 0, -14] as [number, number, number] }) {
  return (
    <group position={position}>
      {([[-3.2, 0], [3.2, 3.9]] as const).map(([dx, ph], i) => (
        <group key={i} position={[dx, 0, 0]}>
          <RobotArm phase={ph} />
          <Fence w={5.4} d={4.6} />
          {/* Hücre neon tabanı — kaynak turuncusu */}
          <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noXray: true }}>
            <planeGeometry args={[5.0, 4.2]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.06} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* Departman kontrol kabini — cam panel */}
      <group position={[0, 0, 3.4]}>
        <RoundedBox args={[2.2, 1.9, 1.1]} radius={0.08} smoothness={3} position={[0, 0.95, 0]} castShadow>
          <meshStandardMaterial color="#252c36" metalness={0.5} roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 1.25, -0.56]}>
          <planeGeometry args={[1.8, 0.8]} />
          <meshStandardMaterial color="#5b7ea6" emissive="#a9c6e8" emissiveIntensity={0.4} metalness={0.2} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}
