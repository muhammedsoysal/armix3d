import { createStore } from "zustand/vanilla";
import type {
  PartDefinition,
  PlanRecommendation,
  ProductionPlan,
  SalesRecord,
  ScorerWeights,
  StockItem,
} from "@metalnest/core";

/** Karar motorunun plan üretirken kullandığı girdiler — What-If sandbox'ı
 * senaryoları bu girdilerin kopyası üzerinden GERÇEK motorla yeniden kurar. */
export interface PlanInputs {
  parts: PartDefinition[];
  stock: StockItem[];
  sales: SalesRecord[];
  weights: ScorerWeights;
}

export interface PalletPiece {
  sku: string;
  /** m */
  width: number;
  /** m */
  length: number;
}

export interface SimStoreState {
  plan: ProductionPlan | null;
  parts: Record<string, PartDefinition>;
  recIndex: number;
  piecesCutForRec: number;
  totalPiecesCut: number;
  palletStack: PalletPiece[];
  completedPallets: { id: number; stack: PalletPiece[] }[];
  isPlanCompleted: boolean;
  planInputs: PlanInputs | null;
  setPlan: (plan: ProductionPlan, parts: Record<string, PartDefinition>) => void;
  setPlanInputs: (inputs: PlanInputs) => void;
}

export const simStore = createStore<SimStoreState>()((set) => ({
  plan: null,
  parts: {},
  recIndex: 0,
  piecesCutForRec: 0,
  totalPiecesCut: 0,
  palletStack: [],
  completedPallets: [],
  isPlanCompleted: false,
  planInputs: null,
  setPlan: (plan, parts) => set({ plan, parts, recIndex: 0, piecesCutForRec: 0, isPlanCompleted: false }),
  setPlanInputs: (planInputs) => set({ planInputs }),
}));

export function currentRecommendation(s: SimStoreState): PlanRecommendation | null {
  return s.plan?.recommendations[s.recIndex] ?? null;
}

export function currentPart(s: SimStoreState): PartDefinition | null {
  const rec = currentRecommendation(s);
  return rec ? (s.parts[rec.sku] ?? null) : null;
}

/** Aktif parçanın metre cinsinden boyutları (sahne birimi). */
export function currentPartMeters(s: SimStoreState): { width: number; length: number } {
  const part = currentPart(s);
  return part
    ? { width: part.partDimensions.width / 1000, length: part.partDimensions.length / 1000 }
    : { width: 0.4, length: 0.5 };
}
