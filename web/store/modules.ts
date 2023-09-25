import { action, computed, observable, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { ProjectService } from "services/project.service";
import { ModuleService } from "services/modules.service";
import { IModule } from "@/types";

export interface IModuleStore {
  loader: boolean;
  error: any | null;

  moduleId: string | null;
  modules: {
    [project_id: string]: IModule[];
  };
  module_details: {
    [module_id: string]: IModule;
  };

  setModuleId: (moduleSlug: string) => void;

  fetchModules: (workspaceSlug: string, projectSlug: string) => void;
}

class ModuleStore implements IModuleStore {
  loader: boolean = false;
  error: any | null = null;

  moduleId: string | null = null;

  modules: {
    [project_id: string]: IModule[];
  } = {};

  module_details: {
    [module_id: string]: IModule;
  } = {};

  // root store
  rootStore;
  // services
  projectService;
  moduleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable,
      error: observable.ref,

      moduleId: observable.ref,

      // computed

      // actions
      setModuleId: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.moduleService = new ModuleService();
  }

  // computed
  get projectModules() {
    if (!this.rootStore.project.projectId) return null;
    return this.modules[this.rootStore.project.projectId] || null;
  }

  // actions
  setModuleId = (moduleSlug: string) => {
    this.moduleId = moduleSlug ?? null;
  };

  fetchModules = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const modulesResponse = await this.moduleService.getModules(workspaceSlug, projectSlug);

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectSlug]: modulesResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch modules list in project store", error);
      this.loader = false;
      this.error = error;
    }
  };
}

export default ModuleStore;
