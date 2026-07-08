import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { AdditiveBlending, CanvasTexture, type Group, type MeshBasicMaterial, type Mesh } from "three";

/** Toz Boya / Yüzey İşlem Tüneli — kapalı hat: cam gözetleme pencereli
 * tünel gövdesi, içeride mor elektrostatik ışıma, tavan konveyöründe
 * asılı parçalar tünelden akar, çatıda egzoz fanları döner. */

const LEN = 14; // tünel uzunluğu (x lokal)
const TUNNEL = "#2b3442";
const VIOLET = "#a78bfa";

function labelTex(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 96;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#1a1030";
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = "#a78bfa";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 88);
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "bold 44px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TOZ BOYA HATTI — PWD-1", 256, 52);
  return new CanvasTexture(c);
}

/** Askı + parça: tavan konveyöründe LEN boyunca akar, tünel içinde
 * boyanmış (mor→final renk) görünür. */
function HangingPart({ offset, speed }: { offset: number; speed: number }) {
  const ref = useRef<Group>(null!);
  const partRef = useRef<Mesh>(null!);
  useFrame(({ clock }) => {
    const u = ((clock.elapsedTime * speed + offset) % LEN) - LEN / 2;
    ref.current.position.x = u;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.8 + offset) * 0.12;
    // Tünelin çıkış yarısında parça "boyanmış" — renk geçişi
    const painted = u > 0.5;
    (partRef.current.material as unknown as { color: { set: (c: string) => void } }).color.set(
      painted ? "#7c3aed" : "#9aa3af",
    );
  });
  return (
    <group ref={ref} position={[0, 0, 0]}>
      {/* Askı çubuğu */}
      <mesh position={[0, 2.35, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.85, 6]} />
        <meshStandardMaterial color="#4a5560" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Asılı panel parçası */}
      <mesh ref={partRef} position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[0.55, 0.8, 0.05]} />
        <meshStandardMaterial color="#9aa3af" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function RoofFan({ x }: { x: number }) {
  const bladeRef = useRef<Group>(null!);
  useFrame(({ clock }) => {
    bladeRef.current.rotation.y = clock.elapsedTime * 6;
  });
  return (
    <group position={[x, 3.6, 0]}>
      <mesh castShadow={false}>
        <cylinderGeometry args={[0.45, 0.55, 0.5, 14]} />
        <meshStandardMaterial color="#20262e" metalness={0.55} roughness={0.5} />
      </mesh>
      <group ref={bladeRef} position={[0, 0.28, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0.4]}>
            <boxGeometry args={[0.62, 0.02, 0.14]} />
            <meshStandardMaterial color="#39424e" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function CoatingTunnel({ position = [2, 0, -24.5] as [number, number, number] }) {
  const tex = useMemo(labelTex, []);
  const glowRef = useRef<Mesh>(null!);
  useFrame(({ clock }) => {
    // Elektrostatik ışıma nefes alır
    (glowRef.current.material as MeshBasicMaterial).opacity = 0.16 + 0.07 * Math.sin(clock.elapsedTime * 2.1);
  });

  return (
    <group position={position}>
      {/* Tünel gövdesi — iki uç açık (parça akışı görünür) */}
      <RoundedBox args={[LEN, 3.0, 2.6]} radius={0.1} smoothness={3} position={[0, 1.7, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TUNNEL} metalness={0.5} roughness={0.5} />
      </RoundedBox>
      {/* Uç portalları (giriş/çıkış ağızları) — koyu iç */}
      {([-LEN / 2, LEN / 2] as const).map((x) => (
        <mesh key={x} position={[x + (x < 0 ? 0.02 : -0.02), 1.6, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.1, 2.4]} />
          <meshBasicMaterial color="#0b0614" toneMapped={false} />
        </mesh>
      ))}
      {/* İç mor ışıma — uçlardan taşan elektrostatik parıltı */}
      <mesh ref={glowRef} position={[0, 1.6, 0]} userData={{ noXray: true }}>
        <boxGeometry args={[LEN - 0.3, 2.2, 2.2]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.16} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Cam gözetleme pencereleri — ön yüz */}
      {[-4.5, 0, 4.5].map((x) => (
        <mesh key={x} position={[x, 1.75, 1.32]}>
          <planeGeometry args={[2.2, 0.9]} />
          <meshStandardMaterial color="#3b2a63" emissive={VIOLET} emissiveIntensity={0.8} transparent opacity={0.75} metalness={0.1} roughness={0.08} />
        </mesh>
      ))}
      {/* Tavan konveyör rayı — tünelin içinden geçer, iki uçtan taşar */}
      <mesh position={[0, 2.8, 0]} castShadow={false}>
        <boxGeometry args={[LEN + 5, 0.14, 0.14]} />
        <meshStandardMaterial color="#4a5560" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Ray taşıyıcı ayaklar (tünel dışında) */}
      {([-LEN / 2 - 2.2, LEN / 2 + 2.2] as const).map((x) => (
        <mesh key={x} position={[x, 1.4, 0]} castShadow>
          <boxGeometry args={[0.16, 2.8, 0.16]} />
          <meshStandardMaterial color="#39424e" metalness={0.6} roughness={0.45} />
        </mesh>
      ))}
      {/* Akış halindeki asılı parçalar */}
      {[0, 2.4, 4.8, 7.2, 9.6, 12].map((off, i) => (
        <HangingPart key={i} offset={off} speed={0.55} />
      ))}
      {/* Çatı egzoz fanları */}
      {[-4, 0.5, 5].map((x) => (
        <RoofFan key={x} x={x} />
      ))}
      {/* Hat tabelası */}
      <mesh position={[0, 3.35, 1.32]}>
        <planeGeometry args={[4.6, 0.85]} />
        <meshStandardMaterial map={tex} emissive="#2a1a4a" emissiveIntensity={0.7} roughness={0.6} />
      </mesh>
      {/* Neon taban — mor imza */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noXray: true }}>
        <planeGeometry args={[LEN + 2, 4.6]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.05} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
