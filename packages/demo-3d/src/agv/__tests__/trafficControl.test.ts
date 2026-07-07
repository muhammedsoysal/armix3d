import { describe, expect, it } from "vitest";
import { TrafficController, cellOf } from "../trafficControl";

describe("TrafficController (WHCA*-tarzı pencereli rezervasyon)", () => {
  it("iki araç aynı hücreyi alamaz — ikinci bekler", () => {
    const t = new TrafficController();
    expect(t.request("AGV-01", [cellOf(5, 2), cellOf(6, 2)])).toBe(true);
    expect(t.request("AGV-02", [cellOf(6, 2), cellOf(7, 2)])).toBe(false); // 6,2 dolu
    expect(t.request("AGV-02", [cellOf(7, 2), cellOf(8, 2)])).toBe(true); // boş rota
  });
  it("araç ilerleyince eski hücreleri serbest kalır", () => {
    const t = new TrafficController();
    t.request("AGV-01", [cellOf(0, 0), cellOf(1.2, 0)]);
    t.request("AGV-01", [cellOf(2.4, 0), cellOf(3.6, 0)]); // ilerledi
    expect(t.request("AGV-02", [cellOf(0, 0)])).toBe(true); // eski hücre boş
  });
  it("aynı aracın kendi hücresini yenilemesi serbesttir", () => {
    const t = new TrafficController();
    t.request("AGV-01", [cellOf(0, 0)]);
    expect(t.request("AGV-01", [cellOf(0, 0), cellOf(1.2, 0)])).toBe(true);
  });
});
