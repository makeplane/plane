import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { TPublicModule } from "@/types/modules";
import { ModuleService } from "../services/module.service";
import { CoreRootStore } from "./root.store";

export interface IIssueModuleStore {
  // observables
  modules: TPublicModule[] | undefined;
  // computed actions
  getModuleById: (moduleId: string | undefined) => TPublicModule | undefined;
  getModulesByIds: (moduleIds: string[]) => TPublicModule[];
  // fetch actions
  fetchModules: (anchor: string) => Promise<TPublicModule[]>;
}

export class ModuleStore implements IIssueModuleStore {
  moduleMap: Record<string, TPublicModule> = {};
  moduleService: ModuleService;
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      moduleMap: observable,
      // computed
      modules: computed,
      // fetch action
      fetchModules: action,
    });
    this.moduleService = new ModuleService();
    this.rootStore = _rootStore;
  }

  get modules() {
    return Object.values(this.moduleMap);
  }

  getModuleById = (moduleId: string | undefined) => (moduleId ? this.moduleMap[moduleId] : undefined);

  getModulesByIds = (moduleIds: string[]) => {
    const currModules = [];
    for (const moduleId of moduleIds) {
      const issueModule = this.getModuleById(moduleId);
      if (issueModule) {
        currModules.push(issueModule);
      }
    }

    return currModules;
  };

  fetchModules = async (anchor: string) => {
    try {
      const modulesResponse = await this.moduleService.getModules(anchor);
      runInAction(() => {
        this.moduleMap = {};
        for (const issueModule of modulesResponse) {
          set(this.moduleMap, [issueModule.id], issueModule);
        }
      });
      return modulesResponse;
    } catch (error) {
      console.error("Failed to fetch members:", error);
      return [];
    }
  };
}
