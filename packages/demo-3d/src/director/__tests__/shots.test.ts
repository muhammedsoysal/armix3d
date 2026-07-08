import { describe, expect, it } from "vitest";
import { shotForEvent } from "../shots";

describe("shotForEvent", () => {
  it("plan completion beats everything", () => {
    expect(shotForEvent("CUTTING", { planCompleted: true, palletJustCompleted: false })).toBe("finale");
  });
  it("pallet completion beats machine state", () => {
    expect(shotForEvent("LIFTING", { planCompleted: false, palletJustCompleted: true })).toBe("palletYard");
  });
  it("IDLE rotates rack hero → slitting → grand tour", () => {
    const f = { planCompleted: false, palletJustCompleted: false };
    expect(shotForEvent("IDLE", { ...f, idleVariant: 0 })).toBe("rackHero");
    expect(shotForEvent("IDLE", { ...f, idleVariant: 1 })).toBe("slittingLine");
    expect(shotForEvent("IDLE", { ...f, idleVariant: 2 })).toBe("grandTour");
    expect(shotForEvent("IDLE", { ...f, idleAlt: true })).toBe("slittingLine"); // geri uyum
  });
  it("maps machine states to shots", () => {
    expect(shotForEvent("IDLE", { planCompleted: false, palletJustCompleted: false })).toBe("rackHero");
    expect(shotForEvent("FEEDING", { planCompleted: false, palletJustCompleted: false })).toBe("coilFeed");
    expect(shotForEvent("CUTTING", { planCompleted: false, palletJustCompleted: false })).toBe("cutCloseUp");
    expect(shotForEvent("LIFTING", { planCompleted: false, palletJustCompleted: false })).toBe("lifterShot");
  });
});
