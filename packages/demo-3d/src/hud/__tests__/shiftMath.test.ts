import { describe, expect, it } from "vitest";
import { shiftInfo } from "../shiftMath";

const at = (h: number, m = 0) => new Date(2026, 6, 8, h, m, 0);

describe("shiftInfo", () => {
  it("maps morning hours to shift 1", () => {
    const s = shiftInfo(at(10));
    expect(s.no).toBe(1);
    expect(s.range).toBe("06:00–14:00");
    expect(s.progress).toBeCloseTo(0.5);
  });
  it("maps afternoon hours to shift 2", () => {
    const s = shiftInfo(at(14));
    expect(s.no).toBe(2);
    expect(s.progress).toBeCloseTo(0);
  });
  it("night shift wraps midnight: 23:00 is 1h in, 05:00 is 7h in", () => {
    expect(shiftInfo(at(23)).no).toBe(3);
    expect(shiftInfo(at(23)).progress).toBeCloseTo(1 / 8);
    expect(shiftInfo(at(5)).no).toBe(3);
    expect(shiftInfo(at(5)).progress).toBeCloseTo(7 / 8);
  });
  it("boundaries: 06:00 starts V1, 22:00 starts V3", () => {
    expect(shiftInfo(at(6)).no).toBe(1);
    expect(shiftInfo(at(22)).no).toBe(3);
  });
});
