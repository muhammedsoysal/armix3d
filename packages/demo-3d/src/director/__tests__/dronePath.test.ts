import { describe, expect, it } from "vitest";
import { TOUR_DURATION, TOUR_SEGMENTS, TOUR_WAYPOINTS, sampleTour } from "../dronePath";

describe("dronePath", () => {
  it("waypoints stay inside the plant envelope at safe altitude", () => {
    for (const w of TOUR_WAYPOINTS) {
      const [x, y, z] = w.pos;
      expect(x).toBeGreaterThanOrEqual(-50);
      expect(x).toBeLessThanOrEqual(50);
      expect(z).toBeGreaterThanOrEqual(-30);
      expect(z).toBeLessThanOrEqual(45); // giriş/çıkış SE bacağı ön cepheden taşabilir
      expect(y).toBeGreaterThanOrEqual(2.2); // makine gabarisi üstü
      expect(y).toBeLessThanOrEqual(26);
    }
  });

  it("closes the loop: t=0 and t=TOUR_DURATION sample the same pose", () => {
    const a = sampleTour(0).pos.clone();
    const b = sampleTour(TOUR_DURATION).pos.clone();
    expect(a.distanceTo(b)).toBeLessThan(1e-6);
  });

  it("is continuous — no teleports between successive frames", () => {
    let prev = sampleTour(0).pos.clone();
    for (let t = 0.5; t <= TOUR_DURATION; t += 0.5) {
      const cur = sampleTour(t).pos.clone();
      // Transit bacaklarda ~9 m/s'e çıkar (drone hızı); sıçrama = çok daha büyük
      expect(cur.distanceTo(prev)).toBeLessThan(5);
      prev = cur;
    }
  });

  it("visits all 8 showcase segments in order, including the new mega-machines", () => {
    expect(TOUR_SEGMENTS).toHaveLength(8);
    const joined = TOUR_SEGMENTS.join("|");
    for (const kw of ["Plazma", "Kaynak", "Boru Lazer", "Toz Boya"]) {
      expect(joined).toContain(kw);
    }
    // Sıra korunur: örnekleme zaman ilerledikçe segIndex geriye sıçramaz
    // (kapalı döngünün son→ilk sarması hariç)
    let last = 0;
    for (let t = 0; t < TOUR_DURATION; t += 1) {
      const s = sampleTour(t);
      expect(s.segIndex === last || s.segIndex === last + 1 || (last === 8 && s.segIndex === 8) || last === 0).toBe(true);
      last = s.segIndex;
    }
  });

  it("camera never sits closer than minDistance=3 to its look target", () => {
    for (let t = 0; t < TOUR_DURATION; t += 0.5) {
      const s = sampleTour(t);
      expect(s.pos.distanceTo(s.target)).toBeGreaterThanOrEqual(3.05);
    }
  });
});
