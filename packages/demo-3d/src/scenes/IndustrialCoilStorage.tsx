import { useState } from "react";
import { Html } from "@react-three/drei";

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
          emissiveIntensity={hovered ? 0.2 : 0}
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

/** Tavan Vinç Sistemi (Overhead Crane) */
function OverheadCrane() {
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

      {/* Gezen Köprü (Bridge) */}
      <group position={[0, 0.2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.4, 4.2]} />
          <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} /> {/* Dikkat Sarısı */}
        </mesh>
        {/* Vinç Motoru (Hoist) */}
        <mesh position={[0, -0.3, 0.5]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.5, 0.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Halat ve Kanca Sembolik */}
        <mesh position={[0, -1.3, 0.5]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, -2.4, 0.5]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
          <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
        </mesh>
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
