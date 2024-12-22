import { set } from "lodash";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// Plane-web
import { TInitiativeDisplayFilters, TInitiativeFilters } from "@/plane-web/types/initiative";
//
import { RootStore } from "../root.store";

export interface IInitiativeFilterStore {
  displayFilters: Record<string, TInitiativeDisplayFilters>;
  filters: Record<string, TInitiativeFilters>;

  currentInitiativeFilters: TInitiativeFilters;
  currentInitiativeDisplayFilters: TInitiativeDisplayFilters;

  getInitiativeDisplayFilters: (workspaceSlug: string) => TInitiativeDisplayFilters;
  getInitiativeFilters: (workspaceSlug: string) => TInitiativeFilters;

  initInitiativeFilters: (workspaceSlug: string) => void;
  updateDisplayFilters: (workspaceSlug: string, displayFilters: Partial<TInitiativeDisplayFilters>) => void;
  updateFilters: (workspaceSlug: string, filters: Partial<TInitiativeFilters>) => void;
  clearAllFilters: (workspaceSlug: string) => void;
}

export class InitiativeFilterStore implements IInitiativeFilterStore {
  displayFilters: Record<string, TInitiativeDisplayFilters> = {};
  filters: Record<string, TInitiativeFilters> = {};

  // root store
  rootStore: RootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      displayFilters: observable,
      filters: observable,
      // actions
      initInitiativeFilters: action,
      updateDisplayFilters: action,
      updateFilters: action,
      clearAllFilters: action,
    });
    // root store
    this.rootStore = _rootStore;
  }

  get currentInitiativeFilters() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;

    if (!workspaceSlug) return {};

    return this.getInitiativeFilters(workspaceSlug);
  }

  get currentInitiativeDisplayFilters() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;

    if (!workspaceSlug) return {};

    return this.getInitiativeDisplayFilters(workspaceSlug);
  }

  getInitiativeDisplayFilters = computedFn((workspaceSlug: string) => this.displayFilters[workspaceSlug]);

  getInitiativeFilters = computedFn((workspaceSlug: string) => this.filters[workspaceSlug]);

  initInitiativeFilters = (workspaceSlug: string) => {
    runInAction(() => {
      this.displayFilters[workspaceSlug] = {
        group_by: undefined,
        order_by: "-created_at",
      };
      this.filters[workspaceSlug] = {};
    });
  };

  updateDisplayFilters = (workspaceSlug: string, displayFilters: Partial<TInitiativeDisplayFilters>) => {
    runInAction(() => {
      Object.keys(displayFilters).forEach((key) => {
        set(this.displayFilters, [workspaceSlug, key], displayFilters[key as keyof TInitiativeDisplayFilters]);
      });
    });
  };

  updateFilters = (workspaceSlug: string, filters: Partial<TInitiativeFilters>) => {
    runInAction(() => {
      Object.keys(filters).forEach((key) => {
        set(this.filters, [workspaceSlug, key], filters[key as keyof TInitiativeFilters]);
      });
    });
  };

  clearAllFilters = (workspaceSlug: string) => {
    runInAction(() => {
      this.filters[workspaceSlug] = {};
    });
  };
}
