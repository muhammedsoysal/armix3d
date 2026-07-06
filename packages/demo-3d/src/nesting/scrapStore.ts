import { createStore } from "zustand/vanilla";
import { SCRAP_PRICE_TL_PER_KG, scrapKgFor, type Nest } from "./nestingMath";

/** Vardiya boyunca biriken fire — hurda kasası ve HUD buradan okur. */
export interface ScrapStoreState {
  cuts: number;
  scrapKg: number;
  scrapValueTL: number;
  addCut: (nest: Nest, sheetWmm: number, pieceLmm: number, thicknessMm: number) => void;
}

export const scrapStore = createStore<ScrapStoreState>()((set) => ({
  cuts: 0,
  scrapKg: 0,
  scrapValueTL: 0,
  addCut: (nest, sheetWmm, pieceLmm, thicknessMm) =>
    set((s) => {
      const kg = scrapKgFor(nest.scrapRatio, sheetWmm, pieceLmm, thicknessMm);
      return {
        cuts: s.cuts + 1,
        scrapKg: s.scrapKg + kg,
        scrapValueTL: s.scrapValueTL + kg * SCRAP_PRICE_TL_PER_KG,
      };
    }),
}));
