import type { StockItem } from "../models";

/** Stok verisi sağlayıcı arayüzü. Mock ve Live implementasyonları bu arayüzü doldurur. */
export interface IStockProvider {
  getStockItems(): Promise<StockItem[]>;
}
