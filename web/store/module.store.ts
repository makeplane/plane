import { action, computed, observable, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
import sortBy from "lodash/sortBy";
// services
import { ProjectService } from "services/project";
import { ModuleService } from "services/module.service";
// types
import { IModule, ILinkDetails } from "@plane/types";
import { RootStore } from "store/root.store";

export interface IModuleStore {
  //Loaders
  loader: boolean;
  fetchedMap: Record<string, boolean>;
  // observables
  moduleMap: Record<string, IModule>;
  // computed
  projectModuleIds: string[] | null;
  // computed actions
  getModuleById: (moduleId: string) => IModule | null;
  getProjectModuleIds: (projectId: string) => string[] | null;
  // actions
  // fetch
  fetchModules: (workspaceSlug: string, projectId: string) => Promise<undefined | IModule[]>;
  fetchModuleDetails: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<IModule>;
  // crud
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
  // favorites
  addModuleToFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
  removeModuleFromFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
}

export class ModulesStore implements IModuleStore {
  // observables
  loader: boolean = false;
  moduleMap: Record<string, IModule> = {};
  //loaders
  fetchedMap: Record<string, boolean> = {};
  // root store
  rootStore;
  // services
  projectService;
  moduleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      moduleMap: observable,
      fetchedMap: observable,
      // computed
      projectModuleIds: computed,
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
  /**
   * get all module ids for the current project
   */
  get projectModuleIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return null;
    let projectModules = Object.values(this.moduleMap).filter((m) => m.project === projectId);
    projectModules = sortBy(projectModules, [(m) => !m.is_favorite, (m) => m.name.toLowerCase()]);
    const projectModuleIds = projectModules.map((m) => m.id);
    return projectModuleIds || null;
  }

  /**
   * @description get module by id
   * @param moduleId
   * @returns IModule | null
   */
  getModuleById = computedFn((moduleId: string) => this.moduleMap?.[moduleId] || null);

  /**
   * @description returns list of module ids of the project id passed as argument
   * @param projectId
   */
  getProjectModuleIds = computedFn((projectId: string) => {
    if (!this.fetchedMap[projectId]) return null;

    let projectModules = Object.values(this.moduleMap).filter((m) => m.project === projectId);
    projectModules = sortBy(projectModules, [(m) => !m.is_favorite, (m) => m.name.toLowerCase()]);
    const projectModuleIds = projectModules.map((m) => m.id);
    return projectModuleIds;
  });

  /**
   * @description fetch all modules
   * @param workspaceSlug
   * @param projectId
   * @returns IModule[]
   */
  fetchModules = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      await this.moduleService.getModules(workspaceSlug, projectId).then((response) => {
        runInAction(() => {
          response.forEach((module) => {
            set(this.moduleMap, [module.id], { ...this.moduleMap[module.id], ...module });
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
   * @description fetch module details
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @returns IModule
   */
  fetchModuleDetails = async (workspaceSlug: string, projectId: string, moduleId: string) =>
    await this.moduleService.getModuleDetails(workspaceSlug, projectId, moduleId).then((response) => {
      runInAction(() => {
        set(this.moduleMap, [moduleId], response);
      });
      return response;
    });

  /**
   * @description creates a new module
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns IModule
   */
  createModule = async (workspaceSlug: string, projectId: string, data: Partial<IModule>) =>
    await this.moduleService.createModule(workspaceSlug, projectId, data).then((response) => {
      runInAction(() => {
        set(this.moduleMap, [response?.id], response);
      });
      this.fetchModules(workspaceSlug, projectId);
      return response;
    });

  /**
   * @description updates module details
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @param data
   * @returns IModule
   */
  updateModuleDetails = async (workspaceSlug: string, projectId: string, moduleId: string, data: Partial<IModule>) => {
    const originalModuleDetails = this.getModuleById(moduleId);
    try {
      runInAction(() => {
        set(this.moduleMap, [moduleId], { ...originalModuleDetails, ...data });
      });
      const response = await this.moduleService.patchModule(workspaceSlug, projectId, moduleId, data);
      return response;
    } catch (error) {
      console.error("Failed to update module in module store", error);
      runInAction(() => {
        set(this.moduleMap, [moduleId], { ...originalModuleDetails });
      });
      throw error;
    }
  };

  /**
   * @description deletes a module
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   */
  deleteModule = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    const moduleDetails = this.getModuleById(moduleId);
    if (!moduleDetails) return;
    await this.moduleService.deleteModule(workspaceSlug, projectId, moduleId).then(() => {
      runInAction(() => {
        delete this.moduleMap[moduleId];
      });
    });
  };

  /**
   * @description creates a new module link
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @param data
   * @returns ILinkDetails
   */
  createModuleLink = async (workspaceSlug: string, projectId: string, moduleId: string, data: Partial<ILinkDetails>) =>
    await this.moduleService.createModuleLink(workspaceSlug, projectId, moduleId, data).then((response) => {
      runInAction(() => {
        set(this.moduleMap, [moduleId, "link_module"], [response]);
      });
      return response;
    });

  /**
   * @description updates module link details
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @param linkId
   * @param data
   * @returns ILinkDetails
   */
  updateModuleLink = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    linkId: string,
    data: Partial<ILinkDetails>
  ) => {
    const originalModuleDetails = this.getModuleById(moduleId);
    try {
      const linkModules = originalModuleDetails?.link_module.map((link) =>
        link.id === linkId ? { ...link, ...data } : link
      );
      runInAction(() => {
        set(this.moduleMap, [moduleId, "link_module"], linkModules);
      });
      const response = await this.moduleService.updateModuleLink(workspaceSlug, projectId, moduleId, linkId, data);
      return response;
    } catch (error) {
      console.error("Failed to update module link in module store", error);
      runInAction(() => {
        set(this.moduleMap, [moduleId, "link_module"], originalModuleDetails?.link_module);
      });
      throw error;
    }
  };

  /**
   * @description deletes a module link
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @param linkId
   */
  deleteModuleLink = async (workspaceSlug: string, projectId: string, moduleId: string, linkId: string) =>
    await this.moduleService.deleteModuleLink(workspaceSlug, projectId, moduleId, linkId).then(() => {
      const moduleDetails = this.getModuleById(moduleId);
      const linkModules = moduleDetails?.link_module.filter((link) => link.id !== linkId);
      runInAction(() => {
        set(this.moduleMap, [moduleId, "link_module"], linkModules);
      });
    });

  /**
   * @description adds a module to favorites
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @returns
   */
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

  /**
   * @description removes a module from favorites
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @returns
   */
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
