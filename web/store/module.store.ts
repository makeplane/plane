import { action, computed, observable, makeObservable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { ProjectService } from "services/project";
import { ModuleService } from "services/module.service";
// types
import { IModule, ILinkDetails } from "types";
import { RootStore } from "store/root.store";

export interface IModuleStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  moduleId: string | null;
  moduleMap: {
    [project_id: string]: {
      [module_id: string]: IModule;
    };
  };

  // actions
  getModuleById: (moduleId: string) => IModule | null;

  fetchModules: (workspaceSlug: string, projectId: string) => void;
  fetchModuleDetails: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<IModule>;

  createModule: (workspaceSlug: string, projectId: string, data: Partial<IModule>) => Promise<IModule>;
  updateModuleDetails: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: Partial<IModule>
  ) => Promise<IModule>;
  deleteModule: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;

  createModuleLink: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: Partial<ILinkDetails>
  ) => Promise<ILinkDetails>;
  updateModuleLink: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    linkId: string,
    data: Partial<ILinkDetails>
  ) => Promise<ILinkDetails>;
  deleteModuleLink: (workspaceSlug: string, projectId: string, moduleId: string, linkId: string) => Promise<void>;

  addModuleToFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
  removeModuleFromFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;

  // computed
  projectModules: string[] | null;
}

export class ModulesStore implements IModuleStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  moduleId: string | null = null;
  moduleMap: {
    [project_id: string]: {
      [module_id: string]: IModule;
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
      loader: observable.ref,
      error: observable.ref,

      // observables
      moduleId: observable.ref,
      moduleMap: observable,

      // actions
      getModuleById: action,

      fetchModules: action,
      fetchModuleDetails: action,

      createModule: action,
      updateModuleDetails: action,
      deleteModule: action,

      createModuleLink: action,
      updateModuleLink: action,
      deleteModuleLink: action,

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
    if (!this.rootStore.app.router.projectId) return null;

    return Object.keys(this.moduleMap[this.rootStore.app.router.projectId]) || null;
  }

  getModuleById = (moduleId: string) => {
    if (!this.rootStore.app.router.projectId) return null;

    return this.moduleMap?.[this.rootStore.app.router.projectId]?.[moduleId] || null;
  };

  // actions

  fetchModules = async (workspaceSlug: string, projectId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const modulesResponse = await this.moduleService.getModules(workspaceSlug, projectId);

      runInAction(() => {
        set(this.moduleMap, [projectId], modulesResponse);
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

      runInAction(() => {
        set(this.moduleMap, [projectId, moduleId], response);
        this.loader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      console.error("Failed to fetch module details in module store", error);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  createModule = async (workspaceSlug: string, projectId: string, data: Partial<IModule>) => {
    try {
      const response = await this.moduleService.createModule(workspaceSlug, projectId, data);

      runInAction(() => {
        set(this.moduleMap, [projectId, response?.id], response);
        this.loader = false;
        this.error = null;
      });
      this.fetchModules(workspaceSlug, projectId);
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
      const currentModule = this.moduleMap[projectId][moduleId];

      runInAction(() => {
        set(this.moduleMap, [projectId, moduleId], { ...currentModule, ...data });
      });

      const response = await this.moduleService.patchModule(workspaceSlug, projectId, moduleId, data);

      return response;
    } catch (error) {
      console.error("Failed to update module in module store", error);

      this.fetchModules(workspaceSlug, projectId);
      this.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  deleteModule = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      if (!this.moduleMap?.[projectId]?.[moduleId]) return;

      runInAction(() => {
        delete this.moduleMap[projectId][moduleId];
      });

      await this.moduleService.deleteModule(workspaceSlug, projectId, moduleId);
    } catch (error) {
      console.error("Failed to delete module in module store", error);

      this.fetchModules(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });
    }
  };

  createModuleLink = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: Partial<ILinkDetails>
  ) => {
    try {
      const response = await this.moduleService.createModuleLink(workspaceSlug, projectId, moduleId, data);

      const currentModule = this.moduleMap[projectId][moduleId];

      runInAction(() => {
        set(this.moduleMap, [projectId, moduleId, "link_module"], [response, ...currentModule.link_module]);
      });

      return response;
    } catch (error) {
      console.error("Failed to create module link in module store", error);

      this.fetchModules(workspaceSlug, projectId);
      this.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  updateModuleLink = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    linkId: string,
    data: Partial<ILinkDetails>
  ) => {
    try {
      const response = await this.moduleService.updateModuleLink(workspaceSlug, projectId, moduleId, linkId, data);

      const currentModule = this.moduleMap[projectId][moduleId];
      const linkModules = currentModule.link_module.map((link) => (link.id === linkId ? response : link));

      runInAction(() => {
        set(this.moduleMap, [projectId, moduleId, "link_module"], linkModules);
      });

      return response;
    } catch (error) {
      console.error("Failed to update module link in module store", error);

      this.fetchModules(workspaceSlug, projectId);
      this.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  deleteModuleLink = async (workspaceSlug: string, projectId: string, moduleId: string, linkId: string) => {
    try {
      const currentModule = this.moduleMap[projectId][moduleId];
      const linkModules = currentModule.link_module.filter((link) => link.id !== linkId);

      runInAction(() => {
        set(this.moduleMap, [projectId, moduleId, "link_module"], linkModules);
      });

      await this.moduleService.deleteModuleLink(workspaceSlug, projectId, moduleId, linkId);
    } catch (error) {
      console.error("Failed to delete module link in module store", error);

      this.fetchModules(workspaceSlug, projectId);
      this.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  addModuleToFavorites = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      const currentModule = this.moduleMap[projectId][moduleId];

      if (currentModule.is_favorite) return;

      runInAction(() => {
        set(this.moduleMap, [projectId, moduleId, "is_favorite"], true);
      });

      await this.moduleService.addModuleToFavorites(workspaceSlug, projectId, {
        module: moduleId,
      });
    } catch (error) {
      console.error("Failed to add module to favorites in module store", error);

      runInAction(() => {
        set(this.moduleMap, [projectId, moduleId, "is_favorite"], false);
      });
    }
  };

  removeModuleFromFavorites = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      const currentModule = this.moduleMap[projectId][moduleId];

      if (!currentModule.is_favorite) return;

      runInAction(() => {
        set(this.moduleMap, [projectId, moduleId, "is_favorite"], false);
      });

      await this.moduleService.removeModuleFromFavorites(workspaceSlug, projectId, moduleId);
    } catch (error) {
      console.error("Failed to remove module from favorites in module store", error);

      runInAction(() => {
        set(this.moduleMap, [projectId, moduleId, "is_favorite"], true);
      });
    }
  };
}
