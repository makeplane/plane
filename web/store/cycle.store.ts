import { action, computed, observable, makeObservable, runInAction } from "mobx";
import { set, omit } from "lodash";
import { isFuture, isPast } from "date-fns";
// types
import { ICycle, CycleDateCheckData } from "types";
// mobx
import { RootStore } from "store/root.store";
// services
import { ProjectService } from "services/project";
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";

export interface ICycleStore {
  // states
  loader: boolean;
  error: any | null;
  // observables
  cycleMap: {
    [cycleId: string]: ICycle;
  };
  activeCycleMap: {
    [cycleId: string]: ICycle;
  };
  // computed
  projectAllCycles: string[] | null;
  projectCompletedCycles: string[] | null;
  projectUpcomingCycles: string[] | null;
  projectDraftCycles: string[] | null;
  projectActiveCycle: string | null;
  // computed actions
  getCycleById: (cycleId: string) => ICycle | null;
  getActiveCycleById: (cycleId: string) => ICycle | null;
  // actions
  validateDate: (workspaceSlug: string, projectId: string, payload: CycleDateCheckData) => Promise<any>;
  fetchAllCycles: (workspaceSlug: string, projectId: string) => Promise<Record<string, ICycle>>;
  fetchActiveCycle: (workspaceSlug: string, projectId: string) => Promise<Record<string, ICycle>>;
  fetchCycleDetails: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<ICycle>;
  createCycle: (workspaceSlug: string, projectId: string, data: Partial<ICycle>) => Promise<ICycle>;
  updateCycleDetails: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: Partial<ICycle>
  ) => Promise<ICycle>;
  deleteCycle: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
  addCycleToFavorites: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<any>;
  removeCycleFromFavorites: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
}

export class CycleStore implements ICycleStore {
  // states
  loader: boolean = false;
  error: any | null = null;
  // observables
  cycleMap: {
    [cycleId: string]: ICycle;
  } = {};
  activeCycleMap: { [cycleId: string]: ICycle } = {};
  // root store
  rootStore;
  // services
  projectService;
  issueService;
  cycleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,
      // observables
      cycleMap: observable,
      activeCycleMap: observable,
      // computed
      projectAllCycles: computed,
      projectCompletedCycles: computed,
      projectUpcomingCycles: computed,
      projectDraftCycles: computed,
      projectActiveCycle: computed,
      // computed actions
      getCycleById: action,
      getActiveCycleById: action,
      // actions
      fetchAllCycles: action,
      fetchActiveCycle: action,
      fetchCycleDetails: action,
      createCycle: action,
      updateCycleDetails: action,
      deleteCycle: action,
      addCycleToFavorites: action,
      removeCycleFromFavorites: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.issueService = new IssueService();
    this.cycleService = new CycleService();
  }

  // computed
  get projectAllCycles() {
    const projectId = this.rootStore.app.router.projectId;

    if (!projectId) return null;

    const allCycles = Object.keys(this.cycleMap ?? {}).filter(
      (cycleId) => this.cycleMap?.[cycleId]?.project === projectId
    );

    return allCycles || null;
  }

  get projectCompletedCycles() {
    const allCycles = this.projectAllCycles;

    if (!allCycles) return null;

    const completedCycles = allCycles.filter((cycleId) => {
      const hasEndDatePassed = isPast(new Date(this.cycleMap?.[cycleId]?.end_date ?? ""));

      return hasEndDatePassed;
    });

    return completedCycles || null;
  }

  get projectUpcomingCycles() {
    const allCycles = this.projectAllCycles;

    if (!allCycles) return null;

    const upcomingCycles = allCycles.filter((cycleId) => {
      const isStartDateUpcoming = isFuture(new Date(this.cycleMap?.[cycleId]?.start_date ?? ""));

      return isStartDateUpcoming;
    });

    return upcomingCycles || null;
  }

  get projectDraftCycles() {
    const allCycles = this.projectAllCycles;

    if (!allCycles) return null;

    const draftCycles = allCycles.filter((cycleId) => {
      const cycleDetails = this.cycleMap?.[cycleId];

      return !cycleDetails?.start_date && !cycleDetails?.end_date;
    });

    return draftCycles || null;
  }

  get projectActiveCycle() {
    const projectId = this.rootStore.app.router.projectId;

    if (!projectId) return null;

    const activeCycle = Object.keys(this.activeCycleMap ?? {}).find(
      (cycleId) => this.activeCycleMap?.[cycleId]?.project === projectId
    );

    return activeCycle || null;
  }

  /**
   * @description returns cycle details by cycle id
   * @param cycleId
   * @returns
   */
  getCycleById = (cycleId: string): ICycle | null => this.cycleMap?.[cycleId] ?? null;

  /**
   * @description returns active cycle details by cycle id
   * @param cycleId
   * @returns
   */
  getActiveCycleById = (cycleId: string): ICycle | null => this.activeCycleMap?.[cycleId] ?? null;

  validateDate = async (workspaceSlug: string, projectId: string, payload: CycleDateCheckData) => {
    try {
      const response = await this.cycleService.cycleDateCheck(workspaceSlug, projectId, payload);
      return response;
    } catch (error) {
      console.log("Failed to validate cycle dates", error);
      throw error;
    }
  };

  fetchAllCycles = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const cyclesResponse = await this.cycleService.getCyclesWithParams(workspaceSlug, projectId);

      runInAction(() => {
        Object.values(cyclesResponse).forEach((cycle) => {
          set(this.cycleMap, [cycle.id], cycle);
        });
        this.loader = false;
        this.error = null;
      });

      return cyclesResponse;
    } catch (error) {
      console.error("Failed to fetch project cycles in project store", error);
      this.loader = false;
      this.error = error;

      throw error;
    }
  };

  fetchActiveCycle = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const cyclesResponse = await this.cycleService.getCyclesWithParams(workspaceSlug, projectId, "current");

      runInAction(() => {
        Object.values(cyclesResponse).forEach((cycle) => {
          set(this.activeCycleMap, [cycle.id], cycle);
        });
        this.loader = false;
        this.error = null;
      });

      return cyclesResponse;
    } catch (error) {
      this.loader = false;
      this.error = error;

      throw error;
    }
  };

  fetchCycleDetails = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const response = await this.cycleService.getCycleDetails(workspaceSlug, projectId, cycleId);

      runInAction(() => {
        set(this.cycleMap, [response.id], { ...this.cycleMap?.[response.id], ...response });
        set(this.activeCycleMap, [response.id], { ...this.activeCycleMap?.[response.id], ...response });
      });

      return response;
    } catch (error) {
      console.log("Failed to fetch cycle detail from cycle store");
      throw error;
    }
  };

  createCycle = async (workspaceSlug: string, projectId: string, data: Partial<ICycle>) => {
    try {
      const response = await this.cycleService.createCycle(workspaceSlug, projectId, data);

      runInAction(() => {
        set(this.cycleMap, [response.id], response);
        set(this.activeCycleMap, [response.id], response);
      });

      return response;
    } catch (error) {
      console.log("Failed to create cycle from cycle store");
      throw error;
    }
  };

  updateCycleDetails = async (workspaceSlug: string, projectId: string, cycleId: string, data: Partial<ICycle>) => {
    try {
      const response = await this.cycleService.patchCycle(workspaceSlug, projectId, cycleId, data);

      runInAction(() => {
        set(this.cycleMap, [cycleId], { ...this.cycleMap?.[cycleId], ...data });
        set(this.activeCycleMap, [cycleId], { ...this.activeCycleMap?.[cycleId], ...data });
      });

      return response;
    } catch (error) {
      console.log("Failed to patch cycle from cycle store");
      throw error;
    }
  };

  deleteCycle = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    const originalCycle = this.cycleMap[cycleId];
    const originalActiveCycle = this.activeCycleMap[cycleId];

    try {
      runInAction(() => {
        omit(this.cycleMap, [cycleId]);
        omit(this.activeCycleMap, [cycleId]);
      });

      await this.cycleService.deleteCycle(workspaceSlug, projectId, cycleId);
    } catch (error) {
      console.log("Failed to delete cycle from cycle store");

      runInAction(() => {
        set(this.cycleMap, [cycleId], originalCycle);
        set(this.activeCycleMap, [cycleId], originalActiveCycle);
      });

      throw error;
    }
  };

  addCycleToFavorites = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const currentCycle = this.getCycleById(cycleId);
      const currentActiveCycle = this.getActiveCycleById(cycleId);

      runInAction(() => {
        if (currentCycle) set(this.cycleMap, [cycleId, "is_favorite"], true);
        if (currentActiveCycle) set(this.activeCycleMap, [cycleId, "is_favorite"], true);
      });

      // updating through api.
      const response = await this.cycleService.addCycleToFavorites(workspaceSlug, projectId, { cycle: cycleId });

      return response;
    } catch (error) {
      const currentCycle = this.getCycleById(cycleId);
      const currentActiveCycle = this.getActiveCycleById(cycleId);

      runInAction(() => {
        if (currentCycle) set(this.cycleMap, [cycleId, "is_favorite"], false);
        if (currentActiveCycle) set(this.activeCycleMap, [cycleId, "is_favorite"], false);
      });

      throw error;
    }
  };

  removeCycleFromFavorites = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const currentCycle = this.getCycleById(cycleId);
      const currentActiveCycle = this.getActiveCycleById(cycleId);

      runInAction(() => {
        if (currentCycle) set(this.cycleMap, [cycleId, "is_favorite"], false);
        if (currentActiveCycle) set(this.activeCycleMap, [cycleId, "is_favorite"], false);
      });

      const response = await this.cycleService.removeCycleFromFavorites(workspaceSlug, projectId, cycleId);

      return response;
    } catch (error) {
      const currentCycle = this.getCycleById(cycleId);
      const currentActiveCycle = this.getActiveCycleById(cycleId);

      runInAction(() => {
        if (currentCycle) set(this.cycleMap, [cycleId, "is_favorite"], true);
        if (currentActiveCycle) set(this.activeCycleMap, [cycleId, "is_favorite"], true);
      });

      throw error;
    }
  };
}
