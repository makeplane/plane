import { BaseAnalyticsStore, IBaseAnalyticsStore } from "@/store/analytics.store";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IAnalyticsStore extends IBaseAnalyticsStore {
  //observables
}

export class AnalyticsStore extends BaseAnalyticsStore {}
