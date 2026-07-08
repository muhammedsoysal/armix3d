import { useMemo } from "react";
import { CanvasTexture, FrontSide } from "three";

/**
 * Fabrika binası — tesis artık boşlukta yüzmüyor.
 * CUTAWAY hilesi: duvarlar İÇE bakan tek yüzlü (FrontSide) → kamera dışarı
 * çıkınca duvar görünmez olur, içerisi maket gibi açılır. Çatı gölge
 * FIRLATMAZ (castShadow=false) — mevcut aydınlatma düzeni bozulmaz.
 * Draw-call bütçesi: ~70 mesh + 4 Text.
 */

// Bina zarfı (dünya koordinatları)
const X0 = -30;
const X1 = 30;
const Z0 = -22; // arka
const Z1 = 14; // ön (açık cephe — dok çıkışı buradan)
const H = 13; // saçak yüksekliği — endüstriyel kompleks ölçeği
const WIN_Y = 4.2; // pencere bandı merkezi
const WIN_H = 1.3;

const WALL = "#252c36";
const WALL_DARK = "#1c222b";
const STEEL = "#39424e";
const GLASS = "#5b7ea6";

/** İçe bakan duvar paneli: alt gövde + pencere bandı + üst gövde. */
function Wall({
  cx,
  cz,
  len,
  rotY,
  windows = true,
}: {
  cx: number;
  cz: number;
  len: number;
  rotY: number;
  windows?: boolean;
}) {
  const lowH = WIN_Y - WIN_H / 2;
  const topY = WIN_Y + WIN_H / 2;
  const topH = H - topY;
  return (
    <group position={[cx, 0, cz]} rotation={[0, rotY, 0]}>
      <mesh position={[0, lowH / 2, 0]} receiveShadow>
        <planeGeometry args={[len, lowH]} />
        <meshStandardMaterial color={WALL} roughness={0.9} side={FrontSide} />
      </mesh>
      {windows ? (
        <mesh position={[0, WIN_Y, 0]}>
          <planeGeometry args={[len, WIN_H]} />
          <meshStandardMaterial
            color={GLASS}
            emissive="#a9c6e8"
            emissiveIntensity={0.35}
            metalness={0.2}
            roughness={0.15}
            side={FrontSide}
          />
        </mesh>
      ) : (
        <mesh position={[0, WIN_Y, 0]}>
          <planeGeometry args={[len, WIN_H]} />
          <meshStandardMaterial color={WALL_DARK} roughness={0.9} side={FrontSide} />
        </mesh>
      )}
      <mesh position={[0, topY + topH / 2, 0]}>
        <planeGeometry args={[len, topH]} />
        <meshStandardMaterial color={WALL_DARK} roughness={0.9} side={FrontSide} />
      </mesh>
    </group>
  );
}

/** Çatı makası: alt/üst başlık + 3 diyagonal (x eksenine dik, z boyunca). */
function Truss({ x }: { x: number }) {
  const span = Z1 - Z0;
  const cz = (Z0 + Z1) / 2;
  return (
    <group position={[x, H - 0.55, cz]}>
      <mesh>
        <boxGeometry args={[0.12, 0.12, span]} />
        <meshStandardMaterial color={STEEL} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.12, 0.12, span]} />
        <meshStandardMaterial color={STEEL} metalness={0.5} roughness={0.5} />
      </mesh>
      {[-span / 3, 0, span / 3].map((z) => (
        <mesh key={z} position={[0, 0.45, z]} rotation={[Math.PI / 5, 0, 0]}>
          <boxGeometry args={[0.08, 0.08, 1.35]} />
          <meshStandardMaterial color={STEEL} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Duvar tabelası — canvas dokusu (CDN font YOK: offline kiosk kuralı). */
function Sign({ pos, rotY, label }: { pos: [number, number, number]; rotY: number; label: string }) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 112;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 512, 112);
    ctx.strokeStyle = "#e8b93c";
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 500, 100);
    ctx.fillStyle = "#e8b93c";
    ctx.font = "bold 52px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 256, 60);
    return new CanvasTexture(c);
  }, [label]);
  return (
    <mesh position={pos} rotation={[0, rotY, 0]}>
      <planeGeometry args={[3.6, 0.8]} />
      <meshStandardMaterial map={texture} emissive="#3a2f0e" emissiveIntensity={0.6} roughness={0.6} side={FrontSide} />
    </mesh>
  );
}

/** Zemin güvenlik şeridi (sarı boya). */
function FloorLine({ x, z, w, l }: { x: number; z: number; w: number; l: number }) {
  return (
    <mesh position={[x, 0.006, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, l]} />
      <meshStandardMaterial color="#c9a227" roughness={0.85} />
    </mesh>
  );
}

export function FactoryBuilding() {
  const W = X1 - X0;
  const D = Z1 - Z0;
  const cx = (X0 + X1) / 2;
  const cz = (Z0 + Z1) / 2;
  // Işıklık konumları — VolumetricShafts.SHAFTS ile hizalı
  const skylights: [number, number][] = [
    [0, 0],
    [-6, -2],
    [4.2, 1],
    [-14, -8],
    [12, -6],
    [-22, -14],
    [20, 4],
  ];

  return (
    <group>
      {/* DUVARLAR (içe bakan): arka, sol, sağ — ön cephe açık (cutaway + dok çıkışı) */}
      <Wall cx={cx} cz={Z0} len={W} rotY={0} />
      <Wall cx={X0} cz={cz} len={D} rotY={Math.PI / 2} />
      <Wall cx={X1} cz={cz} len={D} rotY={-Math.PI / 2} />

      {/* Duvar kolonları (arka duvar boyunca, iç tarafta) */}
      {Array.from({ length: 13 }, (_, i) => X0 + 2 + i * (W / 13)).map((x) => (
        <mesh key={x} position={[x, H / 2, Z0 + 0.15]} castShadow={false}>
          <boxGeometry args={[0.3, H, 0.3]} />
          <meshStandardMaterial color={STEEL} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}

      {/* ÇATI: gölge fırlatmaz, içeriden görünür koyu panel */}
      <mesh position={[cx, H + 0.45, cz]} rotation={[Math.PI / 2, 0, 0]} castShadow={false}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#161b22" roughness={0.95} side={FrontSide} />
      </mesh>
      {/* Oluklu görünüm: çatı altı uzun şeritler */}
      {Array.from({ length: 9 }, (_, i) => Z0 + (i + 0.5) * (D / 9)).map((z) => (
        <mesh key={z} position={[cx, H + 0.38, z]} castShadow={false}>
          <boxGeometry args={[W, 0.06, 0.5]} />
          <meshStandardMaterial color="#10151c" roughness={0.95} />
        </mesh>
      ))}
      {/* Makaslar */}
      {[-26, -18.5, -11, -3.5, 4, 11.5, 19, 26.5].map((x) => (
        <Truss key={x} x={x} />
      ))}

      {/* IŞIKLIKLAR: volumetrik hüzmelerin kaynağı — parlak emissive paneller */}
      {skylights.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, H + 0.4, z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.4, 2.4]} />
          <meshBasicMaterial color="#dfe9ff" toneMapped={false} side={FrontSide} />
        </mesh>
      ))}

      {/* DOK KAPISI: ön cephede kamyonun çıktığı portal + yarı açık kepenk */}
      <group position={[15.5, 0, Z1]}>
        {([-2.2, 2.2] as const).map((dx) => (
          <mesh key={dx} position={[dx, 2.6, 0]} castShadow={false}>
            <boxGeometry args={[0.4, 5.2, 0.4]} />
            <meshStandardMaterial color="#b45309" metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 5.0, 0]} castShadow={false}>
          <boxGeometry args={[4.8, 0.5, 0.5]} />
          <meshStandardMaterial color="#b45309" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Yarı açık kepenk */}
        <mesh position={[0, 4.35, 0]}>
          <boxGeometry args={[4.4, 1.3, 0.08]} />
          <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.45} />
        </mesh>
      </group>

      {/* TABELALAR */}
      <Sign pos={[-2, 6.4, Z0 + 0.2]} rotY={0} label="SAHA 1 — KESİM" />
      <Sign pos={[X0 + 0.2, 6.4, -6]} rotY={Math.PI / 2} label="RULO DEPOSU" />
      <Sign pos={[X1 - 0.2, 6.4, -2]} rotY={-Math.PI / 2} label="SEVKİYAT" />
      <Sign pos={[X1 - 0.2, 6.4, 4]} rotY={-Math.PI / 2} label="DOK 1" />

      {/* ZEMİN GÜVENLİK ŞERİTLERİ: koridor kenarları + yaya geçidi */}
      <FloorLine x={0} z={3.0} w={22} l={0.12} />
      <FloorLine x={0} z={1.4} w={22} l={0.12} />
      {/* Yaya geçidi (zebra) — operatör rotası üzerinde */}
      {Array.from({ length: 5 }, (_, i) => -1.2 + i * 0.55).map((x) => (
        <FloorLine key={x} x={x} z={2.2} w={0.3} l={1.4} />
      ))}
    </group>
  );
}
