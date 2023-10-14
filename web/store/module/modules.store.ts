import { action, computed, observable, makeObservable, runInAction } from "mobx";
// services
import { ProjectService } from "services/project";
import { ModuleService } from "services/module.service";
// types
import { RootStore } from "../root";
import { IIssue, IModule } from "types";
import {
  IIssueGroupWithSubGroupsStructure,
  IIssueGroupedStructure,
  IIssueUnGroupedStructure,
} from "../issue/issue.store";

export interface IModuleStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  moduleId: string | null;
  modules: {
    [project_id: string]: IModule[];
  };
  moduleDetails: {
    [module_id: string]: IModule;
  };
  issues: {
    [module_id: string]: {
      grouped: IIssueGroupedStructure;
      groupWithSubGroups: IIssueGroupWithSubGroupsStructure;
      ungrouped: IIssueUnGroupedStructure;
    };
  };

  // actions
  setModuleId: (moduleSlug: string) => void;

  getModuleById: (moduleId: string) => IModule | null;

  fetchModules: (workspaceSlug: string, projectId: string) => void;
  fetchModuleDetails: (workspaceSlug: string, projectId: string, moduleId: string) => void;

  createModule: (workspaceSlug: string, projectId: string, data: Partial<IModule>) => Promise<IModule>;
  updateModuleDetails: (workspaceSlug: string, projectId: string, moduleId: string, data: Partial<IModule>) => void;
  deleteModule: (workspaceSlug: string, projectId: string, moduleId: string) => void;
  addModuleToFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => void;
  removeModuleFromFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => void;

  // computed
  projectModules: IModule[] | null;
}

export class ModuleStore implements IModuleStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  moduleId: string | null = null;
  modules: {
    [project_id: string]: IModule[];
  } = {};
  moduleDetails: {
    [module_id: string]: IModule;
  } = {};
  issues: {
    [module_id: string]: {
      grouped: {
        [group_id: string]: IIssue[];
      };
      groupWithSubGroups: {
        [group_id: string]: {
          [sub_group_id: string]: IIssue[];
        };
      };
      ungrouped: IIssue[];
    };
  } = {};

  // root store
  rootStore;

  // services
  projectService;
  moduleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable,
      error: observable.ref,

      // observables
      moduleId: observable.ref,
      modules: observable.ref,
      moduleDetails: observable.ref,
      issues: observable.ref,

      // actions
      setModuleId: action,

      getModuleById: action,

      fetchModules: action,
      fetchModuleDetails: action,

      createModule: action,
      updateModuleDetails: action,
      deleteModule: action,
      addModuleToFavorites: action,
      removeModuleFromFavorites: action,

      // computed
      projectModules: computed,
    });

    this.rootStore = _rootStore;

    // services
    this.projectService = new ProjectService();
    this.moduleService = new ModuleService();
  }

  // computed
  get projectModules() {
    if (!this.rootStore.project.projectId) return null;

    return this.modules[this.rootStore.project.projectId] || null;
  }

  getModuleById = (moduleId: string) => this.moduleDetails[moduleId] || null;

  // actions
  setModuleId = (moduleSlug: string) => {
    this.moduleId = moduleSlug ?? null;
  };

  fetchModules = async (workspaceSlug: string, projectId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const modulesResponse = await this.moduleService.getModules(workspaceSlug, projectId);

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: modulesResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch modules list in module store", error);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });
    }
  };

  fetchModuleDetails = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const response = await this.moduleService.getModuleDetails(workspaceSlug, projectId, moduleId);

      if (!response) return null;

      runInAction(() => {
        this.moduleDetails = {
          ...this.moduleDetails,
          [moduleId]: response,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch module details in module store", error);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });
    }
  };

  createModule = async (workspaceSlug: string, projectId: string, data: Partial<IModule>) => {
    try {
      const response = await this.moduleService.createModule(
        workspaceSlug,
        projectId,
        data,
        this.rootStore.user.currentUser
      );

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: [...this.modules[projectId], response],
        };
        this.loader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      console.error("Failed to create module in module store", error);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  updateModuleDetails = async (workspaceSlug: string, projectId: string, moduleId: string, data: Partial<IModule>) => {
    try {
      runInAction(() => {
        (this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].map((module) =>
            module.id === moduleId ? { ...module, ...data } : module
          ),
        }),
          (this.moduleDetails = {
            ...this.moduleDetails,
            [moduleId]: {
              ...this.moduleDetails[moduleId],
              ...data,
            },
          });
      });

      await this.moduleService.patchModule(workspaceSlug, projectId, moduleId, data, this.rootStore.user.currentUser);
    } catch (error) {
      console.error("Failed to update module in module store", error);

      this.fetchModules(workspaceSlug, projectId);
      this.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });
    }
  };

  deleteModule = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].filter((module) => module.id !== moduleId),
        };
      });

      await this.moduleService.deleteModule(workspaceSlug, projectId, moduleId, this.rootStore.user.currentUser);
    } catch (error) {
      console.error("Failed to delete module in module store", error);

      this.fetchModules(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });
    }
  };

  addModuleToFavorites = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].map((module) => ({
            ...module,
            is_favorite: module.id === moduleId ? true : module.is_favorite,
          })),
        };
      });

      await this.moduleService.addModuleToFavorites(workspaceSlug, projectId, {
        module: moduleId,
      });
    } catch (error) {
      console.error("Failed to add module to favorites in module store", error);

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].map((module) => ({
            ...module,
            is_favorite: module.id === moduleId ? false : module.is_favorite,
          })),
        };
        this.error = error;
      });
    }
  };

  removeModuleFromFavorites = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].map((module) => ({
            ...module,
            is_favorite: module.id === moduleId ? false : module.is_favorite,
          })),
        };
      });

      await this.moduleService.removeModuleFromFavorites(workspaceSlug, projectId, moduleId);
    } catch (error) {
      console.error("Failed to remove module from favorites in module store", error);

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].map((module) => ({
            ...module,
            is_favorite: module.id === moduleId ? true : module.is_favorite,
          })),
        };
      });
    }
  };
}
