import type { StockItem } from "../models";
import type { IStockProvider } from "./IStockProvider";

/** Gerçek ERP entegrasyonu için stub — arayüz hazır, implementasyon değil. */
export class LiveStockProvider implements IStockProvider {
  getStockItems(): Promise<StockItem[]> {
    throw new Error("TODO: canlı veri kaynağı entegre edilecek (ERP stok API'si)");
  }
}
