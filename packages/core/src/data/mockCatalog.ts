import type { PartDefinition, SalesRecord, StockItem } from "../models";

const daysAgo = (days: number): Date => new Date(Date.now() - days * 86_400_000);

/** Ürün kataloğu — isimler nominal, partDimensions gerçek kesim ölçüsüdür
 * (nominal − kerf payı, mm). */
export function getPartDefinitions(): PartDefinition[] {
  return [
    { sku: "PRT-001", productName: "Endüstriyel Gıda Tank Paneli 400×300", materialType: "316L Paslanmaz 2.0mm", partDimensions: { width: 295, length: 395 } },
    { sku: "PRT-002", productName: "Asansör Kapı Sacı 800×600", materialType: "304 Paslanmaz (BA) 1.5mm", partDimensions: { width: 595, length: 795 } },
    { sku: "PRT-003", productName: "Kimyasal Tesis Şasi Plakası 500×350", materialType: "316L Paslanmaz 3.0mm", partDimensions: { width: 345, length: 495 } },
    { sku: "PRT-004", productName: "Davlumbaz Gövde Paneli 600×400", materialType: "430 Paslanmaz (2B) 1.0mm", partDimensions: { width: 395, length: 595 } },
    { sku: "PRT-005", productName: "Fırın Taban Sacı 250×250", materialType: "304 Paslanmaz (2B) 2.0mm", partDimensions: { width: 245, length: 245 } },
    { sku: "PRT-006", productName: "Medikal Ekipman Tepsisi 700×500", materialType: "316L Paslanmaz 1.5mm", partDimensions: { width: 495, length: 695 } },
    { sku: "PRT-007", productName: "Mimari Dekoratif Panel 200×200", materialType: "304 Paslanmaz (SB) 1.5mm", partDimensions: { width: 195, length: 195 } },
    { sku: "PRT-008", productName: "Bağlantı Flanşı 150×100", materialType: "304 Paslanmaz 3.0mm", partDimensions: { width: 95, length: 145 } },
    // Akıllı Grupla için aynı malzemeyi PAYLAŞAN SKU'lar — büyük panellerin
    // artığını dolduracak küçük/orta parçalar (Tetris karışımı)
    { sku: "PRT-009", productName: "Montaj Braketi 180×120", materialType: "304 Paslanmaz (BA) 1.5mm", partDimensions: { width: 115, length: 175 } },
    { sku: "PRT-010", productName: "Kontrol Kapağı 350×250", materialType: "304 Paslanmaz (BA) 1.5mm", partDimensions: { width: 245, length: 345 } },
    { sku: "PRT-011", productName: "Sensör Plakası 220×160", materialType: "316L Paslanmaz 2.0mm", partDimensions: { width: 155, length: 215 } },
  ];
}

/**
 * Pareto dağılımlı satış verisi: ürünlerin ~%20'si (PRT-001, PRT-002)
 * toplam satışın ~%70'ini oluşturur — gerçekçi B2B dağılımı.
 */
export function getMockSalesRecords(): SalesRecord[] {
  return [
    { sku: "PRT-001", productName: "Endüstriyel Gıda Tank Paneli 400×300", unitsSoldLast30Days: 420, unitsSoldLast90Days: 1180, revenueLast30Days: 846_000, trend: "rising" },
    { sku: "PRT-002", productName: "Asansör Kapı Sacı 800×600", unitsSoldLast30Days: 310, unitsSoldLast90Days: 980, revenueLast30Days: 937_000, trend: "stable" },
    { sku: "PRT-008", productName: "Bağlantı Flanşı 150×100", unitsSoldLast30Days: 95, unitsSoldLast90Days: 260, revenueLast30Days: 53_250, trend: "rising" },
    { sku: "PRT-004", productName: "Davlumbaz Gövde Paneli 600×400", unitsSoldLast30Days: 70, unitsSoldLast90Days: 240, revenueLast30Days: 189_500, trend: "stable" },
    { sku: "PRT-003", productName: "Kimyasal Tesis Şasi Plakası 500×350", unitsSoldLast30Days: 48, unitsSoldLast90Days: 150, revenueLast30Days: 268_000, trend: "falling" },
    { sku: "PRT-005", productName: "Fırın Taban Sacı 250×250", unitsSoldLast30Days: 32, unitsSoldLast90Days: 88, revenueLast30Days: 90_800, trend: "stable" },
    { sku: "PRT-006", productName: "Medikal Ekipman Tepsisi 700×500", unitsSoldLast30Days: 20, unitsSoldLast90Days: 75, revenueLast30Days: 87_000, trend: "falling" },
    { sku: "PRT-007", productName: "Mimari Dekoratif Panel 200×200", unitsSoldLast30Days: 12, unitsSoldLast90Days: 40, revenueLast30Days: 23_200, trend: "stable" },
    { sku: "PRT-009", productName: "Montaj Braketi 180×120", unitsSoldLast30Days: 140, unitsSoldLast90Days: 350, revenueLast30Days: 42_000, trend: "rising" },
    { sku: "PRT-010", productName: "Kontrol Kapağı 350×250", unitsSoldLast30Days: 55, unitsSoldLast90Days: 170, revenueLast30Days: 66_000, trend: "stable" },
    { sku: "PRT-011", productName: "Sensör Plakası 220×160", unitsSoldLast30Days: 88, unitsSoldLast90Days: 210, revenueLast30Days: 61_600, trend: "rising" },
  ];
}

/**
 * Stok: 4 kalem bilerek 60+ gün bekleyen atıl stok (isStale) — demo etkisi
 * motorun bunları eritmesinden gelir. Boyutlar mm.
 */
export function getMockStockItems(): StockItem[] {
  return [
    { sku: "STK-316L-20A", materialType: "316L Paslanmaz 2.0mm", dimensions: { width: 1200, length: 2400, thickness: 2 }, quantityAvailable: 42, arrivalDate: daysAgo(12), unitCost: 4350 },
    { sku: "STK-316L-20B", materialType: "316L Paslanmaz 2.0mm", dimensions: { width: 1200, length: 2400, thickness: 2 }, quantityAvailable: 18, arrivalDate: daysAgo(75), unitCost: 4210, isStale: true },
    { sku: "STK-304BA-15A", materialType: "304 Paslanmaz (BA) 1.5mm", dimensions: { width: 1500, length: 3000, thickness: 1.5 }, quantityAvailable: 25, arrivalDate: daysAgo(20), unitCost: 3480 },
    { sku: "STK-304BA-15B", materialType: "304 Paslanmaz (BA) 1.5mm", dimensions: { width: 1200, length: 2400, thickness: 1.5 }, quantityAvailable: 10, arrivalDate: daysAgo(95), unitCost: 3390, isStale: true },
    { sku: "STK-430-10A", materialType: "430 Paslanmaz (2B) 1.0mm", dimensions: { width: 1000, length: 2000, thickness: 1 }, quantityAvailable: 30, arrivalDate: daysAgo(8), unitCost: 2120 },
    { sku: "STK-430-10B", materialType: "430 Paslanmaz (2B) 1.0mm", dimensions: { width: 1000, length: 2000, thickness: 1 }, quantityAvailable: 9, arrivalDate: daysAgo(120), unitCost: 1980, isStale: true },
    { sku: "STK-304-30A", materialType: "304 Paslanmaz 3.0mm", dimensions: { width: 1250, length: 2500, thickness: 3 }, quantityAvailable: 22, arrivalDate: daysAgo(30), unitCost: 5050 },
    { sku: "STK-304-30B", materialType: "304 Paslanmaz 3.0mm", dimensions: { width: 1250, length: 2500, thickness: 3 }, quantityAvailable: 7, arrivalDate: daysAgo(140), unitCost: 4890, isStale: true },
  ];
}
