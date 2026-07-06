import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, NormalBlending, ShaderMaterial } from "three";
import { useStore } from "zustand";
import { machineStateStore } from "@metalnest/core";
import { LAYOUT, simFrame } from "../sim/constants";
import { qualityStore } from "../quality/qualityStore";
import { cuttingHeadZ } from "./CuttingGantry";

/** Kesim dumanı: yükselip genişleyen, sönümlenen yumuşak parçacıklar (GPU). */

const VERTEX = /* glsl */ `
  attribute vec3 aVel;
  attribute float aT0;
  attribute float aLife;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vT;

  void main() {
    float t = uTime - aT0;
    vT = clamp(t / aLife, 0.0, 1.0);
    if (t < 0.0 || t > aLife) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }
    // Yukarı süzülme + türbülans kıvrımı
    vec3 p = position + aVel * t;
    p.x += sin(t * 2.2 + aSeed * 12.0) * 0.06 * t;
    p.z += cos(t * 1.7 + aSeed * 9.0) * 0.05 * t;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = (0.35 + 2.4 * vT) * (0.8 + 0.4 * aSeed);
    gl_PointSize = size * 42.0 * uPixelRatio * (5.0 / -mv.z);
  }
`;

const FRAGMENT = /* glsl */ `
  varying float vT;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    float soft = smoothstep(0.5, 0.08, r);
    float alpha = soft * smoothstep(0.0, 0.12, vT) * (1.0 - vT) * 0.16;
    vec3 col = mix(vec3(0.45, 0.36, 0.3), vec3(0.32, 0.33, 0.36), vT);
    gl_FragColor = vec4(col, alpha);
  }
`;

export function Smoke() {
  const count = useStore(qualityStore, (s) => s.params.smokeCount);
  const cursorRef = useRef(0);
  const emitAccRef = useRef(0);

  const resources = useMemo(() => {
    if (count === 0) return null;
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aVel", new BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aT0", new BufferAttribute(new Float32Array(count).fill(-1e6), 1));
    geo.setAttribute("aLife", new BufferAttribute(new Float32Array(count).fill(1), 1));
    geo.setAttribute("aSeed", new BufferAttribute(new Float32Array(count), 1));
    const mat = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
    });
    return { geometry: geo, material: mat };
  }, [count]);

  useEffect(() => {
    return () => {
      resources?.geometry.dispose();
      resources?.material.dispose();
    };
  }, [resources]);

  useFrame(({ clock, gl }, dt) => {
    if (!resources) return;
    const { geometry, material } = resources;
    const time = clock.elapsedTime;
    material.uniforms.uTime.value = time;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();

    if (machineStateStore.getState().state !== "CUTTING") {
      emitAccRef.current = 0;
      return;
    }

    emitAccRef.current += 14 * Math.min(dt, 0.05);
    const emit = Math.floor(emitAccRef.current);
    if (emit === 0) return;
    emitAccRef.current -= emit;

    const headZ = cuttingHeadZ("CUTTING", simFrame.progress);
    const pos = geometry.attributes.position.array as Float32Array;
    const vel = geometry.attributes.aVel.array as Float32Array;
    const t0 = geometry.attributes.aT0.array as Float32Array;
    const life = geometry.attributes.aLife.array as Float32Array;
    const seed = geometry.attributes.aSeed.array as Float32Array;

    for (let n = 0; n < emit; n++) {
      const i = cursorRef.current;
      cursorRef.current = (i + 1) % count;
      pos[i * 3] = LAYOUT.cutX + (Math.random() - 0.5) * 0.05;
      pos[i * 3 + 1] = LAYOUT.tableY + 0.04;
      pos[i * 3 + 2] = headZ + (Math.random() - 0.5) * 0.06;
      vel[i * 3] = (Math.random() - 0.5) * 0.12;
      vel[i * 3 + 1] = 0.3 + Math.random() * 0.35;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
      t0[i] = time;
      life[i] = 1.5 + Math.random() * 1.2;
      seed[i] = Math.random();
    }
    for (const name of ["position", "aVel", "aT0", "aLife", "aSeed"]) {
      geometry.attributes[name].needsUpdate = true;
    }
  });

  if (!resources) return null;
  return (
    <points geometry={resources.geometry} frustumCulled={false}>
      <primitive object={resources.material} attach="material" />
    </points>
  );
}
