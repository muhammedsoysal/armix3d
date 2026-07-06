import type { DataSource } from "../models";
import type { IStockProvider } from "./IStockProvider";
import type { ISalesProvider } from "./ISalesProvider";
import { MockStockProvider } from "./MockStockProvider";
import { MockSalesProvider } from "./MockSalesProvider";
import { LiveStockProvider } from "./LiveStockProvider";
import { LiveSalesProvider } from "./LiveSalesProvider";

/** Veri kaynağı seçimi çağıran taraftan (.env) gelir — core env okumaz. */
export function createStockProvider(source: DataSource): IStockProvider {
  return source === "live" ? new LiveStockProvider() : new MockStockProvider();
}

export function createSalesProvider(source: DataSource): ISalesProvider {
  return source === "live" ? new LiveSalesProvider() : new MockSalesProvider();
}
