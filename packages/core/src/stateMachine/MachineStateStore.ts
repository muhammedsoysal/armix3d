import { createStore } from "zustand/vanilla";

/** Makine döngüsü: IDLE → FEEDING → CUTTING → LIFTING → IDLE */
export type MachineState = "IDLE" | "FEEDING" | "CUTTING" | "LIFTING";

const NEXT_STATE: Record<MachineState, MachineState> = {
  IDLE: "FEEDING",
  FEEDING: "CUTTING",
  CUTTING: "LIFTING",
  LIFTING: "IDLE",
};

/** Döngüdeki bir sonraki geçerli durum. */
export function nextMachineState(state: MachineState): MachineState {
  return NEXT_STATE[state];
}

export interface TransitionContext {
  sku?: string;
  /** Geçişi tetikleyen kaynak, ör. "Karar Motoru". */
  source?: string;
}

export interface MachineStateStoreState {
  state: MachineState;
  /** Şu an işlenen ürünün SKU'su (ProductionPlan'dan gelir). */
  currentSku: string | null;
  /**
   * Tek geçerli geçiş yolu. Hiçbir component sahneyi/state'i kendi başına
   * resetlemez — tüm geçişler buradan geçer ve loglanır.
   */
  transition: (next: MachineState, context?: TransitionContext) => void;
}

export const machineStateStore = createStore<MachineStateStoreState>()((set, get) => ({
  state: "IDLE",
  currentSku: null,
  transition: (next, context) => {
    const current = get().state;
    if (NEXT_STATE[current] !== next) {
      console.warn(`[STATE] Geçersiz geçiş engellendi: ${current} -> ${next}`);
      return;
    }
    const skuInfo = context?.sku
      ? ` (SKU: ${context.sku}, Kaynak: ${context.source ?? "bilinmiyor"})`
      : "";
    console.log(`[STATE] ${current} -> ${next}${skuInfo}`);
    set({
      state: next,
      currentSku: context?.sku ?? (next === "IDLE" ? null : get().currentSku),
    });
  },
}));
