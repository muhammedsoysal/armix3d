import { describe, expect, it } from "vitest";
import { dropSlotFor, missionLegs, pathLength, pointAlongPath } from "../agvLogic";

describe("pathLength", () => {
  it("sums segment lengths of a polyline", () => {
    expect(pathLength([[0, 0], [3, 0], [3, 4]])).toBe(7);
  });
  it("is 0 for a single point", () => {
    expect(pathLength([[2, 2]])).toBe(0);
  });
});

describe("pointAlongPath", () => {
  const path: [number, number][] = [[0, 0], [10, 0], [10, 10]];
  it("walks the first segment", () => {
    const p = pointAlongPath(path, 5);
    expect(p.x).toBeCloseTo(5);
    expect(p.z).toBeCloseTo(0);
    expect(p.heading).toBeCloseTo(Math.PI / 2); // +x yönü
    expect(p.done).toBe(false);
  });
  it("crosses into the second segment", () => {
    const p = pointAlongPath(path, 15);
    expect(p.x).toBeCloseTo(10);
    expect(p.z).toBeCloseTo(5);
    expect(p.heading).toBeCloseTo(0); // +z yönü
  });
  it("clamps at the end and reports done", () => {
    const p = pointAlongPath(path, 999);
    expect(p.x).toBeCloseTo(10);
    expect(p.z).toBeCloseTo(10);
    expect(p.done).toBe(true);
  });
});

describe("dropSlotFor", () => {
  // Bitmiş Ürün Deposu: 3 sıra × N sütun (x0=8.4, z0=-0.6)
  it("fills the finished-goods warehouse column-major", () => {
    const near = (s: { x: number; z: number }, x: number, z: number) => {
      expect(s.x).toBeCloseTo(x);
      expect(s.z).toBeCloseTo(z);
    };
    near(dropSlotFor(0), 8.4, -0.6);
    near(dropSlotFor(1), 8.4, -2.2);
    near(dropSlotFor(2), 8.4, -3.8);
    near(dropSlotFor(3), 9.9, -0.6);
  });
});

describe("missionLegs", () => {
  it("builds pickup→drop→home legs through the corridor lane", () => {
    const legs = missionLegs({ x: 4.2, z: 1.1 }, { x: 6, z: 0 });
    // Her bacak en az 2 nokta içerir ve uçları doğru bağlar
    expect(legs.toPickup[legs.toPickup.length - 1]).toEqual([4.2, 1.1]);
    expect(legs.toDrop[0]).toEqual([4.2, 1.1]);
    expect(legs.toDrop[legs.toDrop.length - 1]).toEqual([6, 0]);
    expect(legs.toHome[0]).toEqual([6, 0]);
  });
});
