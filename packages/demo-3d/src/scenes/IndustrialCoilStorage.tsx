import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group, Mesh } from "three";

/** Bobin verileri */
const coilsData = [
  { id: "C1", z: -3.5, x: -4, radius: 0.85, width: 1.2, color: "#aab1ba", matProps: { metalness: 0.95, roughness: 0.15 }, material: "304 BA Paslanmaz", thickness: "1.5mm", quantity: 24, useCase: "Asansör Kapı Paneli" },
  { id: "C2", z: -3.5, x: -1.5, radius: 0.95, width: 1.5, color: "#8b949e", matProps: { metalness: 0.85, roughness: 0.4 }, material: "316L Paslanmaz", thickness: "2.0mm", quantity: 12, useCase: "Gıda Endüstrisi Tank" },
  { id: "C3", z: -3.5, x: 1, radius: 0.75, width: 1.0, color: "#9ba4b5", matProps: { metalness: 0.9, roughness: 0.25 }, material: "430 2B Paslanmaz", thickness: "1.0mm", quantity: 45, useCase: "Davlumbaz Gövdesi" },
  { id: "C4", z: -5.5, x: -3, radius: 1.05, width: 1.2, color: "#7a828a", matProps: { metalness: 0.8, roughness: 0.5 }, material: "304 Paslanmaz", thickness: "3.0mm", quantity: 8, useCase: "Ağır Makine Şasi" },
  { id: "C5", z: -5.5, x: -0.5, radius: 0.8, width: 1.5, color: "#c6cbd1", matProps: { metalness: 0.98, roughness: 0.1 }, material: "304 SB Paslanmaz", thickness: "1.2mm", quantity: 30, useCase: "Mimari Dekorasyon" },
];

function InteractiveCoil({ coil }: { coil: typeof coilsData[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group 
      position={[coil.x, coil.radius + 0.3, coil.z]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      {/* Rulo Gövdesi */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[coil.radius, coil.radius, coil.width, 48]} />
        <meshStandardMaterial 
          color={coil.color} 
          metalness={coil.matProps.metalness} 
          roughness={coil.matProps.roughness}
          emissive={hovered ? "#38bdf8" : "#000000"}
          emissiveIntensity={hovered ? 3.5 : 0}
        />
      </mesh>
      
      {/* Ortasındaki Boşluk / Mil Deliği */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, coil.width + 0.02, 32]} />
        <meshStandardMaterial color="#1a1c20" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* HTML Hover Kartı */}
      {hovered && (
        <Html position={[0, coil.radius + 0.5, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-gradient-to-br from-black/90 to-sky-950/90 border border-sky-500/40 rounded-xl p-4 shadow-[0_0_30px_rgba(14,165,233,0.3)] backdrop-blur-md w-64 text-white font-sans animate-in fade-in zoom-in duration-200 pointer-events-none select-none">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">{coil.id} STOK RULOSU</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Malzeme:</span>
                <span className="text-sm font-semibold">{coil.material}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Kalınlık:</span>
                <span className="text-sm font-mono">{coil.thickness}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Mevcut Stok:</span>
                <span className="text-sm font-mono text-emerald-400">{coil.quantity} Adet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Kullanım:</span>
                <span className="text-xs bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded border border-sky-500/30 truncate max-w-[120px]">{coil.useCase}</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/** 
 * Ağır Hizmet Çelik Raf Sistemi (Industrial Heavy Duty Racks)
 * Takozların yerini alan endüstriyel çelik konstrüksiyon.
 */
function SteelRacks() {
  const rackPositions = [
    { z: -3.5, length: 7 },
    { z: -5.5, length: 7 }
  ];

  return (
    <group>
      {rackPositions.map((r, idx) => (
        <group key={`rack-${idx}`} position={[-1.5, 0, r.z]}>
          {/* Ana Yatay Taşıyıcı Kirişler (Beam) */}
          <mesh position={[0, 0.25, -0.4]} castShadow receiveShadow>
            <boxGeometry args={[r.length, 0.15, 0.15]} />
            <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.4} /> {/* Endüstriyel Sarı/Turuncu */}
          </mesh>
          <mesh position={[0, 0.25, 0.4]} castShadow receiveShadow>
            <boxGeometry args={[r.length, 0.15, 0.15]} />
            <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.4} />
          </mesh>

          {/* Dikey Ayaklar (Upright Frames) */}
          {[-3, -1, 1, 3].map((xOffset, i) => (
            <group key={`upright-${i}`} position={[xOffset, 0, 0]}>
              <mesh position={[0, 0.6, -0.45]} castShadow receiveShadow>
                <boxGeometry args={[0.12, 1.2, 0.12]} />
                <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.6} /> {/* Koyu Çelik */}
              </mesh>
              <mesh position={[0, 0.6, 0.45]} castShadow receiveShadow>
                <boxGeometry args={[0.12, 1.2, 0.12]} />
                <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.6} />
              </mesh>
              {/* Çapraz Bağlantılar (Bracing) */}
              <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 4, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.08, 1.0, 0.05]} />
                <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.6} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Faz zaman çizelgesi yardımcıları: [t0,t1] aralığında 0→1 smoothstep. */
function phase(t: number, t0: number, t1: number): number {
  const u = Math.min(Math.max((t - t0) / (t1 - t0), 0), 1);
  return u * u * (3 - 2 * u);
}

/** Tavan Vinç Sistemi (Overhead Crane) — CANLI: 40 sn'lik döngüde köprü
 * raflar üzerinde gezer, kancayı indirir, bir ruloyu kaldırıp diğer raf
 * hattına aktarır (ikmal gösterisi). Tamamen zaman çizelgesi güdümlü. */
function OverheadCrane() {
  const bridgeRef = useRef<Group>(null!);
  const ropeRef = useRef<Mesh>(null!);
  const hookRef = useRef<Group>(null!);
  const coilRef = useRef<Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime % 40;

    // Köprü x: 0 → -2 (alış) → +2 (bırakış) → 0
    const x = -2 * phase(t, 6, 10) + 4 * phase(t, 17, 22) - 2 * phase(t, 29, 33);
    bridgeRef.current.position.x = x;

    // Halat uzunluğu: alışta ve bırakışta iner (3.4 m), taşırken kısa (1.0 m)
    const down1 = phase(t, 10, 13) - phase(t, 14, 17);
    const down2 = phase(t, 22, 25) - phase(t, 26, 29);
    const L = 1.0 + 2.4 * Math.max(down1, down2);
    ropeRef.current.scale.y = L / 2;
    ropeRef.current.position.y = -0.55 - L / 2;
    hookRef.current.position.y = -0.55 - L;

    // Taşınan rulo: kaldırma (14 sn) ile bırakma (25 sn) arasında kancada
    coilRef.current.visible = t >= 14 && t < 25;
  });

  return (
    <group position={[-1.5, 5, -4.5]}>
      {/* İki taraftaki yürüme yolları (Runway Beams) */}
      <mesh position={[0, 0, -2]} castShadow receiveShadow>
        <boxGeometry args={[8, 0.3, 0.3]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 2]} castShadow receiveShadow>
        <boxGeometry args={[8, 0.3, 0.3]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* Gezen Köprü (Bridge) — animasyonlu */}
      <group ref={bridgeRef} position={[0, 0.2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.4, 4.2]} />
          <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Vinç Motoru (Hoist) */}
        <mesh position={[0, -0.3, 0.5]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.5, 0.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Halat: üst ucu sabit, uzayıp kısalır */}
        <mesh ref={ropeRef} position={[0, -1.05, 0.5]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Kanca + C-çengel + taşınan rulo */}
        <group ref={hookRef} position={[0, -1.55, 0.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
            <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.18, 0]} castShadow>
            <boxGeometry args={[0.5, 0.08, 0.12]} />
            <meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh ref={coilRef} position={[0, -0.42, 0]} rotation={[0, 0, Math.PI / 2]} visible={false} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.6, 28]} />
            <meshStandardMaterial color="#9aa2ad" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Bekleyen rulo stok alanı ana bileşeni */
export function IndustrialCoilStorage() {
  return (
    <group>
      <SteelRacks />
      <OverheadCrane />
      {coilsData.map((coil) => (
        <InteractiveCoil key={coil.id} coil={coil} />
      ))}
    </group>
  );
}
