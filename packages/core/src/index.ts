// Modeller
export * from "./models";

// Provider arayüzleri ve implementasyonları
export type { IStockProvider } from "./providers/IStockProvider";
export type { ISalesProvider } from "./providers/ISalesProvider";
export { MockStockProvider } from "./providers/MockStockProvider";
export { MockSalesProvider } from "./providers/MockSalesProvider";
export { LiveStockProvider } from "./providers/LiveStockProvider";
export { LiveSalesProvider } from "./providers/LiveSalesProvider";
export { createStockProvider, createSalesProvider } from "./providers/factory";

// Mock katalog (parça tanımları demo sahnesi için de gerekli)
export { getPartDefinitions, getMockSalesRecords, getMockStockItems } from "./data/mockCatalog";

// Karar motoru — %100 deterministik, LLM'siz
export { PriorityScorer, stockAgeDays, type ScoringInput, type ScoredItem } from "./engine/PriorityScorer";
export { ProductionPlanBuilder, type BuildPlanParams } from "./engine/ProductionPlanBuilder";
export { HeuristicScrapEstimator, type IScrapEstimator } from "./engine/ScrapEstimator";
export { ReasoningTextBuilder } from "./engine/ReasoningTextBuilder";

// State machine (tek kaynak, tek gerçek)
export {
  machineStateStore,
  nextMachineState,
  type MachineState,
  type MachineStateStoreState,
  type TransitionContext,
} from "./stateMachine/MachineStateStore";
export { packGuillotine, GuillotineScrapEstimator, type PackPiece, type Placement, type PackResult } from "./engine/GuillotineNester";
export { planSlitting, naiveTrimPct, type SlitOrder, type SlitPlan, type SlitPatternPlan } from "./engine/SlitOptimizer";
