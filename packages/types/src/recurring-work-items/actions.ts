// local imports
import { TRecurringWorkItem } from "./root";
import { PartialDeep } from "../utils";

export interface IRecurringWorkItemActionCallbacks {
  create: (recurringWorkItem: PartialDeep<TRecurringWorkItem>) => Promise<TRecurringWorkItem>;
  update: (recurringWorkItemId: string, data: PartialDeep<TRecurringWorkItem>) => Promise<TRecurringWorkItem>;
  destroy: (recurringWorkItem: TRecurringWorkItem) => Promise<void>;
}
