import type { SalesRecord } from "../models";
import type { ISalesProvider } from "./ISalesProvider";

/** Gerçek pazaryeri/ERP entegrasyonu için stub — arayüz hazır, implementasyon değil. */
export class LiveSalesProvider implements ISalesProvider {
  getSalesRecords(): Promise<SalesRecord[]> {
    throw new Error("TODO: canlı veri kaynağı entegre edilecek (Trendyol/Etsy/ERP satış API'si)");
  }
}
