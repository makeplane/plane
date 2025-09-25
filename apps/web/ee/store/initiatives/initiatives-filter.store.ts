import { set } from "lodash";
import { action, makeObservable, observable, reaction, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { INITIATIVE_DEFAULT_DISPLAY_FILTERS } from "@plane/constants";
import { TInitiativeDisplayFilters } from "@plane/types";
// Plane-web
import { InitiativeService } from "@/plane-web/services/initiative.service";
import { TExternalInitiativeFilterExpression } from "@/plane-web/types/initiative";
//
import { RootStore } from "../root.store";

export interface IInitiativeFilterStore {
  displayFilters: Record<string, TInitiativeDisplayFilters>;
  filters: Record<string, TExternalInitiativeFilterExpression>;

  currentInitiativeDisplayFilters: TInitiativeDisplayFilters;

  getInitiativeDisplayFilters: (workspaceSlug: string) => TInitiativeDisplayFilters;
  getInitiativeFilters: (workspaceSlug: string) => TExternalInitiativeFilterExpression | undefined;

  initInitiativeFilters: (workspaceSlug: string) => void;
  updateDisplayFilters: (workspaceSlug: string, displayFilters: Partial<TInitiativeDisplayFilters>) => void;
  updateFilters: (workspaceSlug: string, filters: TExternalInitiativeFilterExpression) => void;
  clearAllFilters: (workspaceSlug: string) => void;
}

export class InitiativeFilterStore implements IInitiativeFilterStore {
  displayFilters: Record<string, TInitiativeDisplayFilters> = {};
  filters: Record<string, TExternalInitiativeFilterExpression> = {};

  // root store
  rootStore: RootStore;
  // service
  initiativeService: InitiativeService;

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
    // service
    this.initiativeService = new InitiativeService();
  }

  get currentInitiativeDisplayFilters() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;

    if (!workspaceSlug) return {};

    return this.getInitiativeDisplayFilters(workspaceSlug);
  }

  getInitiativeDisplayFilters = computedFn((workspaceSlug: string) => this.displayFilters[workspaceSlug]);

  getInitiativeFilters = computedFn((workspaceSlug: string) => this.filters[workspaceSlug]);

  initInitiativeFilters = async (workspaceSlug: string) => {
    const userProperties = await this.initiativeService.fetchInitiativeUserProperties(workspaceSlug);

    runInAction(() => {
      this.displayFilters[workspaceSlug] = userProperties?.display_filters || INITIATIVE_DEFAULT_DISPLAY_FILTERS;
      this.filters[workspaceSlug] = userProperties?.rich_filters || {};
    });
  };

  updateDisplayFilters = async (workspaceSlug: string, displayFilters: Partial<TInitiativeDisplayFilters>) => {
    runInAction(() => {
      Object.keys(displayFilters).forEach((key) => {
        set(this.displayFilters, [workspaceSlug, key], displayFilters[key as keyof TInitiativeDisplayFilters]);
      });
    });

    try {
      await this.initiativeService.updateInitiativeUserProperties(workspaceSlug, {
        display_filters: displayFilters,
      });
    } catch (error) {
      console.error("Failed to save initiative display filters to user properties:", error);
    }
  };

  updateFilters = async (workspaceSlug: string, filters: TExternalInitiativeFilterExpression) => {
    // Update the state
    runInAction(() => {
      set(this.filters, workspaceSlug, filters);
    });

    try {
      await this.initiativeService.updateInitiativeUserProperties(workspaceSlug, {
        rich_filters: filters,
      });
    } catch (error) {
      console.error("Failed to save initiative filters to user properties:", error);
    }

    this.rootStore.initiativeStore.fetchInitiatives(workspaceSlug, filters);
  };

  clearAllFilters = async (workspaceSlug: string) => {
    runInAction(() => {
      this.filters[workspaceSlug] = {};
    });

    try {
      await this.initiativeService.updateInitiativeUserProperties(workspaceSlug, {
        rich_filters: {},
      });
    } catch (error) {
      console.error("Failed to clear initiative filters in user properties:", error);
    }
  };
}
