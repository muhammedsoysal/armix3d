import type { SalesRecord } from "../models";
import type { ISalesProvider } from "./ISalesProvider";

/** Gateway REST ucu üzerinden canlı satış özeti (kontrat: openapi.yaml). */
export class LiveSalesProvider implements ISalesProvider {
  constructor(private readonly baseUrl = "http://localhost:8787") {}

  async getSalesRecords(): Promise<SalesRecord[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/sales`);
    if (!res.ok) throw new Error(`Satış API ${res.status}`);
    return res.json();
  }
}
