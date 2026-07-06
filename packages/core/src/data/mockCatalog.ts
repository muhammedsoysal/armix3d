import type { PartDefinition, SalesRecord, StockItem } from "../models";

const daysAgo = (days: number): Date => new Date(Date.now() - days * 86_400_000);

/** Ürün kataloğu — isimler nominal, partDimensions gerçek kesim ölçüsüdür
 * (nominal − kerf payı, mm). */
export function getPartDefinitions(): PartDefinition[] {
  return [
    { sku: "PRT-001", productName: "Panel Kapağı 400×300", materialType: "DKP Sac 2mm", partDimensions: { width: 295, length: 395 } },
    { sku: "PRT-002", productName: "Montaj Braketi 150×100", materialType: "DKP Sac 2mm", partDimensions: { width: 95, length: 145 } },
    { sku: "PRT-003", productName: "Şasi Plakası 800×600", materialType: "DKP Sac 3mm", partDimensions: { width: 595, length: 795 } },
    { sku: "PRT-004", productName: "Davlumbaz Yan Sacı 500×350", materialType: "Paslanmaz Sac 1.5mm", partDimensions: { width: 345, length: 495 } },
    { sku: "PRT-005", productName: "Kasa Paneli 600×400", materialType: "Alüminyum Sac 1.5mm", partDimensions: { width: 395, length: 595 } },
    { sku: "PRT-006", productName: "Taban Plakası 250×250", materialType: "DKP Sac 3mm", partDimensions: { width: 245, length: 245 } },
    { sku: "PRT-007", productName: "Kapı Sacı 700×500", materialType: "DKP Sac 2mm", partDimensions: { width: 495, length: 695 } },
    { sku: "PRT-008", productName: "Flanş Plakası 200×200", materialType: "Paslanmaz Sac 1.5mm", partDimensions: { width: 195, length: 195 } },
  ];
}

/**
 * Pareto dağılımlı satış verisi: ürünlerin ~%20'si (PRT-001, PRT-007)
 * toplam satışın ~%70'ini oluşturur — gerçekçi B2B dağılımı.
 */
export function getMockSalesRecords(): SalesRecord[] {
  return [
    { sku: "PRT-001", productName: "Panel Kapağı 400×300", unitsSoldLast30Days: 420, unitsSoldLast90Days: 1180, revenueLast30Days: 546_000, trend: "rising" },
    { sku: "PRT-007", productName: "Kapı Sacı 700×500", unitsSoldLast30Days: 310, unitsSoldLast90Days: 980, revenueLast30Days: 837_000, trend: "stable" },
    { sku: "PRT-002", productName: "Montaj Braketi 150×100", unitsSoldLast30Days: 95, unitsSoldLast90Days: 260, revenueLast30Days: 33_250, trend: "rising" },
    { sku: "PRT-005", productName: "Kasa Paneli 600×400", unitsSoldLast30Days: 70, unitsSoldLast90Days: 240, revenueLast30Days: 129_500, trend: "stable" },
    { sku: "PRT-003", productName: "Şasi Plakası 800×600", unitsSoldLast30Days: 48, unitsSoldLast90Days: 150, revenueLast30Days: 168_000, trend: "falling" },
    { sku: "PRT-004", productName: "Davlumbaz Yan Sacı 500×350", unitsSoldLast30Days: 32, unitsSoldLast90Days: 88, revenueLast30Days: 60_800, trend: "stable" },
    { sku: "PRT-006", productName: "Taban Plakası 250×250", unitsSoldLast30Days: 20, unitsSoldLast90Days: 75, revenueLast30Days: 17_000, trend: "falling" },
    { sku: "PRT-008", productName: "Flanş Plakası 200×200", unitsSoldLast30Days: 12, unitsSoldLast90Days: 40, revenueLast30Days: 13_200, trend: "stable" },
  ];
}

/**
 * Stok: 4 kalem bilerek 60+ gün bekleyen atıl stok (isStale) — demo etkisi
 * motorun bunları eritmesinden gelir. Boyutlar mm.
 */
export function getMockStockItems(): StockItem[] {
  return [
    { sku: "STK-DKP2-A", materialType: "DKP Sac 2mm", dimensions: { width: 1200, length: 2400, thickness: 2 }, quantityAvailable: 42, arrivalDate: daysAgo(12), unitCost: 2350 },
    { sku: "STK-DKP2-B", materialType: "DKP Sac 2mm", dimensions: { width: 1200, length: 2400, thickness: 2 }, quantityAvailable: 18, arrivalDate: daysAgo(75), unitCost: 2210, isStale: true },
    { sku: "STK-DKP3-A", materialType: "DKP Sac 3mm", dimensions: { width: 1500, length: 3000, thickness: 3 }, quantityAvailable: 25, arrivalDate: daysAgo(20), unitCost: 5480 },
    { sku: "STK-DKP3-B", materialType: "DKP Sac 3mm", dimensions: { width: 1200, length: 2400, thickness: 3 }, quantityAvailable: 10, arrivalDate: daysAgo(95), unitCost: 3390, isStale: true },
    { sku: "STK-PSL15-A", materialType: "Paslanmaz Sac 1.5mm", dimensions: { width: 1000, length: 2000, thickness: 1.5 }, quantityAvailable: 30, arrivalDate: daysAgo(8), unitCost: 4120 },
    { sku: "STK-PSL15-B", materialType: "Paslanmaz Sac 1.5mm", dimensions: { width: 1000, length: 2000, thickness: 1.5 }, quantityAvailable: 9, arrivalDate: daysAgo(120), unitCost: 3980, isStale: true },
    { sku: "STK-ALU15-A", materialType: "Alüminyum Sac 1.5mm", dimensions: { width: 1250, length: 2500, thickness: 1.5 }, quantityAvailable: 22, arrivalDate: daysAgo(30), unitCost: 3050 },
    { sku: "STK-ALU15-B", materialType: "Alüminyum Sac 1.5mm", dimensions: { width: 1250, length: 2500, thickness: 1.5 }, quantityAvailable: 7, arrivalDate: daysAgo(140), unitCost: 2890, isStale: true },
  ];
}
