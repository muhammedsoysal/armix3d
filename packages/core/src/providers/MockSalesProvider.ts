import type { SalesRecord } from "../models";
import type { ISalesProvider } from "./ISalesProvider";
import { getMockSalesRecords } from "../data/mockCatalog";

export class MockSalesProvider implements ISalesProvider {
  getSalesRecords(): Promise<SalesRecord[]> {
    return Promise.resolve(getMockSalesRecords());
  }
}
