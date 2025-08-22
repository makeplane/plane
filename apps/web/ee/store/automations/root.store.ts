import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { TAutomation } from "@plane/types";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// local imports
import { AutomationInstance, IAutomationInstance, TAutomationHelpers } from "./automation";
import { IProjectAutomationsStore, ProjectAutomationsStore } from "./project-automations.store";

export interface IAutomationsRootStore {
  // computed functions
  getAllAutomations: () => IAutomationInstance[];
  getAutomationById: (automationId: string) => IAutomationInstance | undefined;
  // actions
  addOrUpdateAutomation: (automation: TAutomation, helpers: TAutomationHelpers) => IAutomationInstance;
  removeAutomation: (automationId: string) => void;
  // sub-stores
  projectAutomations: IProjectAutomationsStore;
}

export class AutomationsRootStore implements IAutomationsRootStore {
  // observables
  private data: Map<string, AutomationInstance> = new Map(); // automationId => AutomationInstance
  // root store
  rootStore: RootStore;
  // sub-stores
  projectAutomations: ProjectAutomationsStore;

  constructor(store: RootStore) {
    makeObservable<AutomationsRootStore, "data">(this, {
      // observables,
      data: observable,
      // actions
      addOrUpdateAutomation: action,
      removeAutomation: action,
    });
    // initialize root store
    this.rootStore = store;
    // sub-stores
    this.projectAutomations = new ProjectAutomationsStore(this, store);
  }

  getAllAutomations: IAutomationsRootStore["getAllAutomations"] = computedFn(() => {
    const automationIds = Array.from(this.data.values());
    return automationIds;
  });

  getAutomationById: IAutomationsRootStore["getAutomationById"] = computedFn((automationId) => {
    const automationInstance = this.data.get(automationId);
    return automationInstance ?? undefined;
  });

  addOrUpdateAutomation: IAutomationsRootStore["addOrUpdateAutomation"] = (automation, helpers) => {
    try {
      const automationId = automation.id;
      if (!automationId) throw new Error("automationId not present");
      return runInAction(() => {
        const existingAutomationInstance = this.data.get(automationId);
        if (existingAutomationInstance) {
          existingAutomationInstance.mutate(automation);
          return existingAutomationInstance;
        } else {
          const newAutomationInstance = new AutomationInstance(this.rootStore, automation, helpers);
          this.data.set(automationId, newAutomationInstance);
          return newAutomationInstance;
        }
      });
    } catch (error) {
      console.error("Failed to add automation instance:", error);
      throw error;
    }
  };

  removeAutomation: IAutomationsRootStore["removeAutomation"] = (automationId) => {
    try {
      runInAction(() => {
        this.data.delete(automationId);
      });
    } catch (error) {
      console.error("Failed to remove automation instance:", error);
      throw error;
    }
  };
}
