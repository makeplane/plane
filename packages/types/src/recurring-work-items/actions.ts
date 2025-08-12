// local imports
import { PartialDeep } from "../utils";
import { TRecurringWorkItem } from "./root";

export interface IRecurringWorkItemActionCallbacks {
  create: (recurringWorkItem: PartialDeep<TRecurringWorkItem>) => Promise<TRecurringWorkItem>;
  update: (recurringWorkItemId: string, data: PartialDeep<TRecurringWorkItem>) => Promise<TRecurringWorkItem>;
  destroy: (recurringWorkItem: TRecurringWorkItem) => Promise<void>;
}
