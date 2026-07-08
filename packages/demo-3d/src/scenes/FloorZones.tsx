import { useMemo } from "react";
import { CanvasTexture } from "three";

/** Epoksi zemin bölgeleri: renk-tonlu yamalar + boyalı kenar + stencil kod.
 * Grid'in ALTINDA (y 0.004) — "işletilen tesis" hissinin bel kemiği. */

function stencil(code: string): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, 256, 128);
  ctx.font = "bold 96px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(226,232,240,0.5)";
  ctx.fillText(code, 128, 68);
  return new CanvasTexture(c);
}

function Zone({
  x,
  z,
  w,
  d,
  color,
  code,
  border = "#8a93a0",
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
  code?: string;
  border?: string;
}) {
  const tex = useMemo(() => (code ? stencil(code) : null), [code]);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={color} roughness={0.92} metalness={0.05} transparent opacity={0.85} />
      </mesh>
      {/* Boyalı kenar çizgisi */}
      {([[0, d / 2 - 0.06, w, 0.12], [0, -d / 2 + 0.06, w, 0.12], [w / 2 - 0.06, 0, 0.12, d], [-w / 2 + 0.06, 0, 0.12, d]] as const).map(
        ([bx, bz, bw, bd], i) => (
          <mesh key={i} position={[bx, 0.0045, bz]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[bw, bd]} />
            <meshStandardMaterial color={border} roughness={0.9} transparent opacity={0.5} />
          </mesh>
        ),
      )}
      {tex && (
        <mesh position={[-w / 2 + 1.6, 0.005, -d / 2 + 1.0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.4, 1.2]} />
          <meshBasicMaterial map={tex} transparent depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

export function FloorZones() {
  return (
    <group>
      {/* Ana üretim hattı — gri-mavi epoksi */}
      <Zone x={-1.5} z={-0.2} w={19} d={5.6} color="#151b26" code="A1" />
      {/* Rulo deposu — koyu kahve-gri */}
      <Zone x={-9.5} z={-9} w={12} d={9.5} color="#1a1712" code="B1" border="#7a6a4a" />
      {/* Yarma hattı */}
      <Zone x={-5.4} z={3.6} w={8.5} d={3.2} color="#141e22" code="A2" />
      {/* Lazer + pres istasyon adası */}
      <Zone x={3.2} z={-3.9} w={8} d={3.4} color="#161d29" code="A3" />
      {/* Bitmiş ürün deposu — yeşilimsi sevkiyat epoksisi */}
      <Zone x={10.6} z={-4.8} w={7.6} d={10} color="#121d18" code="C1" border="#4a7a5a" />
      {/* Yaya yolu — yeşil bant (koridor kuzeyi) */}
      <mesh position={[-2, 0.0042, 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 1.1]} />
        <meshStandardMaterial color="#0e2417" roughness={0.9} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
