// root store
import { RootStore } from "@/plane-web/store/root.store";
// recurring work items stores
import { IRecurringWorkItemActivityStore, RecurringWorkItemActivityStore } from "./activity.store";
import { IRecurringWorkItemStore, RecurringWorkItemStore } from "./base.store";

export interface IRecurringWorkItemsRootStore {
  recurringWorkItems: IRecurringWorkItemStore;
  recurringWorkItemActivities: IRecurringWorkItemActivityStore;
}

export class RecurringWorkItemsRootStore implements IRecurringWorkItemsRootStore {
  recurringWorkItems: IRecurringWorkItemStore;
  recurringWorkItemActivities: IRecurringWorkItemActivityStore;

  constructor(root: RootStore) {
    this.recurringWorkItems = new RecurringWorkItemStore(root);
    this.recurringWorkItemActivities = new RecurringWorkItemActivityStore();
  }
}
