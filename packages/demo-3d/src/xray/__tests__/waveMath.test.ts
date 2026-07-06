import { describe, expect, it } from "vitest";
import { revealRadiusAt } from "../waveMath";

describe("revealRadiusAt", () => {
  it("starts at 0", () => {
    expect(revealRadiusAt(0, 1.4, 40)).toBe(0);
  });
  it("reaches max radius at duration and clamps beyond", () => {
    expect(revealRadiusAt(1.4, 1.4, 40)).toBe(40);
    expect(revealRadiusAt(99, 1.4, 40)).toBe(40);
  });
  it("is monotonic increasing", () => {
    let prev = -1;
    for (let t = 0; t <= 1.4; t += 0.05) {
      const r = revealRadiusAt(t, 1.4, 40);
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
  });
  it("ease-out: covers more than half the radius by half time", () => {
    expect(revealRadiusAt(0.7, 1.4, 40)).toBeGreaterThan(20);
  });
});
