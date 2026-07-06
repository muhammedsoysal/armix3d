/** Depodaki bir stok kalemi (sac levha / rulo). */
export interface StockItem {
  sku: string;
  materialType: string; // "DKP Sac 2mm", "Alüminyum Rulo 1.5mm"
  dimensions: { width: number; length: number; thickness: number }; // mm
  quantityAvailable: number;
  arrivalDate: Date;
  unitCost: number; // ₺
  /** 60+ gün bekleyen atıl stok — hem görselleştirmede hem skorlamada kullanılır. */
  isStale?: boolean;
}

/** Bir ürünün satış geçmişi özeti. */
export interface SalesRecord {
  sku: string;
  productName: string;
  unitsSoldLast30Days: number;
  unitsSoldLast90Days: number;
  revenueLast30Days: number; // ₺
  trend: "rising" | "stable" | "falling";
}

/** Kesilecek parçanın geometrik/üretim tanımı. */
export interface PartDefinition {
  sku: string;
  productName: string;
  /** Bu parçanın kesilebileceği malzeme tipi (StockItem.materialType ile eşleşir). */
  materialType: string;
  partDimensions: { width: number; length: number }; // mm
}

/** Karar motorunun tek bir ürün için önerisi. */
export interface PlanRecommendation {
  sku: string;
  productName: string;
  recommendedQuantity: number;
  sourceStockItems: StockItem[];
  estimatedScrapPercent: number;
  priorityScore: number;
  /** Template tabanlı Türkçe açıklama — LLM kullanılmaz. */
  reasoning: string;
}

/** Karar motorunun toplam çıktısı. Hem 3D sahne hem dashboard bunu tüketir. */
export interface ProductionPlan {
  recommendations: PlanRecommendation[];
  totalEstimatedScrapPercent: number;
  staleStockClearedPercent: number;
}

/** Skorlama ağırlıkları — dashboard slider'larından runtime'da değiştirilebilir. */
export interface ScorerWeights {
  salesWeight: number;
  staleStockWeight: number;
  wasteWeight: number;
}

export const DEFAULT_SCORER_WEIGHTS: ScorerWeights = {
  salesWeight: 0.5,
  staleStockWeight: 0.3,
  wasteWeight: 0.2,
};

/** Veri kaynağı seçimi — .env üzerinden gelir, kodda hardcode edilmez. */
export type DataSource = "mock" | "live";
