// Fabrika ambiyans seslerini prosedürel üretir (telif derdi yok, offline dostu).
// Kullanım: node scripts/generate-audio.mjs  → packages/demo-3d/public/audio/*.wav
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../packages/demo-3d/public/audio");
mkdirSync(OUT, { recursive: true });

const SR = 22050;

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-1, Math.min(1, samples[i])) * 32767, 44 + i * 2);
  }
  return buf;
}

/** Dikişsiz döngü için: kuyruğu başa çapraz-geçir (crossfade). */
function loopify(s, fadeN) {
  const n = s.length;
  for (let i = 0; i < fadeN; i++) {
    const w = i / fadeN;
    s[i] = s[i] * w + s[n - fadeN + i] * (1 - w);
  }
  return s.slice(0, n - fadeN);
}

// 1) FABRİKA UĞULTUSU: 50/100 Hz trafo vınlaması + kahverengi gürültü zemin
{
  const dur = 6;
  const n = SR * dur;
  const s = new Float32Array(n);
  let brown = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    brown = (brown + (Math.random() * 2 - 1) * 0.02) * 0.995;
    s[i] =
      0.16 * Math.sin(2 * Math.PI * 50 * t) +
      0.08 * Math.sin(2 * Math.PI * 100 * t + 0.7) +
      0.05 * Math.sin(2 * Math.PI * 149 * t) +
      brown * 2.2;
    s[i] *= 0.55;
  }
  writeFileSync(join(OUT, "factory-hum.wav"), wav(loopify(s, SR)));
  console.log("factory-hum.wav yazıldı");
}

// 2) KESİM SESİ: yüksek frekanslı tıslama + rastgele çatırtı (plazma hissi)
{
  const dur = 3;
  const n = SR * dur;
  const s = new Float32Array(n);
  let prev = 0;
  let crackle = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    const hp = w - prev; // tek kutuplu highpass ≈ tıslama
    prev = w;
    if (Math.random() < 0.004) crackle = 0.9; // kıvılcım çatırtısı
    crackle *= 0.92;
    s[i] = (hp * 0.32 + crackle * (Math.random() * 2 - 1)) * 0.6;
  }
  writeFileSync(join(OUT, "cutting.wav"), wav(loopify(s, SR / 2)));
  console.log("cutting.wav yazıldı");
}

// 3) AGV BİP'İ: geri vites uyarı bip döngüsü (1 sn'de bir kısa 880 Hz)
{
  const dur = 1.0;
  const n = SR * dur;
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const inBeep = t < 0.14;
    const env = inBeep ? Math.min(1, t / 0.01) * Math.min(1, (0.14 - t) / 0.02) : 0;
    s[i] = env * 0.5 * Math.sin(2 * Math.PI * 880 * t);
  }
  writeFileSync(join(OUT, "agv-beep.wav"), wav(s));
  console.log("agv-beep.wav yazıldı");
}
