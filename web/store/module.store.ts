import { action, computed, observable, makeObservable, runInAction } from "mobx";
import { set } from "lodash";
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
  moduleMap: Record<string, IModule>;
  // computed
  projectModules: string[] | null;
  // computed actions
  getModuleById: (moduleId: string) => IModule | null;
  // actions
  fetchModules: (workspaceSlug: string, projectId: string) => Promise<IModule[]>;
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
}

export class ModulesStore implements IModuleStore {
  // states
  loader: boolean = false;
  error: any | null = null;
  // observables
  moduleMap: Record<string, IModule> = {};
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
      moduleMap: observable,
      // computed
      projectModules: computed,
      // computed actions
      getModuleById: action,
      // actions
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
    });

    this.rootStore = _rootStore;

    // services
    this.projectService = new ProjectService();
    this.moduleService = new ModuleService();
  }

  // computed
  get projectModules() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId) return null;

    const projectModules = Object.keys(this.moduleMap).filter(
      (moduleId) => this.moduleMap?.[moduleId]?.project === projectId
    );

    return projectModules || null;
  }

  getModuleById = (moduleId: string) => this.moduleMap?.[moduleId] || null;

  // actions
  fetchModules = async (workspaceSlug: string, projectId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const modulesResponse = await this.moduleService.getModules(workspaceSlug, projectId);

      runInAction(() => {
        modulesResponse.forEach((module) => {
          set(this.moduleMap, [module.id], module);
        });
        this.loader = false;
        this.error = null;
      });

      return modulesResponse;
    } catch (error) {
      console.error("Failed to fetch modules list in module store", error);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
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
        set(this.moduleMap, [moduleId], response);
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
        set(this.moduleMap, [response?.id], response);
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
      const moduleDetails = this.getModuleById(moduleId);

      runInAction(() => {
        set(this.moduleMap, [moduleId], { ...moduleDetails, ...data });
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
      const moduleDetails = this.getModuleById(moduleId);

      if (!moduleDetails) return;

      runInAction(() => {
        delete this.moduleMap[moduleId];
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

      runInAction(() => {
        set(this.moduleMap, [moduleId, "link_module"], [response]);
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

      const moduleDetails = this.getModuleById(moduleId);
      const linkModules = moduleDetails?.link_module.map((link) => (link.id === linkId ? response : link));

      runInAction(() => {
        set(this.moduleMap, [moduleId, "link_module"], linkModules);
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
      const moduleDetails = this.getModuleById(moduleId);
      const linkModules = moduleDetails?.link_module.filter((link) => link.id !== linkId);

      runInAction(() => {
        set(this.moduleMap, [moduleId, "link_module"], linkModules);
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
      const moduleDetails = this.getModuleById(moduleId);

      if (moduleDetails?.is_favorite) return;

      runInAction(() => {
        set(this.moduleMap, [moduleId, "is_favorite"], true);
      });

      await this.moduleService.addModuleToFavorites(workspaceSlug, projectId, {
        module: moduleId,
      });
    } catch (error) {
      console.error("Failed to add module to favorites in module store", error);

      runInAction(() => {
        set(this.moduleMap, [moduleId, "is_favorite"], false);
      });
    }
  };

  removeModuleFromFavorites = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      const moduleDetails = this.getModuleById(moduleId);

      if (!moduleDetails?.is_favorite) return;

      runInAction(() => {
        set(this.moduleMap, [moduleId, "is_favorite"], false);
      });

      await this.moduleService.removeModuleFromFavorites(workspaceSlug, projectId, moduleId);
    } catch (error) {
      console.error("Failed to remove module from favorites in module store", error);

      runInAction(() => {
        set(this.moduleMap, [moduleId, "is_favorite"], true);
      });
    }
  };
}
