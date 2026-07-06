import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from "three";
import { useStore } from "zustand";
import { machineStateStore } from "@metalnest/core";
import { LAYOUT, simFrame } from "../sim/constants";
import { qualityStore } from "../quality/qualityStore";
import { cuttingHeadZ } from "./CuttingGantry";

/**
 * GPU kıvılcım sistemi: partikül konumu vertex shader'da balistik olarak
 * (p = p₀ + v₀t + ½gt², tek analitik zemin sekmesi dahil) hesaplanır.
 * CPU her frame yalnızca yeni doğan partiküllerin başlangıç değerlerini yazar —
 * entegrasyon maliyeti GPU'dadır, sayı kaliteye göre 600↔8000 ölçeklenir.
 */

const VERTEX = /* glsl */ `
  attribute vec3 aVel;
  attribute float aT0;
  attribute float aLife;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vT;
  varying float vSeed;

  const float G = -9.8;
  const float FLOOR_Y = 0.015;
  const float BOUNCE_DAMP = 0.33;

  void main() {
    float t = uTime - aT0;
    vT = clamp(t / aLife, 0.0, 1.0);
    vSeed = aSeed;
    if (t < 0.0 || t > aLife) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    vec3 p = position + aVel * t + vec3(0.0, 0.5 * G * t * t, 0.0);

    // Analitik tek sekme: zemine çarpma anını çöz, sonrasını yansıyan hızla sür
    float a = 0.5 * G;
    float b = aVel.y;
    float c0 = position.y - FLOOR_Y;
    float disc = b * b - 4.0 * a * c0;
    if (disc > 0.0) {
      float tHit = (-b - sqrt(disc)) / (2.0 * a);
      if (tHit > 0.0 && t > tHit) {
        vec3 vHit = aVel + vec3(0.0, G * tHit, 0.0);
        vec3 pHit = position + aVel * tHit + vec3(0.0, 0.5 * G * tHit * tHit, 0.0);
        vec3 v2 = vec3(vHit.x * 0.7, -vHit.y * BOUNCE_DAMP, vHit.z * 0.7);
        float t2 = t - tHit;
        p = pHit + v2 * t2 + vec3(0.0, 0.5 * G * t2 * t2, 0.0);
        if (p.y < FLOOR_Y) p.y = FLOOR_Y; // ikinci sekme yerine kor olarak yerde kal
      }
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = (1.0 - vT * 0.85) * (0.8 + 0.7 * aSeed);
    gl_PointSize = size * 10.0 * uPixelRatio * (5.0 / -mv.z);
  }
`;

const FRAGMENT = /* glsl */ `
  varying float vT;
  varying float vSeed;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, r);
    vec3 hot = vec3(1.0, 0.94, 0.72);
    vec3 mid = vec3(1.0, 0.58, 0.2);
    vec3 cool = vec3(0.72, 0.22, 0.06);
    vec3 col = mix(hot, mix(mid, cool, smoothstep(0.35, 1.0, vT)), smoothstep(0.0, 0.45, vT + vSeed * 0.1));
    gl_FragColor = vec4(col * (2.6 - 1.9 * vT), glow * (1.0 - vT));
  }
`;

export function Sparks() {
  const count = useStore(qualityStore, (s) => s.params.sparkCount);
  const cursorRef = useRef(0);
  const emitAccRef = useRef(0);

  const { geometry, material } = useMemo(() => {
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
      blending: AdditiveBlending,
    });
    return { geometry: geo, material: mat };
  }, [count]);

  // Kalite değişiminde eski buffer/materyal sızıntısız bırakılır
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(({ clock, gl }, dt) => {
    const time = clock.elapsedTime;
    material.uniforms.uTime.value = time;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();

    if (machineStateStore.getState().state !== "CUTTING") {
      emitAccRef.current = 0;
      return;
    }

    // Sabit yoğunluk: havuz, ortalama ömür (~0.8s) boyunca bir kez döner
    emitAccRef.current += (count / 0.8) * Math.min(dt, 0.05);
    const emit = Math.min(Math.floor(emitAccRef.current), 400);
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
      pos[i * 3] = LAYOUT.cutX + (Math.random() - 0.5) * 0.04;
      pos[i * 3 + 1] = LAYOUT.tableY + 0.03;
      pos[i * 3 + 2] = headZ + (Math.random() - 0.5) * 0.05;
      vel[i * 3] = (Math.random() - 0.5) * 2.6;
      vel[i * 3 + 1] = 1.0 + Math.random() * 2.8;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 2.6;
      t0[i] = time;
      life[i] = 0.45 + Math.random() * 0.75;
      seed[i] = Math.random();
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aVel.needsUpdate = true;
    geometry.attributes.aT0.needsUpdate = true;
    geometry.attributes.aLife.needsUpdate = true;
    geometry.attributes.aSeed.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <primitive object={material} attach="material" />
    </points>
  );
}
