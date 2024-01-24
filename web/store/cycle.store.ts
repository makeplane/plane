import { action, computed, observable, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { isFuture, isPast } from "date-fns";
import set from "lodash/set";
import sortBy from "lodash/sortBy";
// types
import { ICycle, CycleDateCheckData } from "@plane/types";
// mobx
import { RootStore } from "store/root.store";
// services
import { ProjectService } from "services/project";
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";

export interface ICycleStore {
  //Loaders
  loader: boolean;
  // observables
  fetchedMap: Record<string, boolean>;
  cycleMap: Record<string, ICycle>;
  activeCycleIdMap: Record<string, boolean>;
  // computed
  currentProjectCycleIds: string[] | null;
  currentProjectCompletedCycleIds: string[] | null;
  currentProjectUpcomingCycleIds: string[] | null;
  currentProjectIncompleteCycleIds: string[] | null;
  currentProjectDraftCycleIds: string[] | null;
  currentProjectActiveCycleId: string | null;
  // computed actions
  getCycleById: (cycleId: string) => ICycle | null;
  getActiveCycleById: (cycleId: string) => ICycle | null;
  getProjectCycleIds: (projectId: string) => string[] | null;
  // actions
  validateDate: (workspaceSlug: string, projectId: string, payload: CycleDateCheckData) => Promise<any>;
  // fetch
  fetchAllCycles: (workspaceSlug: string, projectId: string) => Promise<undefined | ICycle[]>;
  fetchActiveCycle: (workspaceSlug: string, projectId: string) => Promise<undefined | ICycle[]>;
  fetchCycleDetails: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<ICycle>;
  // crud
  createCycle: (workspaceSlug: string, projectId: string, data: Partial<ICycle>) => Promise<ICycle>;
  updateCycleDetails: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: Partial<ICycle>
  ) => Promise<ICycle>;
  deleteCycle: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
  // favorites
  addCycleToFavorites: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<any>;
  removeCycleFromFavorites: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
}

export class CycleStore implements ICycleStore {
  // observables
  loader: boolean = false;
  cycleMap: Record<string, ICycle> = {};
  activeCycleIdMap: Record<string, boolean> = {};
  //loaders
  fetchedMap: Record<string, boolean> = {};
  // root store
  rootStore;
  // services
  projectService;
  issueService;
  cycleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      cycleMap: observable,
      activeCycleIdMap: observable,
      fetchedMap: observable,
      // computed
      currentProjectCycleIds: computed,
      currentProjectCompletedCycleIds: computed,
      currentProjectUpcomingCycleIds: computed,
      currentProjectIncompleteCycleIds: computed,
      currentProjectDraftCycleIds: computed,
      currentProjectActiveCycleId: computed,
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
  /**
   * returns all cycle ids for a project
   */
  get currentProjectCycleIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return null;
    let allCycles = Object.values(this.cycleMap ?? {}).filter((c) => c?.project === projectId);
    allCycles = sortBy(allCycles, [(c) => !c.is_favorite, (c) => c.name.toLowerCase()]);
    const allCycleIds = allCycles.map((c) => c.id);
    return allCycleIds;
  }

  /**
   * returns all completed cycle ids for a project
   */
  get currentProjectCompletedCycleIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return null;
    let completedCycles = Object.values(this.cycleMap ?? {}).filter((c) => {
      const hasEndDatePassed = isPast(new Date(c.end_date ?? ""));
      return c.project === projectId && hasEndDatePassed;
    });
    completedCycles = sortBy(completedCycles, [(c) => !c.is_favorite, (c) => c.name.toLowerCase()]);
    const completedCycleIds = completedCycles.map((c) => c.id);
    return completedCycleIds;
  }

  /**
   * returns all upcoming cycle ids for a project
   */
  get currentProjectUpcomingCycleIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return null;
    let upcomingCycles = Object.values(this.cycleMap ?? {}).filter((c) => {
      const isStartDateUpcoming = isFuture(new Date(c.start_date ?? ""));
      return c.project === projectId && isStartDateUpcoming;
    });
    upcomingCycles = sortBy(upcomingCycles, [(c) => !c.is_favorite, (c) => c.name.toLowerCase()]);
    const upcomingCycleIds = upcomingCycles.map((c) => c.id);
    return upcomingCycleIds;
  }

  /**
   * returns all incomplete cycle ids for a project
   */
  get currentProjectIncompleteCycleIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return null;
    let incompleteCycles = Object.values(this.cycleMap ?? {}).filter((c) => {
      const hasEndDatePassed = isPast(new Date(c.end_date ?? ""));
      return c.project === projectId && !hasEndDatePassed;
    });
    incompleteCycles = sortBy(incompleteCycles, [(c) => !c.is_favorite, (c) => c.name.toLowerCase()]);
    const incompleteCycleIds = incompleteCycles.map((c) => c.id);
    return incompleteCycleIds;
  }

  /**
   * returns all draft cycle ids for a project
   */
  get currentProjectDraftCycleIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return null;
    let draftCycles = Object.values(this.cycleMap ?? {}).filter(
      (c) => c.project === projectId && !c.start_date && !c.end_date
    );
    draftCycles = sortBy(draftCycles, [(c) => !c.is_favorite, (c) => c.name.toLowerCase()]);
    const draftCycleIds = draftCycles.map((c) => c.id);
    return draftCycleIds;
  }

  /**
   * returns active cycle id for a project
   */
  get currentProjectActiveCycleId() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId) return null;
    const activeCycle = Object.keys(this.activeCycleIdMap ?? {}).find(
      (cycleId) => this.cycleMap?.[cycleId]?.project === projectId
    );
    return activeCycle || null;
  }

  /**
   * @description returns cycle details by cycle id
   * @param cycleId
   * @returns
   */
  getCycleById = computedFn((cycleId: string): ICycle | null => this.cycleMap?.[cycleId] ?? null);

  /**
   * @description returns active cycle details by cycle id
   * @param cycleId
   * @returns
   */
  getActiveCycleById = computedFn((cycleId: string): ICycle | null =>
    this.activeCycleIdMap?.[cycleId] && this.cycleMap?.[cycleId] ? this.cycleMap?.[cycleId] : null
  );

  /**
   * @description returns list of cycle ids of the project id passed as argument
   * @param projectId
   */
  getProjectCycleIds = computedFn((projectId: string): string[] | null => {
    if (!this.fetchedMap[projectId]) return null;

    let cycles = Object.values(this.cycleMap ?? {}).filter((c) => c.project === projectId);
    cycles = sortBy(cycles, [(c) => !c.is_favorite, (c) => c.name.toLowerCase()]);
    const cycleIds = cycles.map((c) => c.id);
    return cycleIds || null;
  });

  /**
   * @description validates cycle dates
   * @param workspaceSlug
   * @param projectId
   * @param payload
   * @returns
   */
  validateDate = async (workspaceSlug: string, projectId: string, payload: CycleDateCheckData) =>
    await this.cycleService.cycleDateCheck(workspaceSlug, projectId, payload);

  /**
   * @description fetches all cycles for a project
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  fetchAllCycles = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      await this.cycleService.getCyclesWithParams(workspaceSlug, projectId).then((response) => {
        runInAction(() => {
          response.forEach((cycle) => {
            set(this.cycleMap, [cycle.id], cycle);
          });
          set(this.fetchedMap, projectId, true);
          this.loader = false;
        });
        return response;
      });
    } catch (error) {
      this.loader = false;
      return undefined;
    }
  };

  /**
   * @description fetches active cycle for a project
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  fetchActiveCycle = async (workspaceSlug: string, projectId: string) =>
    await this.cycleService.getCyclesWithParams(workspaceSlug, projectId, "current").then((response) => {
      runInAction(() => {
        response.forEach((cycle) => {
          set(this.activeCycleIdMap, [cycle.id], true);
          set(this.cycleMap, [cycle.id], cycle);
        });
      });
      return response;
    });

  /**
   * @description fetches cycle details
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   * @returns
   */
  fetchCycleDetails = async (workspaceSlug: string, projectId: string, cycleId: string) =>
    await this.cycleService.getCycleDetails(workspaceSlug, projectId, cycleId).then((response) => {
      runInAction(() => {
        set(this.cycleMap, [response.id], { ...this.cycleMap?.[response.id], ...response });
      });
      return response;
    });

  /**
   * @description creates a new cycle
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns
   */
  createCycle = async (workspaceSlug: string, projectId: string, data: Partial<ICycle>) =>
    await this.cycleService.createCycle(workspaceSlug, projectId, data).then((response) => {
      runInAction(() => {
        set(this.cycleMap, [response.id], response);
      });
      return response;
    });

  /**
   * @description updates cycle details
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   * @param data
   * @returns
   */
  updateCycleDetails = async (workspaceSlug: string, projectId: string, cycleId: string, data: Partial<ICycle>) => {
    try {
      runInAction(() => {
        set(this.cycleMap, [cycleId], { ...this.cycleMap?.[cycleId], ...data });
      });
      const response = await this.cycleService.patchCycle(workspaceSlug, projectId, cycleId, data);
      return response;
    } catch (error) {
      console.log("Failed to patch cycle from cycle store");
      this.fetchAllCycles(workspaceSlug, projectId);
      this.fetchActiveCycle(workspaceSlug, projectId);
      throw error;
    }
  };

  /**
   * @description deletes a cycle
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   */
  deleteCycle = async (workspaceSlug: string, projectId: string, cycleId: string) =>
    await this.cycleService.deleteCycle(workspaceSlug, projectId, cycleId).then(() => {
      runInAction(() => {
        delete this.cycleMap[cycleId];
        delete this.activeCycleIdMap[cycleId];
      });
    });

  /**
   * @description adds a cycle to favorites
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   * @returns
   */
  addCycleToFavorites = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    const currentCycle = this.getCycleById(cycleId);
    const currentActiveCycle = this.getActiveCycleById(cycleId);
    try {
      runInAction(() => {
        if (currentCycle) set(this.cycleMap, [cycleId, "is_favorite"], true);
      });
      // updating through api.
      const response = await this.cycleService.addCycleToFavorites(workspaceSlug, projectId, { cycle: cycleId });
      return response;
    } catch (error) {
      runInAction(() => {
        if (currentCycle) set(this.cycleMap, [cycleId, "is_favorite"], false);
      });
      throw error;
    }
  };

  /**
   * @description removes a cycle from favorites
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   * @returns
   */
  removeCycleFromFavorites = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    const currentCycle = this.getCycleById(cycleId);
    const currentActiveCycle = this.getActiveCycleById(cycleId);
    try {
      runInAction(() => {
        if (currentCycle) set(this.cycleMap, [cycleId, "is_favorite"], false);
      });
      const response = await this.cycleService.removeCycleFromFavorites(workspaceSlug, projectId, cycleId);
      return response;
    } catch (error) {
      runInAction(() => {
        if (currentCycle) set(this.cycleMap, [cycleId, "is_favorite"], true);
      });
      throw error;
    }
  };
}
