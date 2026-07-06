import type { SalesRecord } from "../models";

/** Satış verisi sağlayıcı arayüzü. Mock ve Live implementasyonları bu arayüzü doldurur. */
export interface ISalesProvider {
  getSalesRecords(): Promise<SalesRecord[]>;
}
