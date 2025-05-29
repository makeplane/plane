import { BaseAnalyticsStoreV2, IBaseAnalyticsStoreV2 } from "@/store/analytics-v2.store";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IAnalyticsStoreV2 extends IBaseAnalyticsStoreV2 {
  //observables
}

export class AnalyticsStoreV2 extends BaseAnalyticsStoreV2 {}
