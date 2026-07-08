import type { StockItem } from "../models";
import type { IStockProvider } from "./IStockProvider";

/** Gateway REST ucu üzerinden canlı stok (kontrat: packages/gateway/openapi.yaml).
 * Gerçek ERP adaptörü gateway tarafında değişir; bu sınıf aynı kalır. */
export class LiveStockProvider implements IStockProvider {
  constructor(private readonly baseUrl = "http://localhost:8787") {}

  async getStockItems(): Promise<StockItem[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/stock`);
    if (!res.ok) throw new Error(`Stok API ${res.status}`);
    const dto: Array<Omit<StockItem, "arrivalDate"> & { arrivalDate: string }> = await res.json();
    // DTO → domain: tarih string'i Date'e (tek dönüşüm noktası)
    return dto.map((d) => ({ ...d, arrivalDate: new Date(d.arrivalDate) }));
  }
}
