import { describe, expect, it } from "vitest";
import { isKioskParam } from "../kiosk";

describe("isKioskParam", () => {
  it("activates for ?kiosk=1 and bare ?kiosk", () => {
    expect(isKioskParam("?kiosk=1")).toBe(true);
    expect(isKioskParam("?kiosk")).toBe(true);
    expect(isKioskParam("?foo=2&kiosk=true")).toBe(true);
  });
  it("stays off without the param or with explicit off values", () => {
    expect(isKioskParam("")).toBe(false);
    expect(isKioskParam("?foo=1")).toBe(false);
    expect(isKioskParam("?kiosk=0")).toBe(false);
    expect(isKioskParam("?kiosk=false")).toBe(false);
  });
});
