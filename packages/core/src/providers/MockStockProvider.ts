import type { StockItem } from "../models";
import type { IStockProvider } from "./IStockProvider";
import { getMockStockItems } from "../data/mockCatalog";

export class MockStockProvider implements IStockProvider {
  getStockItems(): Promise<StockItem[]> {
    return Promise.resolve(getMockStockItems());
  }
}
