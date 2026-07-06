import { describe, expect, it } from "vitest";
import { lowerQualityLevel } from "../qualityStore";

describe("lowerQualityLevel", () => {
  it("steps ultra down to medium", () => {
    expect(lowerQualityLevel("ultra")).toBe("medium");
  });
  it("steps medium down to low", () => {
    expect(lowerQualityLevel("medium")).toBe("low");
  });
  it("stays at low (floor)", () => {
    expect(lowerQualityLevel("low")).toBe("low");
  });
});
